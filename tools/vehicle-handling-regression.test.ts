import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, clearPosition, vehicleRadius, type OwnedVehicle } from '../src/sim/data';
import { Simulation, initPhysics, vehicleStats } from '../src/sim/engine';
import { angleDifference } from '../src/sim/vehicle-motion';

await initPhysics();

function harvester(x: number, z: number, rotation: number): OwnedVehicle {
  return {
    id: 1,
    kind: 'harvester',
    x,
    z,
    rotation,
    placed: true,
    targeting: 'Nearest',
    spent: 400,
    upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
  };
}

test('a wheeled harvester escapes repeated reversing beside scenery and reaches its target', () => {
  const run = newRun();
  run.fleet = [harvester(4, 7, 0)];
  const sim = new Simulation(run);
  try {
    sim.wave = [
      {
        tick: 0,
        kind: 'basic',
        layer: 1,
        regen: false,
        fleeing: false,
        armor: false,
        gate: 0,
        lane: 0.5,
      },
    ];
    sim.vehicles[0].attackTick = 10000;
    sim.step();
    const balloon = sim.balloons[0];
    balloon.dx = balloon.dz = 0;
    balloon.nextTurn = Infinity;
    const v = sim.vehicles[0];
    let reached = false;
    for (let i = 0; i < 1200; i++) {
      sim.step();
      assert.ok(clearPosition(sim.arena, v.x, v.z, vehicleRadius(v)));
      if (Math.hypot(v.x - balloon.x, v.z - balloon.z) <= vehicleStats(v).range) {
        reached = true;
        break;
      }
    }
    assert.ok(
      reached,
      `harvester kept maneuvering at ${v.x.toFixed(2)},${v.z.toFixed(2)} without reaching the balloon`,
    );
  } finally {
    sim.dispose();
  }
});

for (const unique of [0, 3])
  test(`a harvester with unique tier ${unique} faces its front cutter toward a balloon behind it before attacking`, () => {
    const run = newRun();
    run.fleet = [harvester(28, 11, -Math.PI / 2)];
    run.fleet[0].upgrades.unique = unique;
    const sim = new Simulation(run);
    try {
      sim.wave = [
        {
          tick: 0,
          kind: 'basic',
          layer: 1,
          regen: false,
          fleeing: false,
          armor: false,
          gate: 1,
          lane: 0.5,
        },
      ];
      sim.vehicles[0].attackTick = 1;
      sim.step();
      const balloon = sim.balloons[0];
      balloon.dx = balloon.dz = 0;
      balloon.nextTurn = Infinity;
      const v = sim.vehicles[0];
      assert.ok(Math.abs(angleDifference(v.aimAngle, v.angle)) > Math.PI / 2);
      sim.step();
      assert.equal(
        sim.attacks.length,
        0,
        'the front cutter must not hit through the back of the chassis',
      );
      for (let i = 0; i < 900 && !sim.attacks.length && !sim.summary; i++) sim.step();
      assert.ok(sim.attacks.length, 'the harvester should reposition and cut instead of idling');
      const attack = sim.attacks[0];
      const bearing = Math.atan2(attack.to[0] - v.x, attack.to[2] - v.z);
      assert.ok(
        Math.abs(angleDifference(bearing, v.angle)) <= 0.85,
        'the front header should face its primary target',
      );
    } finally {
      sim.dispose();
    }
  });

test('the rear cutter is an additional upgraded hit while the primary target stays in front', () => {
  for (const unique of [0, 3]) {
    const run = newRun();
    run.fleet = [harvester(44, 11, 0)];
    run.fleet[0].upgrades.unique = unique;
    const sim = new Simulation(run);
    try {
      sim.wave = [14, 11].map((z) => ({
        tick: 0,
        kind: 'basic',
        layer: 1,
        regen: false,
        fleeing: false,
        armor: false,
        gate: 1,
        lane: z / sim.arena.depth,
      }));
      const v = sim.vehicles[0];
      v.attackTick = 10000;
      sim.step();
      const [front, rear] = sim.balloons;
      for (const balloon of [front, rear]) {
        balloon.dx = balloon.dz = 0;
        balloon.nextTurn = Infinity;
      }
      assert.ok(
        Math.abs(angleDifference(Math.atan2(front.x - v.x, front.z - v.z), v.angle)) < 0.85,
      );
      assert.ok(
        Math.abs(angleDifference(Math.atan2(rear.x - v.x, rear.z - v.z), v.angle)) > Math.PI / 2,
      );
      v.target = front.id;
      v.nextSelect = Infinity;
      v.attackTick = sim.tick;
      sim.step();
      assert.equal(sim.pops, unique === 3 ? 2 : 1);
      assert.equal(
        sim.balloons.some((b) => b.id === rear.id),
        unique === 0,
      );
      assert.equal(sim.attacks[0].to[2], front.z);
    } finally {
      sim.dispose();
    }
  }
});

test('wheeled vehicles make measurable progress from awkward headings around scenery', () => {
  for (const kind of ['harvester', 'sprayer'] as const)
    for (const [x, z, rotation] of [
      [4, 7, Math.PI / 2],
      [4, 7, -Math.PI / 2],
      [6, 10, -Math.PI / 2],
      [22, 10, 0],
    ]) {
      const run = newRun();
      run.fleet = [{ ...harvester(x, z, rotation), kind }];
      const sim = new Simulation(run);
      try {
        sim.wave = [
          {
            tick: 0,
            kind: 'basic',
            layer: 1,
            regen: false,
            fleeing: false,
            armor: false,
            gate: 0,
            lane: 0.5,
          },
        ];
        sim.vehicles[0].attackTick = 10000;
        sim.step();
        const balloon = sim.balloons[0];
        balloon.dx = balloon.dz = 0;
        balloon.nextTurn = Infinity;
        const v = sim.vehicles[0];
        const reached = () => Math.hypot(v.x - balloon.x, v.z - balloon.z) <= vehicleStats(v).range;
        for (let tick = 0; tick < 1200 && !reached(); tick++) {
          sim.step();
          assert.ok(clearPosition(sim.arena, v.x, v.z, vehicleRadius(v)));
        }
        assert.ok(
          reached(),
          `${kind} from ${x},${z} at ${rotation} kept maneuvering without reaching its target`,
        );
      } finally {
        sim.dispose();
      }
    }
});
