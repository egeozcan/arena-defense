import {
  clearPosition,
  grip,
  VEHICLES,
  type Arena,
  type Obstacle,
  type OwnedVehicle,
} from './data';
import { terrainRouteCost } from './capabilities';

export type HayVehicle = Pick<OwnedVehicle, 'kind' | 'upgrades'>;
export interface HayBody {
  id: number;
  x: number;
  z: number;
  radius: number;
  vehicle?: HayVehicle;
}

export function hayHandling(v: HayVehicle) {
  const tier = v.upgrades.traction;
  const crusher =
    v.kind === 'harvester' ||
    v.kind === 'excavator' ||
    (v.kind === 'bulldozer' && v.upgrades.unique >= 3);
  const pusher = v.kind === 'bulldozer' || v.kind === 'baler' || v.kind === 'mixer' || tier >= 3;
  const force =
    VEHICLES[v.kind].traction +
    Math.min(2, tier) * 0.1 +
    (tier >= 3 ? 0.2 : 0) +
    (tier >= 4 ? 0.1 : 0) +
    (tier === 5 ? 0.2 : 0);
  return {
    mode: crusher ? ('crush' as const) : pusher ? ('push' as const) : ('detour' as const),
    force,
    pushSpeed: 1.2 + force * 1.6,
    crushRate:
      (v.kind === 'harvester' ? 1.4 : v.kind === 'bulldozer' ? 1.1 : 0.9) * (1 + tier * 0.12),
  };
}

export function hayLabel(v: HayVehicle) {
  const h = hayHandling(v);
  return h.mode === 'crush'
    ? 'Crushes loose hay'
    : h.mode === 'push'
      ? 'Pushes loose hay; needs space'
      : 'Routes around hay';
}

export function touchesHay(o: Obstacle, x: number, z: number, radius: number) {
  return (
    Math.hypot(Math.max(0, Math.abs(x - o.x) - o.w / 2), Math.max(0, Math.abs(z - o.z) - o.d / 2)) <
    radius + 0.08
  );
}

export function hayOnSweep(arena: Arena, self: HayBody, x: number, z: number) {
  const pad = self.radius + 0.08;
  return arena.obstacles.some(
    (o) =>
      o.loose &&
      o.x + o.w / 2 > Math.min(self.x, x) - pad &&
      o.x - o.w / 2 < Math.max(self.x, x) + pad &&
      o.z + o.d / 2 > Math.min(self.z, z) - pad &&
      o.z - o.d / 2 < Math.max(self.z, z) + pad,
  );
}

// Rectangular bale clearance: pushing never shoves hay through walls, stacks,
// another bale, or a teammate. No chain-pushing or diagonal corner tunneling.
function baleFits(
  arena: Arena,
  bale: Obstacle,
  x: number,
  z: number,
  bodies: HayBody[],
  self: number,
) {
  if (
    x - bale.w / 2 < 0.1 ||
    z - bale.d / 2 < 0.1 ||
    x + bale.w / 2 > arena.width - 0.1 ||
    z + bale.d / 2 > arena.depth - 0.1
  )
    return false;
  if (
    arena.obstacles.some(
      (o) =>
        o !== bale &&
        Math.abs(x - o.x) < (bale.w + o.w) / 2 + 0.08 &&
        Math.abs(z - o.z) < (bale.d + o.d) / 2 + 0.08,
    )
  )
    return false;
  return bodies.every((b) => b.id === self || !touchesHay({ ...bale, x, z }, b.x, b.z, b.radius));
}

export interface HayContact {
  bale: Obstacle;
  x: number;
  z: number;
}
// Pure prediction shared by routing, steering rollouts, and actual movement.
// A prediction never alters the arena. The engine commits only a successful sweep.
export function hayContacts(
  arena: Arena,
  self: HayBody,
  x: number,
  z: number,
  bodies: HayBody[],
  maxPush = Infinity,
): HayContact[] | null {
  const contacts: HayContact[] = [];
  const dx = x - self.x,
    dz = z - self.z,
    distance = Math.hypot(dx, dz);
  const h = self.vehicle && hayHandling(self.vehicle);
  const fixed = { ...arena, obstacles: arena.obstacles.filter((o) => !o.loose) };
  const samples = Math.max(1, Math.ceil(distance / 0.2));
  for (let i = 1; i <= samples; i++) {
    const px = self.x + (dx * i) / samples,
      pz = self.z + (dz * i) / samples;
    if (!clearPosition(fixed, px, pz, self.radius)) return null;
    for (const bale of arena.obstacles) {
      if (!bale.loose || !touchesHay(bale, px, pz, self.radius)) continue;
      if (!h || h.mode === 'detour') return null;
      if (h.mode === 'crush') {
        if (!contacts.some((c) => c.bale === bale)) contacts.push({ bale, x: bale.x, z: bale.z });
        continue;
      }
      // Mud needs stronger grip; boosting does not increase pushing force.
      if (!distance || h.force * (0.65 + 0.35 * grip(arena, bale.x, bale.z)) < 0.48) return null;
      let low = 0,
        high = distance + self.radius * 2 + Math.max(bale.w, bale.d);
      for (let j = 0; j < 16; j++) {
        const mid = (low + high) / 2;
        if (
          touchesHay(
            { ...bale, x: bale.x + (dx / distance) * mid, z: bale.z + (dz / distance) * mid },
            px,
            pz,
            self.radius,
          )
        )
          low = mid;
        else high = mid;
      }
      if (high > maxPush + 0.002) return null;
      // Validate the entire bale sweep, including bale width at tight corners.
      const steps = Math.max(1, Math.ceil(high / 0.15));
      for (let j = 1; j <= steps; j++)
        if (
          !baleFits(
            arena,
            bale,
            bale.x + ((dx / distance) * high * j) / steps,
            bale.z + ((dz / distance) * high * j) / steps,
            bodies,
            self.id,
          )
        )
          return null;
      const contact = {
        bale,
        x: bale.x + (dx / distance) * high,
        z: bale.z + (dz / distance) * high,
      };
      const previous = contacts.find((c) => c.bale === bale);
      if (previous) Object.assign(previous, contact);
      else contacts.push(contact);
    }
  }
  // Simultaneously pushed bales must not overlap either.
  if (
    contacts.some((a, i) =>
      contacts
        .slice(i + 1)
        .some(
          (b) =>
            Math.abs(a.x - b.x) < (a.bale.w + b.bale.w) / 2 + 0.08 &&
            Math.abs(a.z - b.z) < (a.bale.d + b.bale.d) / 2 + 0.08,
        ),
    )
  )
    return null;
  return contacts;
}

export function hayDriveSpeed(arena: Arena, self: HayBody, speed: number) {
  if (!self.vehicle) return speed;
  const h = hayHandling(self.vehicle);
  return h.mode === 'push' &&
    arena.obstacles.some((o) => o.loose && touchesHay(o, self.x, self.z, self.radius + 0.5))
    ? Math.min(speed, h.pushSpeed)
    : speed;
}

export function hayRouteCost(arena: Arena, v: OwnedVehicle, x: number, z: number, radius: number) {
  const h = hayHandling(v);
  const surface = grip(arena, x, z);
  const contact = arena.obstacles.some((o) => o.loose && touchesHay(o, x, z, radius));
  // Extra time estimates favor an easy detour over clearing an unnecessary bale.
  return (
    terrainRouteCost(v, surface) +
    (contact
      ? h.mode === 'crush'
        ? VEHICLES[v.kind].speed / h.crushRate
        : VEHICLES[v.kind].speed / h.pushSpeed
      : 0)
  );
}
