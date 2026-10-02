import { BALLOONS, type Arena, type BalloonKind, type Random } from './data';

interface Drifter {
  x: number;
  y: number;
  z: number;
  dx: number;
  dz: number;
  kind: BalloonKind;
  fleeing: boolean;
}

export function chooseBalloonHeading(
  arena: Arena,
  b: Drifter,
  vehicles: readonly { x: number; z: number }[],
  rng: Random,
) {
  const heading = Math.atan2(b.dz, b.dx);
  let desired = heading + (rng.next() - 0.5) * 1.1;
  let nearest: { x: number; z: number } | undefined;
  let distance = b.fleeing ? 5 : 2.8;
  for (const vehicle of vehicles) {
    const gap = Math.hypot(vehicle.x - b.x, vehicle.z - b.z);
    if (gap < distance) {
      nearest = vehicle;
      distance = gap;
    }
  }
  const dodge = !!nearest && (b.fleeing || rng.next() < 0.45);
  if (nearest && dodge) {
    const away = Math.atan2(b.z - nearest.z, b.x - nearest.x);
    const turn = Math.atan2(Math.sin(away - heading), Math.cos(away - heading));
    const limit = b.kind === 'armored' ? 0.45 : b.fleeing ? 2 : 1.2;
    desired = heading + Math.max(-limit, Math.min(limit, turn));
  }
  const radius = BALLOONS[b.kind].radius + 0.15;
  const clear = (angle: number) => {
    for (const step of [0.7, 1.5, 2.4]) {
      const x = b.x + Math.cos(angle) * step,
        z = b.z + Math.sin(angle) * step;
      if (x < radius || z < radius || x > arena.width - radius || z > arena.depth - radius)
        return false;
      if (
        arena.obstacles.some(
          (o) =>
            b.y - BALLOONS[b.kind].radius < o.h &&
            Math.abs(x - o.x) < o.w / 2 + radius &&
            Math.abs(z - o.z) < o.d / 2 + radius,
        )
      )
        return false;
    }
    return true;
  };
  // Choose an open heading only on a decision tick. Physics can still bounce between decisions.
  const options = [
    desired,
    desired + Math.PI / 4,
    desired - Math.PI / 4,
    desired + Math.PI / 2,
    desired - Math.PI / 2,
    desired + Math.PI,
  ];
  const chosen = options.find(clear) ?? Math.atan2(arena.depth / 2 - b.z, arena.width / 2 - b.x);
  return { dx: Math.cos(chosen), dz: Math.sin(chosen), dodge };
}
