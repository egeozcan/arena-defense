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
  test(`a harvester with unique tier ${unique} ${unique === 3 ? 'uses its rear cutter without turning' : 'turns its front cutter toward a balloon behind it'}`, () => {
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
      const v = sim.vehicles[0];
      const x = v.x + 2,
        y = 0.8,
        z = v.z;
      sim.world.forEachRigidBody((body) => {
        const p = body.translation();
        if (Math.hypot(p.x - balloon.x, p.y - balloon.y, p.z - balloon.z) < 0.0001) {
          body.setTranslation({ x, y, z }, true);
          body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
      });
      Object.assign(balloon, { x, px: x, y, py: y, float: y, baseFloat: y, z, pz: z });
      balloon.dx = balloon.dz = 0;
      balloon.nextTurn = Infinity;
      v.aimAngle = Math.atan2(balloon.x - v.x, balloon.z - v.z);
      assert.ok(Math.abs(angleDifference(v.aimAngle, v.angle)) > Math.PI / 2);
      sim.step();
      if (unique === 3) {
        assert.equal(sim.pops, 1, 'the rear header should pop the target immediately');
        assert.ok(Math.abs(angleDifference(v.angle, run.fleet[0].rotation)) < 0.01);
        assert.ok(sim.attacks[0].from[0] > v.x, 'the hit effect starts at the rear cutter');
        return;
      }
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
