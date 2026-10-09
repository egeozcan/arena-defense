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

// Cruising completes the evaluated arc; close header alignment follows targets sooner.
export const DRIVE_PLAN_TICKS = 45;
export const HEADER_PLAN_TICKS = 18;

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
    for (const steer of [-MAX_STEER, -MAX_STEER / 2, 0, MAX_STEER / 2, MAX_STEER])
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
    let arrival: Pose | undefined;
    for (const pose of frontier)
      for (const control of controls) {
        const predicted = { ...pose.motion };
        let x = pose.x,
          z = pose.z,
          traveled = 0,
          safe = true,
          arrived = false,
          direction =
            Math.abs(predicted.speed) > 0.1
              ? Math.sign(predicted.speed)
              : (pose.last?.direction ?? 0),
          switches = 0;
        for (let tick = 0; tick < DRIVE_PLAN_TICKS; tick++) {
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
          // Automatic steering (null control) can also reverse. Charge every actual
          // direction change, including changes within a single predicted arc.
          const nextDirection = Math.abs(predicted.speed) > 0.1 ? Math.sign(predicted.speed) : 0;
          if (nextDirection) {
            if (direction && nextDirection !== direction) switches++;
            direction = nextDirection;
          }
          x += dx;
          z += dz;
          traveled += Math.hypot(dx, dz);
          arrived = goal.faceTarget
            ? Math.hypot(goal.x - x, goal.z - z) <= goal.faceTarget.range - 0.1 &&
              Math.abs(angleDifference(Math.atan2(goal.x - x, goal.z - z), predicted.angle)) <= 0.5
            : Math.hypot(goal.x - x, goal.z - z) < 0.005 &&
              Math.abs(predicted.speed) < 0.05 &&
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
        // A gear change must save meaningful travel to justify braking and restarting.
        const cost = pose.cost + traveled * 0.08 + switches * 1.5 + 0.015;
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
        if (arrived && (!arrival || candidate.score < arrival.score)) arrival = candidate;
        next.push(candidate);
      }
    // Compare successful maneuvers too, instead of accepting the first control order.
    if (arrival) return arrival.first;
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
