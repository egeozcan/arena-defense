import { BALLOONS, type OwnedVehicle, type VehicleKind } from './data';
import { canTargetBalloon, vehicleStats, vehicleTool } from './capabilities';
import { inWindCone, toolVictims } from './vehicle-tools';

export interface DriverInput {
  // Optional so replays recorded before side switching still face the front.
  side?: 'front' | 'rear';
  throttle: number;
  steer: number;
  brake: boolean;
  fire: boolean;
  yaw: number;
  pitch: number;
}

export function driverEye(
  kind: VehicleKind,
  side: 'front' | 'rear' = 'front',
): [number, number, number] {
  // Look over the rear engine cover rather than through it at the low cutter.
  if (side === 'rear') return [0, 2.3, -0.45];
  // Taller equipment needs a raised seat; the mixer's cab sits ahead of its drum.
  if (kind === 'blower') return [0, 3.45, 0.18];
  if (kind === 'baler') return [0, 3.35, 0.18];
  if (kind === 'mixer') return [0, 1.85, 1.75];
  return [kind === 'excavator' ? -0.35 : kind === 'crane' ? -0.45 : 0, 2.05, 0.18];
}
export const DRIVER_LOOK_LIMIT = 2.55;
export function driverViewPitch(side: 'front' | 'rear' = 'front') {
  return side === 'rear' ? -0.5 : -0.16;
}
export const neutralDriverInput = (): DriverInput => ({
  side: 'front',
  throttle: 0,
  steer: 0,
  brake: false,
  fire: false,
  yaw: 0,
  pitch: driverViewPitch(),
});

const bounded = (n: number, min: number, max: number, fallback = 0) =>
  Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;

export function sanitizeDriverInput(input: DriverInput, vehicle?: OwnedVehicle): DriverInput {
  return {
    side: input.side === 'rear' && (!vehicle || canSwitchDriverSide(vehicle)) ? 'rear' : 'front',
    throttle: bounded(input.throttle, -1, 1),
    steer: bounded(input.steer, -1, 1),
    brake: input.brake === true,
    fire: input.fire === true,
    yaw: bounded(input.yaw, -DRIVER_LOOK_LIMIT, DRIVER_LOOK_LIMIT),
    pitch: bounded(input.pitch, -1.15, 1.25, -0.16),
  };
}

export function isCrawler(kind: VehicleKind) {
  return kind === 'excavator' || kind === 'crane' || kind === 'bulldozer';
}

type DriverVehicle = Pick<OwnedVehicle, 'kind'> & Partial<Pick<OwnedVehicle, 'upgrades'>>;

export function canSwitchDriverSide(vehicle: DriverVehicle) {
  return !!vehicle.upgrades && vehicleTool({ kind: vehicle.kind, upgrades: vehicle.upgrades }).rear;
}

export function driverSide(vehicle: DriverVehicle, input: DriverInput): 'front' | 'rear' {
  return input.side === 'rear' && canSwitchDriverSide(vehicle) ? 'rear' : 'front';
}

export function driverViewAngle(vehicle: DriverVehicle & { angle: number }, input: DriverInput) {
  return vehicle.angle + (driverSide(vehicle, input) === 'rear' ? Math.PI : 0) + input.yaw;
}

// W always moves toward the selected tool. Reversed wheel steering preserves
// left/right from that seat; crawler pivot steering is independent of travel.
export function driverMotionInput(vehicle: DriverVehicle, input: DriverInput) {
  const rear = driverSide(vehicle, input) === 'rear';
  return {
    throttle: input.throttle * (rear ? -1 : 1),
    steer: input.steer * (rear && !isCrawler(vehicle.kind) ? -1 : 1),
  };
}

// Fixed chassis tools work on contact. Valves, launchers and hydraulic strokes
// remain deliberate player actions; every new chassis must declare its control.
export const DRIVER_TOOL_ACTIVATION = {
  harvester: 'contact',
  sprayer: 'trigger',
  excavator: 'trigger',
  crane: 'trigger',
  baler: 'trigger',
  blower: 'trigger',
  bulldozer: 'contact',
  mixer: 'trigger',
} as const satisfies Record<VehicleKind, 'contact' | 'trigger'>;

