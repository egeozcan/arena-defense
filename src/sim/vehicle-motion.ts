import { VEHICLES, type VehicleKind } from './data';

const DT = 1 / 60;
export const WHEELBASE = 1.47;
export const MAX_STEER = 0.66;
export const TRACK_WIDTH = 1.64;
export interface DriveControl {
  direction: 1 | -1;
  steer: number;
  throttle: number;
}
export const angleDifference = (a: number, b: number) =>
  Math.atan2(Math.sin(a - b), Math.cos(a - b));
const clamp = (x: number, limit: number) => Math.max(-limit, Math.min(limit, x));
const approach = (from: number, to: number, step: number) => from + clamp(to - from, step);

export interface VehicleMotion {
  angle: number;
  pangle: number;
  speed: number;
  acceleration: number;
  steer: number;
  psteer: number;
  yawRate: number;
  vx: number;
  vz: number;
  travel: number;
  ptravel: number;
  leftTravel: number;
  rightTravel: number;
  pleftTravel: number;
  prightTravel: number;
  pitch: number;
  roll: number;
  ppitch: number;
  proll: number;
  pitchVelocity: number;
  rollVelocity: number;
}

export function motionAt(angle: number): VehicleMotion {
  return {
    angle,
    pangle: angle,
    speed: 0,
    acceleration: 0,
    steer: 0,
    psteer: 0,
    yawRate: 0,
    vx: 0,
    vz: 0,
    travel: 0,
    ptravel: 0,
    leftTravel: 0,
    rightTravel: 0,
    pleftTravel: 0,
    prightTravel: 0,
    pitch: 0,
    roll: 0,
    ppitch: 0,
    proll: 0,
    pitchVelocity: 0,
    rollVelocity: 0,
  };
}

export function beginMotionTick(v: VehicleMotion) {
  v.pangle = v.angle;
  v.psteer = v.steer;
  v.ptravel = v.travel;
  v.pleftTravel = v.leftTravel;
  v.prightTravel = v.rightTravel;
  v.ppitch = v.pitch;
  v.proll = v.roll;
}

