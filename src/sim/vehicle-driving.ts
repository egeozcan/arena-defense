import type { Arena, VehicleKind } from './data';
import { canTravel, type TrafficBody } from './traffic';
import {
  angleDifference,
  driveVehicle,
  MAX_STEER,
  type DriveControl,
  type VehicleMotion,
} from './vehicle-motion';

interface DrivingGoal {
  x: number;
  z: number;
  faceDirection?: { x: number; z: number };
  faceTarget?: { x: number; z: number; range: number };
}

interface Pose {
  motion: VehicleMotion;
  x: number;
  z: number;
  first: DriveControl | null;
  last: DriveControl | null;
  cost: number;
  score: number;
}

export const approachSpeed = (speed: number, distance: number, traction: number) =>
  Math.min(speed, distance * 8, Math.sqrt(34 * traction * distance));

// Search sequences of steering arcs, including reversing before a forward turn.
// The rollout uses the real acceleration, steering rate and swept chassis collision.
export function chooseDriveControl(
  motion: VehicleMotion,
  kind: VehicleKind,
  arena: Arena,
  body: TrafficBody,
  traffic: TrafficBody[],
  goal: DrivingGoal,
  speed: number,
  traction: number,
  previous?: DriveControl | null,
): DriveControl | null {
  const controls: (DriveControl | null)[] = [null];
  for (const direction of [1, -1] as const)
    for (const steer of [-MAX_STEER, 0, MAX_STEER])
      controls.push({ direction, steer, throttle: 1 });
  const heuristic = (x: number, z: number, m: VehicleMotion) => {
    const distance = Math.hypot(goal.x - x, goal.z - z);
    const bearing = Math.atan2(goal.x - x, goal.z - z);
    if (goal.faceTarget) {
      const facing = Math.abs(angleDifference(bearing, m.angle));
      return Math.max(0, distance - goal.faceTarget.range * 0.85) * 2 + facing * 4;
    }
    const direction = goal.faceDirection;
    const approach = direction ? Math.atan2(direction.x - x, direction.z - z) : bearing;
    const heading = m.angle + (!direction && m.speed < 0 ? Math.PI : 0);
    return (
      distance +
      Math.abs(angleDifference(approach, heading)) *
        (direction ? 0.9 : Math.min(1, distance / 2) * 0.5)
    );
  };
  let frontier: Pose[] = [
    { motion, x: body.x, z: body.z, first: null, last: previous ?? null, cost: 0, score: Infinity },
  ];
  let best: Pose | undefined;
  for (let depth = 0; depth < 4; depth++) {
    const next: Pose[] = [];
    for (const pose of frontier)
      for (const control of controls) {
        const predicted = { ...pose.motion };
        let x = pose.x,
          z = pose.z,
          traveled = 0,
          safe = true,
          arrived = false;
        for (let tick = 0; tick < 45; tick++) {
          const remaining = Math.hypot(goal.x - x, goal.z - z);
          const limit = goal.faceTarget ? speed : approachSpeed(speed, remaining, traction);
          const [dx, dz] = driveVehicle(
            predicted,
            kind,
            [goal.x - x, goal.z - z],
            limit,
            traction,
            control ?? undefined,
          );
          if (!canTravel(arena, { ...body, x, z }, x + dx, z + dz, traffic)) {
            safe = false;
            break;
          }
          x += dx;
          z += dz;
          traveled += Math.hypot(dx, dz);
          arrived = goal.faceTarget
            ? Math.hypot(goal.x - x, goal.z - z) <= goal.faceTarget.range - 0.1 &&
              Math.abs(angleDifference(Math.atan2(goal.x - x, goal.z - z), predicted.angle)) <= 0.5
            : Math.hypot(goal.x - x, goal.z - z) < 0.005 &&
              (!goal.faceDirection ||
                Math.abs(
                  angleDifference(
                    Math.atan2(goal.faceDirection.x - x, goal.faceDirection.z - z),
                    predicted.angle,
                  ),
                ) < 1);
          if (arrived) break;
        }
        if (!safe) continue;
        const switching = pose.last && control && pose.last.direction !== control.direction;
        const cost = pose.cost + traveled * 0.08 + (switching ? 0.18 : 0) + 0.015;
        const candidate: Pose = {
          motion: predicted,
          x,
          z,
          first: depth === 0 ? control : pose.first,
          last: control,
          cost,
          score: cost + (arrived ? 0 : heuristic(x, z, predicted)),
        };
        if (!best || candidate.score < best.score) best = candidate;
        if (arrived) return candidate.first;
        next.push(candidate);
      }
    next.sort((a, b) => a.score - b.score);
    // Keep distinct positions/headings so one promising turn cannot erase its alternatives.
    const seen = new Set<string>();
    frontier = next
      .filter((p) => {
        const key = `${Math.round(p.x * 2)},${Math.round(p.z * 2)},${Math.round(p.motion.angle * 4)},${Math.sign(p.motion.speed)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12);
    if (!frontier.length) break;
  }
  return best
    ? best.first
    : { direction: motion.speed > 0 ? -1 : 1, steer: motion.steer, throttle: 0 };
}
