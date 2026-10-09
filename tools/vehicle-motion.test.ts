import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  angleDifference,
  beginMotionTick,
  driveVehicle,
  finishMotionTick,
  MAX_STEER,
  motionAt,
  stopAtCollision,
  wheelSteering,
  type VehicleMotion,
} from '../src/sim/vehicle-motion';
import { VEHICLES, type Arena, type VehicleKind } from '../src/sim/data';
import {
  approachSpeed,
  chooseDriveControl,
  DRIVE_PLAN_TICKS,
  HEADER_PLAN_TICKS,
} from '../src/sim/vehicle-driving';
import { canTravel } from '../src/sim/traffic';

function tick(
  v: VehicleMotion,
  goal: [number, number] | null,
  kind: VehicleKind = 'sprayer',
  grip = 1,
) {
  beginMotionTick(v);
  const step = driveVehicle(v, kind, goal, 8.8, grip);
  finishMotionTick(v, ...step);
  return Math.hypot(...step);
}

test('a wheeled vehicle accelerates progressively and coasts while braking', () => {
  const v = motionAt(0);
  const first = tick(v, [0, 100]);
  assert.ok(v.speed > 0 && v.speed < 0.2);
  for (let i = 0; i < 90; i++) tick(v, [0, 100]);
  assert.equal(v.speed, 8.8);
  assert.ok(first < v.speed / 60 / 20);
  const brakingStep = tick(v, null);
  assert.ok(brakingStep > 0 && v.speed > 0 && v.speed < 8.8);
  assert.ok(v.acceleration < 0);
  for (let i = 0; i < 90; i++) tick(v, null);
  assert.equal(v.speed, 0);
  assert.ok(Math.hypot(v.vx, v.vz) < 0.0001);
});

test('low traction slows acceleration and increases braking distance', () => {
  const firm = motionAt(0),
    soft = motionAt(0);
  for (let i = 0; i < 30; i++) {
    tick(firm, [0, 100]);
    tick(soft, [0, 100], 'sprayer', 0.4);
  }
  assert.ok(soft.speed < firm.speed * 0.6);
  firm.speed = soft.speed = 6;
  firm.vz = soft.vz = 6;
  let firmDistance = 0,
    softDistance = 0;
  for (let i = 0; i < 120; i++) {
    firmDistance += tick(firm, null);
    softDistance += tick(soft, null, 'sprayer', 0.4);
  }
  assert.ok(softDistance > firmDistance * 2);
});

test('wheel steering is bounded, changes gradually, and cannot pivot a parked chassis', () => {
  const v = motionAt(0);
  for (let i = 0; i < 180; i++) {
    const steer = v.steer,
      heading = v.angle;
    tick(v, [10, 10]);
    assert.ok(Math.abs(v.steer) <= MAX_STEER);
    assert.ok(Math.abs(v.steer - steer) <= 2.8 / 60 + 1e-9);
    assert.ok(Math.abs(angleDifference(v.angle, heading)) < 0.04);
  }
  stopAtCollision(v);
  const angle = v.angle;
  tick(v, null);
  assert.equal(v.angle, angle);
});

test('Ackermann steering turns the inner tire further and rear steering uses opposite lock', () => {
  const inside = wheelSteering(0.4, 0.91);
  const outside = wheelSteering(0.4, -0.91);
  assert.ok(inside > outside && outside > 0);
  assert.equal(wheelSteering(0.4, 0.91, true), -inside);
  assert.equal(wheelSteering(0, 0.91), 0);
  assert.ok(Math.abs(wheelSteering(-0.4, -0.91)) > Math.abs(wheelSteering(-0.4, 0.91)));
});

test('a moderate bend can use partial steering instead of full lock', () => {
  const arena: Arena = { kind: 'yard', width: 64, depth: 48, ceiling: 14, obstacles: [] };
  const body = { id: 1, x: 20, z: 20, radius: 1.12 };
  const motion = motionAt(0);
  const control = chooseDriveControl(
    motion,
    'harvester',
    arena,
    body,
    [],
    { x: 26, z: 35 },
    7.8,
    1,
  );
  // Automatic pursuit is also a valid partial-steering solution.
  for (let i = 0; i < DRIVE_PLAN_TICKS; i++) {
    const [dx, dz] = driveVehicle(
      motion,
      'harvester',
      [26 - body.x, 35 - body.z],
      7.8,
      1,
      control ?? undefined,
    );
    body.x += dx;
    body.z += dz;
  }
  assert.ok(motion.speed > 0);
  assert.ok(motion.steer > 0 && motion.steer < MAX_STEER);
});

