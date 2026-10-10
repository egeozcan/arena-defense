import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  arenaFor,
  canPlace,
  grip,
  newRun,
  SURFACE_GRIP,
  VEHICLES,
  vehicleRadius,
  type Arena,
} from '../src/sim/data';
import { terrainHandlingFactor, terrainSpeedFactor, vehicleStats } from '../src/sim/capabilities';
import { driveVehicle, motionAt } from '../src/sim/vehicle-motion';
import { findPath, pathCosts } from '../src/sim/pathfinding';
import { hayRouteCost } from '../src/sim/hay';
import { forecast, futureChanges, stockVehicle } from '../src/ui/wave-forecast';
import { initPhysics, Simulation } from '../src/sim/engine';
import { legalBuilds } from './vehicle-frontier';

test('surface rounds are deterministic, bounded, and preserve gates and placement', () => {
  for (const kind of ['barn', 'yard'] as const) {
    for (const round of [1, 2, 3, 4, 6, 9, 11, 14, 16, 19])
      assert.deepEqual(arenaFor(kind, round).surfaces, []);
    assert.deepEqual(
      arenaFor(kind, 5).surfaces?.map((p) => p.kind),
      ['rough', 'rough', 'rough'],
    );
    assert.deepEqual(
      arenaFor(kind, 7).surfaces?.map((p) => p.kind),
      ['oil', 'oil', 'oil'],
    );
    assert.deepEqual(
      arenaFor(kind, 13).surfaces?.map((p) => p.kind),
      ['rough', 'oil', 'rough', 'oil'],
    );
    assert.notDeepEqual(arenaFor(kind, 13, 99).surfaces, arenaFor(kind, 13, 100).surfaces);
    for (const seed of [99, 100, 73429, 73531])
      for (let round = 1; round <= 60; round++) {
        const a = arenaFor(kind, round, seed);
        assert.deepEqual(a, arenaFor(kind, round, seed));
        for (const p of a.surfaces ?? []) {
          assert.ok(p.x - p.w / 2 > 5 && p.x + p.w / 2 < a.width - 5);
          assert.ok(p.z - p.d / 2 > 5 && p.z + p.d / 2 < a.depth - 5);
          assert.equal(grip(a, p.x, p.z), SURFACE_GRIP[p.kind]);
          const v = stockVehicle('sprayer');
          assert.ok(
            canPlace(
              { ...a, obstacles: a.obstacles.filter((o) => !o.loose) },
              [],
              v,
              p.x - 1,
              p.z - 1,
            ),
            'patches are driveable floor; hay can still occupy them',
          );
        }
      }
  }
});

test('surface footprints agree with point queries and oil wins overlaps', () => {
  const a: Arena = {
    kind: 'barn',
    width: 24,
    depth: 22,
    ceiling: 9,
    obstacles: [],
    surfaces: [
      { kind: 'rough', x: 10, z: 10, w: 6, d: 6 },
      { kind: 'oil', x: 10, z: 10, w: 2, d: 2 },
    ],
  };
  assert.equal(grip(a, 10, 10), SURFACE_GRIP.oil);
  assert.equal(grip(a, 12.99, 12.99), SURFACE_GRIP.rough);
  assert.equal(grip(a, 13.01, 13.01), 0.9);
  delete a.surfaces;
  assert.equal(grip(a, 10, 10), 0.9, 'older arenas retain their floor');
});

test('all legal builds gain rough/oil control from tires, with distinct speed and handling', () => {
  for (const v of legalBuilds()) {
    for (const surface of Object.values(SURFACE_GRIP)) {
      const speed = terrainSpeedFactor(v, surface),
        handling = terrainHandlingFactor(v, surface);
      assert.ok(speed > 0 && speed <= 1 && handling > 0 && handling <= 1);
      if (v.upgrades.traction === 5) {
        assert.equal(speed, 1);
        assert.equal(handling, 1);
      } else {
        if (surface === SURFACE_GRIP.oil || v.upgrades.traction < 3)
          assert.ok(handling < 1, 'oil and unupgraded rough handling retain a penalty');
        assert.ok(speed < 1);
      }
    }
  }
  for (const kind of Object.keys(VEHICLES) as (keyof typeof VEHICLES)[]) {
    const v = stockVehicle(kind);
    const oil = terrainHandlingFactor(v, SURFACE_GRIP.oil);
    const rough = terrainHandlingFactor(v, SURFACE_GRIP.rough);
    assert.ok(terrainSpeedFactor(v, SURFACE_GRIP.oil) > oil);
    v.upgrades.traction = 2;
    assert.ok(terrainHandlingFactor(v, SURFACE_GRIP.oil) > oil);
    const oil2 = terrainHandlingFactor(v, SURFACE_GRIP.oil);
    const rough2 = terrainHandlingFactor(v, SURFACE_GRIP.rough);
    v.upgrades.traction = 3;
    assert.equal(terrainHandlingFactor(v, SURFACE_GRIP.oil), oil2);
    assert.ok(terrainHandlingFactor(v, SURFACE_GRIP.rough) > rough2);
    assert.ok(terrainHandlingFactor(v, SURFACE_GRIP.rough) > rough);
  }
});

test('oil extends real braking distance; Speed does not replace Traction control', () => {
  function stop(traction: number) {
    const v = motionAt(0);
    v.speed = v.vz = 6;
    let meters = 0;
    for (let i = 0; i < 600 && v.speed; i++)
      meters += driveVehicle(v, 'sprayer', null, 0, traction)[1];
    assert.equal(v.speed, 0);
    return meters;
  }
  const v = stockVehicle('sprayer');
  const dry = stop(terrainHandlingFactor(v, 0.9));
  const oil = stop(terrainHandlingFactor(v, SURFACE_GRIP.oil));
  assert.ok(oil > dry * 2.5);
  v.upgrades.speed = 5;
  assert.equal(stop(terrainHandlingFactor(v, SURFACE_GRIP.oil)), oil);
  v.upgrades = { attack: 0, speed: 2, traction: 5, unique: 0 };
  assert.equal(stop(terrainHandlingFactor(v, SURFACE_GRIP.oil)), dry);
});

