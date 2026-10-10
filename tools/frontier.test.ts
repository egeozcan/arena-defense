import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, VEHICLES, type OwnedVehicle, type VehicleKind } from '../src/sim/data';
import {
  armorDamageFactor,
  canTargetBalloon,
  terrainSpeedFactor,
  vehicleStats,
} from '../src/sim/capabilities';
import { Simulation, initPhysics, type Balloon } from '../src/sim/engine';
import { stockVehicle } from '../src/ui/wave-forecast';
import {
  buildCost,
  capabilityProfile,
  dominates,
  frontierAudit,
  legalBuilds,
} from './vehicle-frontier';

for (const mode of ['easy', 'medium', 'hard'] as const)
  test(`${mode}: all legal builds have a cost/capability tradeoff and no dead upgrades`, () => {
    const report = frontierAudit(mode);
    assert.equal(report.builds, Object.keys(VEHICLES).length * 117);
    assert.deepEqual(report.dominated, []);
    assert.deepEqual(report.deadUpgrades, []);
  });

test('the frontier audit detects a more expensive build with no extra capability', () => {
  const crane = stockVehicle('crane');
  crane.upgrades.attack = 4;
  const profile = capabilityProfile(crane);
  const brokenCapstone = { ...crane, upgrades: { ...crane.upgrades, attack: 5 } };
  assert.equal(
    dominates(
      { affordability: -buildCost(crane, 'medium'), ...profile },
      { affordability: -buildCost(brokenCapstone, 'medium'), ...profile },
    ),
    true,
  );
  assert.equal(
    dominates(
      { affordability: -buildCost(crane, 'medium'), ...profile },
      { affordability: -buildCost(brokenCapstone, 'medium'), ...capabilityProfile(brokenCapstone) },
    ),
    false,
  );
  assert.equal(legalBuilds().filter((v) => v.kind === 'crane').length, 117);
});

test('primary choices retain their armor and altitude blind spots under the 5+2 cap', () => {
  for (const kind of ['harvester', 'crane', 'blower'] as const) {
    const v = stockVehicle(kind);
    v.upgrades = { attack: 2, speed: 0, traction: 0, unique: 5 };
    assert.equal(armorDamageFactor(v), 0, `${kind} specialist needs an armor partner`);
    v.upgrades = { attack: 5, speed: 0, traction: 0, unique: 2 };
    assert.equal(armorDamageFactor(v), 0.5);
  }
  for (const kind of ['sprayer', 'baler', 'excavator', 'bulldozer', 'mixer'] as const) {
    const v = stockVehicle(kind);
    v.upgrades.unique = 5;
    assert.equal(canTargetBalloon(v, 6, false), false, `${kind} needs high-altitude support`);
  }
  const crane = stockVehicle('crane');
  crane.upgrades.unique = 5;
  assert.equal(canTargetBalloon(crane, 0.8, false), false, 'carrier cargo still needs a low tool');
});

test('top Traction has a benefit even on a chassis already at full mud grip', () => {
  for (const kind of Object.keys(VEHICLES) as VehicleKind[]) {
    const v = stockVehicle(kind);
    v.upgrades.traction = 4;
    const before = vehicleStats(v).speed * terrainSpeedFactor(v, 0.4);
    v.upgrades.traction = 5;
    assert.ok(vehicleStats(v).speed * terrainSpeedFactor(v, 0.4) >= before * 1.2 - 1e-9);
    assert.equal(terrainSpeedFactor(v, 0.6), 1);
  }
});