for (const kind of ['harvester', 'sprayer', 'baler', 'blower'] as const)
  test(`${kind} completes open-space turns without repeated forward/reverse shuffling`, () => {
    const arena: Arena = { kind: 'yard', width: 64, depth: 48, ceiling: 14, obstacles: [] };
    for (const [x, z, angle] of [
      [21, 20, 0],
      [22, 20, 0],
      [21, 19, 0],
      [20, 19, 0],
      [24, 20, 0],
      [24, 22, Math.PI],
      [32, 28, -Math.PI / 2],
    ]) {
      const body = { id: 1, x: 20, z: 20, radius: 1.12 };
      const motion = motionAt(angle);
      const facing = kind === 'harvester';
      const speed = VEHICLES[kind].speed;
      let control: ReturnType<typeof chooseDriveControl> = null;
      let direction = 0,
        reversals = 0,
        reached = false;
      for (let tick = 0; tick < 900; tick++) {
        const distance = Math.hypot(x - body.x, z - body.z);
        if (
          facing
            ? distance <= 2.2 &&
              Math.abs(angleDifference(Math.atan2(x - body.x, z - body.z), motion.angle)) <= 0.85
            : distance < 0.1
        ) {
          reached = true;
          break;
        }
        if (tick % (facing ? HEADER_PLAN_TICKS : DRIVE_PLAN_TICKS) === 0)
          control = chooseDriveControl(
            motion,
            kind,
            arena,
            body,
            [],
            {
              x,
              z,
              faceTarget: facing ? { x, z, range: 2.2 } : undefined,
            },
            speed,
            1,
            control,
          );
        const [dx, dz] = driveVehicle(
          motion,
          kind,
          [x - body.x, z - body.z],
          facing ? speed : approachSpeed(speed, distance, 1),
          1,
          control ?? undefined,
        );
        assert.ok(canTravel(arena, body, body.x + dx, body.z + dz, []));
        body.x += dx;
        body.z += dz;
        const nextDirection = Math.abs(motion.speed) > 0.1 ? Math.sign(motion.speed) : 0;
        if (nextDirection) {
          if (direction && nextDirection !== direction) reversals++;
          direction = nextDirection;
        }
      }
      assert.ok(reached, `did not reach ${x},${z} from heading ${angle}`);
      assert.ok(reversals <= 3, `made ${reversals} direction changes approaching ${x},${z}`);
    }
  });

test('outer wheels roll farther than inner wheels through a turn', () => {
  const v = motionAt(0);
  for (let i = 0; i < 90; i++) tick(v, [20, 20], 'harvester');
  assert.ok(v.angle > 0);
  assert.ok(v.leftTravel > v.rightTravel);
});

test('reversing records backward wheel travel and brakes before changing direction', () => {
  const v = motionAt(0);
  for (let i = 0; i < 60; i++) tick(v, [0, -100]);
  assert.ok(v.speed < 0 && v.travel < 0 && v.vz < 0);
  const reverseSpeed = v.speed;
  tick(v, [0, 100]);
  assert.ok(v.speed < 0 && v.speed > reverseSpeed);
  for (let i = 0; i < 120; i++) tick(v, [0, 100]);
  assert.ok(v.speed > 0);
});

test('a crawler pivots using opposing tracks, without snapping its heading', () => {
  const v = motionAt(0);
  const distance = tick(v, [100, 0], 'excavator');
  assert.ok(v.angle > 0 && v.angle < 0.01);
  assert.ok(distance < 0.001);
  assert.ok(v.leftTravel > 0 && v.rightTravel < 0);
  assert.ok(Math.abs(v.travel) < 0.001);
});

test('suspension pitches under load and settles after coming to rest', () => {
  const v = motionAt(0);
  for (let i = 0; i < 30; i++) tick(v, [0, 100]);
  assert.ok(v.pitch < -0.01);
  for (let i = 0; i < 30; i++) tick(v, [30, 30]);
  assert.ok(Math.abs(v.roll) > 0.005);
  for (let i = 0; i < 600; i++) tick(v, null);
  assert.ok(Math.abs(v.pitch) < 0.0001 && Math.abs(v.roll) < 0.0001);
});

test('a rejected collision step cancels velocity without inventing wheel travel', () => {
  const v = motionAt(0);
  for (let i = 0; i < 60; i++) tick(v, [0, 100]);
  const travel = v.travel;
  beginMotionTick(v);
  driveVehicle(v, 'sprayer', [0, 100], 8.8, 1);
  stopAtCollision(v);
  finishMotionTick(v, 0, 0);
  assert.equal(v.travel, travel);
  assert.equal(v.speed, 0);
  assert.equal(v.vx, 0);
  assert.equal(v.vz, 0);
});