test('routing avoids costly rough lanes but full Traction can take the direct path', () => {
  const a: Arena = {
    kind: 'barn',
    width: 24,
    depth: 22,
    ceiling: 9,
    obstacles: [],
    surfaces: [{ kind: 'rough', x: 10.5, z: 11, w: 6, d: 6 }],
  };
  const v = stockVehicle('sprayer');
  const route = () =>
    findPath(
      a,
      10.5,
      5.5,
      10.5,
      16.5,
      vehicleStats(v).traction,
      new Set(),
      0,
      vehicleRadius(v),
      undefined,
      v,
    );
  const stock = route();
  assert.deepEqual(stock.at(-1), [10.5, 16.5]);
  assert.ok(stock.length > 11);
  const costs = pathCosts(a, 10.5, 5.5, vehicleStats(v).traction, vehicleRadius(v), v);
  assert.ok(Number.isFinite(costs[16 * 24 + 10]));
  assert.ok(costs[16 * 24 + 10] < 7 / terrainSpeedFactor(v, SURFACE_GRIP.rough) + 4);
  v.upgrades.traction = 5;
  assert.equal(route().length, 11);
  assert.equal(hayRouteCost(a, v, 10.5, 11, vehicleRadius(v)), 1);
  a.surfaces![0].kind = 'oil';
  v.upgrades.traction = 0;
  assert.ok(
    hayRouteCost(a, v, 10.5, 11, vehicleRadius(v)) > 1 / terrainSpeedFactor(v, SURFACE_GRIP.oil),
  );
});

test('briefing counts match each arena and warn before rough, oil, and mixed rounds', () => {
  const run = newRun();
  assert.equal(forecast({ ...run, round: 5 }).rough, 3);
  assert.equal(forecast({ ...run, round: 7 }).oil, 3);
  assert.equal(forecast({ ...run, round: 13 }).rough, 2);
  assert.equal(forecast({ ...run, round: 13 }).oil, 2);
  assert.ok(futureChanges({ ...run, round: 4 }).some((s) => s.includes('Rough ground ahead')));
  assert.ok(futureChanges({ ...run, round: 6 }).some((s) => s.includes('Oil slicks ahead')));
  assert.ok(futureChanges({ ...run, round: 12 }).some((s) => s.includes('Rough ground ahead')));
});

await initPhysics();
test('real pursuit slows on rough/oil and full Traction restores both surfaces', () => {
  function pursue(kind: 'oil' | 'rough', traction: number) {
    const run = newRun();
    const vehicle = { ...stockVehicle('excavator'), id: 1, x: 17, z: 8 };
    vehicle.upgrades.traction = traction;
    run.fleet = [vehicle];
    const sim = new Simulation(run);
    try {
      sim.arena.surfaces = [{ kind, x: 18, z: 18, w: 12, d: 30 }];
      sim.wave = [{ tick: 0, kind: 'basic', layer: 1, fleeing: false, regen: false, armor: false }];
      sim.vehicles[0].attackTick = Infinity;
      sim.step();
      const b = sim.balloons[0],
        v = sim.vehicles[0],
        start = v.z;
      sim.world.forEachRigidBody((body) => {
        const p = body.translation();
        if (Math.hypot(p.x - b.x, p.y - b.y, p.z - b.z) < 0.0001) {
          body.setTranslation({ x: 18, y: 0.8, z: 28 }, true);
          body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
      });
      b.x = b.px = 18;
      b.y = b.py = b.float = b.baseFloat = 0.8;
      b.z = b.pz = 28;
      b.dx = b.dz = 0;
      b.nextTurn = Infinity;
      Object.assign(v, motionAt(0));
      v.path = [];
      v.nextPath = v.nextSelect = v.nextDrivePlan = 0;
      for (let i = 0; i < 120; i++) sim.step();
      assert.equal(sim.pops, 0);
      return v.z - start;
    } finally {
      sim.dispose();
    }
  }
  const oil = pursue('oil', 0),
    rough = pursue('rough', 0);
  const oilFull = pursue('oil', 5),
    roughFull = pursue('rough', 5);
  assert.ok(rough < oil, `${rough} vs ${oil}`);
  assert.ok(oilFull > oil * 1.2, `${oilFull} vs ${oil}`);
  assert.ok(Math.abs(oilFull - roughFull) < 0.001);
});

test('surface counterfactual retains hay and does not change balloon flight', () => {
  const run = { ...newRun(), round: 13 };
  const on = new Simulation(run, true, true),
    off = new Simulation(run, true, false);
  try {
    assert.deepEqual(on.arena.obstacles, off.arena.obstacles);
    assert.equal(on.arena.surfaces?.length, 4);
    assert.deepEqual(off.arena.surfaces, []);
    for (let i = 0; i < 180; i++) {
      on.step();
      off.step();
    }
    assert.deepEqual(on.balloons, off.balloons);
  } finally {
    on.dispose();
    off.dispose();
  }
  const noHay = new Simulation(run, false);
  try {
    assert.equal(noHay.arena.surfaces?.length, 4);
    assert.equal(noHay.arena.obstacles.filter((o) => o.loose).length, 0);
  } finally {
    noHay.dispose();
  }
});
