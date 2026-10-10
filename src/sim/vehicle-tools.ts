import type { Arena, OwnedVehicle } from './data';
import { vehicleStats, vehicleTool } from './capabilities';

// Geometry shared by travelling bales and wind cones. No render-frame state enters combat.
export function balePathClear(
  arena: Arena,
  sx: number,
  sz: number,
  tx: number,
  ty: number,
  tz: number,
  radius: number,
) {
  const distance = Math.hypot(tx - sx, tz - sz);
  const rise = Math.max(0.3, Math.min(2, distance));
  for (const o of arena.obstacles) {
    let enter = 0,
      leave = 1;
    for (const [from, delta, low, high] of [
      [sx, tx - sx, o.x - o.w / 2 - radius, o.x + o.w / 2 + radius],
      [sz, tz - sz, o.z - o.d / 2 - radius, o.z + o.d / 2 + radius],
    ]) {
      if (Math.abs(delta) < 1e-8) {
        if (from < low || from > high) {
          enter = 2;
          break;
        }
      } else {
        const a = (low - from) / delta,
          b = (high - from) / delta;
        enter = Math.max(enter, Math.min(a, b));
        leave = Math.min(leave, Math.max(a, b));
      }
    }
    if (enter > leave) continue;
    const height = (t: number) => 1.3 + (ty - 1.3) * Math.min(1, (t * distance) / rise);
    if (Math.min(height(enter), height(leave)) < o.h + radius) return false;
  }
  return true;
}
export function segmentDistance(
  x: number,
  y: number,
  z: number,
  from: [number, number, number],
  to: [number, number, number],
) {
  const dx = to[0] - from[0],
    dy = to[1] - from[1],
    dz = to[2] - from[2];
  const length = dx * dx + dy * dy + dz * dz;
  const t = length
    ? Math.max(
        0,
        Math.min(1, ((x - from[0]) * dx + (y - from[1]) * dy + (z - from[2]) * dz) / length),
      )
    : 0;
  return Math.hypot(x - from[0] - t * dx, y - from[1] - t * dy, z - from[2] - t * dz);
}

export function inWindCone(
  dx: number,
  dz: number,
  angle: number,
  range: number,
  halfAngle: number,
) {
  const distance = Math.hypot(dx, dz);
  return (
    distance <= range &&
    (distance < 0.01 ||
      (dx * Math.sin(angle) + dz * Math.cos(angle)) / distance >= Math.cos(halfAngle))
  );
}

type ToolTarget = { id: number; x: number; y: number; z: number };

// A rear header is a working tool, including when the only target is behind.
// Use the same facing rule before braking and immediately before the attack.
export function toolFacing(v: OwnedVehicle, bearing: number, angle: number) {
  if (v.kind !== 'harvester' && v.kind !== 'bulldozer') return true;
  const difference = Math.abs(Math.atan2(Math.sin(bearing - angle), Math.cos(bearing - angle)));
  const tolerance = v.kind === 'harvester' ? 0.85 : 0.7;
  return difference <= tolerance || (vehicleTool(v).rear && Math.PI - difference <= tolerance);
}

// Candidates already satisfy height/armor eligibility. Target splash can extend
// beyond arm range; a second hook must choose its own center within boom range.
export function toolVictims<T extends ToolTarget>(
  v: OwnedVehicle,
  target: T,
  candidates: T[],
  x: number,
  z: number,
  angle: number,
): T[] {
  const s = vehicleStats(v),
    tool = vehicleTool(v);
  if (v.kind === 'baler') return [];
  if (tool.cone)
    return candidates.filter(
      (b) =>
        inWindCone(b.x - x, b.z - z, angle, s.range, tool.cone) ||
        (tool.rear && inWindCone(b.x - x, b.z - z, angle + Math.PI, s.range, tool.cone)),
    );
  const centers = [
    target,
    ...candidates.filter(
      (b) =>
        b.id !== target.id &&
        Math.hypot(b.x - x, b.z - z) <= s.range &&
        (tool.splash === 0 || Math.hypot(b.x - target.x, b.z - target.z) >= tool.splash),
    ),
  ].slice(0, tool.targets);
  return candidates.filter(
    (b) =>
      centers.some(
        (center) =>
          b.id === center.id ||
          (tool.splash > 0 && Math.hypot(b.x - center.x, b.z - center.z) < tool.splash),
      ) ||
      (tool.shockwave > 0 && b.y < 1 && Math.hypot(b.x - x, b.z - z) < tool.shockwave),
  );
}