export function isContactTool(kind: VehicleKind) {
  return DRIVER_TOOL_ACTIVATION[kind] === 'contact';
}

type AimVehicle = DriverVehicle & { x: number; z: number; angle: number };
type AimBalloon = { id: number; kind: keyof typeof BALLOONS; x: number; y: number; z: number };

// Use the full tool area rather than requiring a balloon under the reticle.
// Contact tools follow the chassis; sprays and airflow follow the driver's aim.
export function driverAreaTargets<
  T extends { id: number; x: number; y: number; z: number; armor: boolean },
>(
  vehicle: OwnedVehicle & { angle: number },
  balloons: T[],
  angle: number,
  side?: 'front' | 'rear',
): T[] {
  const tool = vehicleTool(vehicle);
  if (!tool.cone) return [];
  const eligible = balloons.filter((b) => canTargetBalloon(vehicle, b.y, b.armor));
  if (!eligible.length) return [];
  // The HUD can show contacts at the viewed end while combat keeps both ends live.
  const victims = toolVictims(vehicle, eligible[0], eligible, vehicle.x, vehicle.z, angle);
  return (
    side === undefined
      ? victims
      : victims.filter((b) =>
          inWindCone(
            b.x - vehicle.x,
            b.z - vehicle.z,
            angle + (side === 'rear' ? Math.PI : 0),
            vehicleStats(vehicle).range,
            tool.cone,
          ),
        )
  ).sort(
    (a, b) =>
      Math.hypot(a.x - vehicle.x, a.z - vehicle.z) - Math.hypot(b.x - vehicle.x, b.z - vehicle.z) ||
      a.id - b.id,
  );
}

// Both the reticle and fixed-step combat use this forgiving aim cone. Choose what
// the player sees before checking reach/armor, so an immune balloon cannot be shot through.
export function driverTarget<T extends AimBalloon>(
  vehicle: AimVehicle,
  input: DriverInput,
  balloons: T[],
): T | undefined {
  const angle = driverViewAngle(vehicle, input);
  const fx = Math.sin(angle) * Math.cos(input.pitch);
  const fy = Math.sin(input.pitch);
  const fz = Math.cos(angle) * Math.cos(input.pitch);
  const [cabX, cabY, cabZ] = driverEye(vehicle.kind, driverSide(vehicle, input));
  const sx = vehicle.x + Math.sin(vehicle.angle) * cabZ + Math.cos(vehicle.angle) * cabX;
  const sz = vehicle.z + Math.cos(vehicle.angle) * cabZ - Math.sin(vehicle.angle) * cabX;
  let best: T | undefined;
  let bestScore = Infinity;
  let direct: T | undefined;
  let nearestHit = Infinity;
  for (const b of balloons) {
    const dx = b.x - sx,
      dy = b.y - cabY,
      dz = b.z - sz;
    const distance = Math.hypot(dx, dy, dz);
    if (distance < 0.01 || distance > 65) continue;
    const dot = (dx * fx + dy * fy + dz * fz) / distance;
    const along = dot * distance;
    const radius = BALLOONS[b.kind].radius;
    const lateralSquared = Math.max(0, distance * distance - along * along);
    if (along > 0 && lateralSquared <= radius * radius) {
      const hit = along - Math.sqrt(radius * radius - lateralSquared);
      if (hit < nearestHit) {
        direct = b;
        nearestHit = hit;
      }
    }
    const tolerance = Math.min(0.65, 0.12 + Math.atan2(BALLOONS[b.kind].radius, distance));
    if (dot < Math.cos(tolerance)) continue;
    const score = (1 - dot) * 30 + distance * 0.012;
    if (score < bestScore || (score === bestScore && b.id < (best?.id ?? Infinity))) {
      best = b;
      bestScore = score;
    }
  }
  return direct ?? best;
}