// Fixed-step bicycle steering for tires; differential steering for crawler tracks.
// Returns a proposed displacement, which still has to pass the chassis sweep.
export function driveVehicle(
  v: VehicleMotion,
  kind: VehicleKind,
  goal: [number, number] | null,
  maxSpeed: number,
  traction: number,
  control?: DriveControl,
): [number, number] {
  const tracked = kind === 'excavator' || kind === 'crane' || kind === 'bulldozer';
  const grip = Math.max(0.2, Math.min(1, traction));
  const boost = Math.max(1, maxSpeed / VEHICLES[kind].speed);
  const acceleration = boost * (kind === 'sprayer' ? 10 : kind === 'harvester' ? 8 : 6) * grip;
  const braking = (tracked ? 13 : 17) * grip;
  let desiredSpeed = 0,
    desiredYaw = 0,
    desiredSteer = 0;
  if (control && !tracked) {
    desiredSteer = clamp(control.steer, MAX_STEER);
    const curvature = Math.abs(Math.tan(desiredSteer) / WHEELBASE);
    desiredSpeed =
      control.direction *
      Math.min(
        maxSpeed * control.throttle * (control.direction < 0 ? 0.45 : 1),
        Math.sqrt((9 * grip) / Math.max(0.04, curvature)),
      );
  } else if (goal) {
    const distance = Math.hypot(...goal);
    const heading = Math.atan2(goal[0], goal[1]);
    const error = angleDifference(heading, v.angle);
    // Reverse to nearby points behind the chassis rather than spin tires in place.
    const reverse = !tracked && Math.abs(error) > (v.speed < -0.1 ? 1.65 : 2.2);
    const direction = reverse ? -1 : 1;
    const turn = reverse ? angleDifference(heading, v.angle + Math.PI) : error;
    const stopSpeed = Math.sqrt(2 * braking * Math.max(0, distance - 0.001));
    desiredSpeed =
      direction *
      Math.min(
        maxSpeed * (reverse ? 0.45 : 1),
        stopSpeed,
        distance * 8,
        maxSpeed * Math.max(tracked ? 0 : 0.2, Math.cos(turn)),
      );
    if (tracked) {
      desiredYaw = clamp(error * 3.5, (kind === 'crane' ? 1.6 : 2.2) * grip);
    } else {
      desiredSteer = clamp(
        Math.atan2(2 * WHEELBASE * Math.sin(turn) * direction, Math.max(0.8, distance)),
        MAX_STEER,
      );
      const curvature = Math.abs(Math.tan(desiredSteer) / WHEELBASE);
      // Lateral traction bounds corner speed, including while boosted.
      desiredSpeed =
        direction *
        Math.min(Math.abs(desiredSpeed), Math.sqrt((9 * grip) / Math.max(0.04, curvature)));
    }
  }
  const oldSpeed = v.speed;
  const slowing = desiredSpeed * v.speed < 0 || Math.abs(desiredSpeed) < Math.abs(v.speed);
  v.speed = approach(v.speed, desiredSpeed, (slowing ? braking : acceleration) * DT);
  if (Math.abs(v.speed) < 0.001) v.speed = 0;
  v.acceleration = (v.speed - oldSpeed) / DT;
  v.steer = approach(v.steer, desiredSteer, 2.8 * DT);
  if (!tracked) desiredYaw = (v.speed / WHEELBASE) * Math.tan(v.steer);
  v.yawRate = approach(v.yawRate, desiredYaw, (tracked ? 7 : 10) * grip * DT);
  // Wheeled machines cannot rotate without rolling.
  if (!tracked && !v.speed) v.yawRate = 0;
  v.angle = angleDifference(v.angle + v.yawRate * DT, 0);
  const forwardX = Math.sin(v.angle),
    forwardZ = Math.cos(v.angle);
  // Retain a little lateral momentum; soft surfaces take longer to regain grip.
  const lateral = (v.vx * forwardZ - v.vz * forwardX) * Math.exp(-(tracked ? 24 : 14 * grip) * DT);
  v.vx = forwardX * v.speed + forwardZ * lateral;
  v.vz = forwardZ * v.speed - forwardX * lateral;
  return [v.vx * DT, v.vz * DT];
}

export function stopAtCollision(v: VehicleMotion) {
  v.acceleration = -v.speed / DT;
  v.speed = v.vx = v.vz = v.yawRate = 0;
}

// Travel is signed, so reversing rolls wheels backward and pivoting drives opposing tracks.
export function finishMotionTick(v: VehicleMotion, dx: number, dz: number) {
  const distance = dx * Math.sin(v.angle) + dz * Math.cos(v.angle);
  const turn = angleDifference(v.angle, v.pangle);
  v.travel += distance;
  v.leftTravel += distance + (turn * TRACK_WIDTH) / 2;
  v.rightTravel += distance - (turn * TRACK_WIDTH) / 2;
  const pitchTarget = clamp(-v.acceleration * 0.009, 0.1);
  const rollTarget = clamp(v.speed * v.yawRate * 0.013, 0.12);
  // Damped suspension responds to real longitudinal/lateral forces, then settles at rest.
  v.pitchVelocity += ((pitchTarget - v.pitch) * 65 - v.pitchVelocity * 12) * DT;
  v.rollVelocity += ((rollTarget - v.roll) * 55 - v.rollVelocity * 11) * DT;
  v.pitch += v.pitchVelocity * DT;
  v.roll += v.rollVelocity * DT;
}

export function wheelSteering(steer: number, x: number, rear = false) {
  if (Math.abs(steer) < 0.0001) return 0;
  const radius = WHEELBASE / Math.tan(steer);
  const angle = Math.atan(WHEELBASE / (radius - x));
  return rear ? -angle : angle;
}
