import { clearPosition, touchesObstacle, type Arena, type Obstacle } from './data';
import { hayContacts, hayOnSweep, type HayVehicle } from './hay';

export interface TrafficBody {
  id: number;
  x: number;
  z: number;
  radius: number;
  vehicle?: HayVehicle;
}

// A steering decision makes thousands of short sweeps against unchanged scenery.
// Cache nearby obstacles per cell for that decision only; hay can move next tick.
// Results match canTravel(arena, self, x, z, bodies) exactly.
export function createTravelProbe(arena: Arena, radius: number, bodies: TrafficBody[]) {
  const hay = { obstacles: arena.obstacles.filter((o) => o.loose) };
  const cells: Obstacle[][] = [];
  const edge = radius + 0.1,
    farX = arena.width - radius - 0.1,
    farZ = arena.depth - radius - 0.1;
  const clearAt = (x: number, z: number) => {
    if (x < edge || z < edge || x > farX || z > farZ) return false;
    const cx = Math.floor(x),
      cz = Math.floor(z),
      id = cz * arena.width + cx;
    let local = cells[id];
    if (!local) {
      const pad = radius + 0.08 + 1e-9;
      local = cells[id] = arena.obstacles.filter(
        (o) =>
          o.x + o.w / 2 + pad > cx &&
          o.x - o.w / 2 - pad < cx + 1 &&
          o.z + o.d / 2 + pad > cz &&
          o.z - o.d / 2 - pad < cz + 1,
      );
    }
    for (let i = 0; i < local.length; i++)
      if (touchesObstacle(local[i], x, z, radius)) return false;
    return true;
  };
  return (self: TrafficBody, x: number, z: number) => {
    const dx = x - self.x,
      dz = z - self.z,
      length2 = dx * dx + dz * dz;
    if (hayOnSweep(hay, self, x, z)) {
      if (!hayContacts(arena, self, x, z, bodies)) return false;
    } else {
      const samples = Math.max(1, Math.ceil(Math.sqrt(length2) / 0.2));
      for (let i = 1; i <= samples; i++)
        if (!clearAt(self.x + (dx * i) / samples, self.z + (dz * i) / samples)) return false;
    }
    return bodiesClear(self, x, z, dx, dz, length2, bodies);
  };
}

// Inflate parked and moving vehicles by the querying vehicle's chassis radius.
export function trafficCells(arena: Arena, self: TrafficBody, bodies: TrafficBody[]) {
  const occupied = new Set<number>();
  for (const other of bodies) {
    if (other.id === self.id) continue;
    const clearance = self.radius + other.radius + 0.08;
    for (
      let z = Math.max(0, Math.floor(other.z - clearance));
      z < Math.min(arena.depth, Math.ceil(other.z + clearance));
      z++
    )
      for (
        let x = Math.max(0, Math.floor(other.x - clearance));
        x < Math.min(arena.width, Math.ceil(other.x + clearance));
        x++
      )
        if (Math.hypot(x + 0.5 - other.x, z + 0.5 - other.z) < clearance)
          occupied.add(z * arena.width + x);
  }
  return occupied;
}

// Sweep the chassis along the whole step: fast/boosted vehicles cannot tunnel through traffic.
export function canTravel(
  arena: Arena,
  self: TrafficBody,
  x: number,
  z: number,
  bodies: TrafficBody[],
) {
  const dx = x - self.x,
    dz = z - self.z,
    length2 = dx * dx + dz * dz;
  const samples = Math.max(1, Math.ceil(Math.sqrt(length2) / 0.2));
  if (hayOnSweep(arena, self, x, z)) {
    if (!hayContacts(arena, self, x, z, bodies)) return false;
  } else
    for (let i = 1; i <= samples; i++)
      if (
        !clearPosition(arena, self.x + (dx * i) / samples, self.z + (dz * i) / samples, self.radius)
      )
        return false;
  return bodiesClear(self, x, z, dx, dz, length2, bodies);
}

function bodiesClear(
  self: TrafficBody,
  x: number,
  z: number,
  dx: number,
  dz: number,
  length2: number,
  bodies: TrafficBody[],
) {
  const minX = Math.min(self.x, x),
    maxX = Math.max(self.x, x),
    minZ = Math.min(self.z, z),
    maxZ = Math.max(self.z, z);
  for (const other of bodies) {
    if (other.id === self.id) continue;
    const clearance = self.radius + other.radius + 0.02;
    // Most teammates are far from a short steering rollout. Reject them with
    // the sweep's bounds before computing the exact segment/circle distance.
    if (
      other.x < minX - clearance ||
      other.x > maxX + clearance ||
      other.z < minZ - clearance ||
      other.z > maxZ + clearance
    )
      continue;
    const t = length2
      ? Math.max(0, Math.min(1, ((other.x - self.x) * dx + (other.z - self.z) * dz) / length2))
      : 0;
    const distance = Math.hypot(self.x + dx * t - other.x, self.z + dz * t - other.z);
    const startDistance = Math.hypot(self.x - other.x, self.z - other.z);
    if (startDistance < clearance) {
      if (!(Math.hypot(x - other.x, z - other.z) > startDistance + 1e-6)) return false;
    } else if (!(distance >= clearance)) return false;
  }
  return true;
}

export function yieldPath(
  arena: Arena,
  self: TrafficBody,
  angle: number,
  bodies: TrafficBody[],
): [number, number][] {
  // Pull to the right first; opposing traffic then pulls to opposite sides of a lane.
  for (const turn of [Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI * 0.75, -Math.PI * 0.75]) {
    const x = self.x + Math.sin(angle + turn) * 2.5;
    const z = self.z + Math.cos(angle + turn) * 2.5;
    if (canTravel(arena, self, x, z, bodies)) return [[x, z]];
  }
  return [];
}