await initPhysics();
function pinnedCombat(
  kind: VehicleKind,
  upgrades: Partial<OwnedVehicle['upgrades']>,
  points: [number, number, number][],
) {
  const run = newRun();
  const v = { ...stockVehicle(kind), id: 1, x: 17, z: 8 };
  Object.assign(v.upgrades, upgrades);
  run.fleet = [v];
  const sim = new Simulation(run);
  sim.wave = points.map(() => ({
    tick: 0,
    kind: 'basic',
    layer: 1,
    fleeing: false,
    regen: false,
    armor: false,
    gate: 0,
    lane: 0.5,
  }));
  sim.vehicles[0].attackTick = Infinity;
  sim.step();
  for (const [i, b] of sim.balloons.entries()) pin(sim, b, points[i]);
  sim.vehicles[0].attackTick = sim.tick;
  return sim;
}
function pin(sim: Simulation, b: Balloon, [x, y, z]: [number, number, number]) {
  sim.world.forEachRigidBody((body) => {
    const p = body.translation();
    if (Math.hypot(p.x - b.x, p.y - b.y, p.z - b.z) < 0.0001) {
      body.setTranslation({ x, y, z }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });
  b.x = b.px = x;
  b.y = b.py = b.float = b.baseFloat = y;
  b.z = b.pz = z;
  b.dx = b.dz = 0;
  b.nextTurn = Infinity;
  b.hp = b.maxHp = 10000;
}

test('Attack tier 3 gives excavators an actual one-hit armor breakpoint', () => {
  for (const attack of [2, 3]) {
    const sim = pinnedCombat('excavator', { attack }, [[18, 0.8, 12]]);
    try {
      sim.balloons[0].armor = true;
      sim.balloons[0].hp = sim.balloons[0].maxHp = 6;
      sim.step();
      assert.equal(sim.pops, attack === 3 ? 1 : 0);
      if (attack === 2) assert.equal(sim.balloons[0].hp, 1);
    } finally {
      sim.dispose();
    }
  }
});

test('Crane Attack capstone hits a second separated balloon without buying Boom tier 5', () => {
  const sim = pinnedCombat('crane', { attack: 5, unique: 2 }, [
    [18, 6, 12],
    [23, 6, 12],
  ]);
  try {
    sim.step();
    assert.deepEqual(
      sim.balloons.map((b) => b.hp),
      [9992.5, 9992.5],
    );
  } finally {
    sim.dispose();
  }
});

test('tower hooks retain splash in two separate packs without hitting anyone twice', () => {
  const sim = pinnedCombat('crane', { unique: 5 }, [
    [18, 6, 12],
    [18.7, 6, 12.5],
    [25, 6, 12],
    [25.7, 6, 12.5],
  ]);
  try {
    sim.step();
    assert.deepEqual(
      sim.balloons.map((b) => b.hp),
      [9997, 9997, 9997, 9997],
    );
    assert.equal(vehicleStats(sim.vehicles[0]).range, 12);
    assert.equal(vehicleStats(sim.vehicles[0]).max, 14);
    assert.equal(vehicleStats(sim.vehicles[0]).speed, VEHICLES.crane.speed * 0.5);
  } finally {
    sim.dispose();
  }
});

test('fractional cooldowns preserve the faster attack upgrade during permanent overdrive', () => {
  const hits: number[] = [];
  for (const attack of [1, 2]) {
    const sim = pinnedCombat('harvester', { attack, speed: 5 }, [[18, 0.8, 11.5]]);
    try {
      for (let i = 0; i < 600; i++) sim.step();
      hits.push((10000 - sim.balloons[0].hp) / 1.25);
      assert.ok(sim.vehicles[0].attackTick >= sim.tick - 1);
    } finally {
      sim.dispose();
    }
  }
  assert.ok(hits[1] >= hits[0] * 1.24, `hits: ${hits.join(', ')}`);
  assert.ok(hits[1] <= hits[0] * 1.26, 'cadence must match the advertised 25% improvement');
});

test('carrier magnets slow real carrier bands and lower only nearby higher carriers', () => {
  const sim = pinnedCombat('crane', { unique: 4 }, [
    [18, 3.5, 12],
    [18, 2.5, 13],
    [40, 3.5, 12],
  ]);
  try {
    sim.vehicles[0].attackTick = Infinity;
    sim.balloons.forEach((b) => {
      b.kind = 'carrier';
    });
    sim.step();
    assert.deepEqual(
      sim.balloons.map((b) => b.baseFloat),
      [3, 2.5, 3.5],
    );
    assert.deepEqual(
      sim.balloons.map((b) => b.slowUntil > sim.tick),
      [true, true, false],
    );
  } finally {
    sim.dispose();
  }
});

test('Airflow tier 4 extends Downburst reach against ordinary high-flyer heights', () => {
  for (const unique of [3, 4]) {
    const sim = pinnedCombat('blower', { unique }, [[18, 7, 18]]);
    try {
      sim.vehicles[0].attackTick = Infinity;
      sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
      sim.step();
      assert.equal(sim.balloons[0].float, unique === 4 ? 1.2 : 7);
      assert.equal(vehicleStats(sim.vehicles[0]).range, unique === 4 ? 9 : 7);
    } finally {
      sim.dispose();
    }
  }
});

test('permanent overdrive improves pursuit even when every target is a one-hit pop', () => {
  const distance: number[] = [];
  for (const speed of [4, 5]) {
    const sim = pinnedCombat('excavator', { speed }, [[18, 0.8, 25]]);
    try {
      sim.vehicles[0].attackTick = Infinity;
      sim.balloons[0].hp = 1;
      sim.enqueue({ ability: 'targeting', vehicleId: 1, targeting: 'Nearest' });
      const v = sim.vehicles[0],
        start = [v.x, v.z];
      for (let i = 0; i < 45; i++) sim.step();
      assert.equal(sim.pops, 0);
      distance.push(Math.hypot(v.x - start[0], v.z - start[1]));
    } finally {
      sim.dispose();
    }
  }
  assert.ok(distance[1] > distance[0] * 1.1, `travel: ${distance.join(', ')}`);
});

test('Attack-primary blowers damage armored air packs while retaining their ground blind spot', () => {
  const sim = pinnedCombat('blower', { attack: 5, unique: 2 }, [
    [18, 6, 12],
    [19, 6, 14],
    [18, 0.8, 12],
  ]);
  try {
    sim.balloons.forEach((b) => {
      b.armor = true;
    });
    sim.step();
    assert.deepEqual(
      sim.balloons.map((b) => b.hp),
      [9998.125, 9998.125, 10000],
    );
  } finally {
    sim.dispose();
  }
});
