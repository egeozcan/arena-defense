import { clearPosition, type Arena } from './data';

export interface TrafficBody {
  id: number;
  x: number;
  z: number;
  radius: number;
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
  for (let i = 1; i <= samples; i++)
    if (
      !clearPosition(arena, self.x + (dx * i) / samples, self.z + (dz * i) / samples, self.radius)
    )
      return false;
  return bodies.every((other) => {
    if (other.id === self.id) return true;
    const t = length2
      ? Math.max(0, Math.min(1, ((other.x - self.x) * dx + (other.z - self.z) * dz) / length2))
      : 0;
    const distance = Math.hypot(self.x + dx * t - other.x, self.z + dz * t - other.z);
    const startDistance = Math.hypot(self.x - other.x, self.z - other.z);
    if (startDistance < self.radius + other.radius + 0.02)
      return Math.hypot(x - other.x, z - other.z) > startDistance + 1e-6;
    return distance >= self.radius + other.radius + 0.02;
  });
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
