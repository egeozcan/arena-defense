import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  arenaFor,
  clearPosition,
  newRun,
  vehicleRadius,
  type Arena,
  type OwnedVehicle,
} from '../src/sim/data';
import { hayContacts, hayDriveSpeed, hayHandling, touchesHay } from '../src/sim/hay';
import { canTravel } from '../src/sim/traffic';
import { findPath, pathCosts } from '../src/sim/pathfinding';
import { Simulation, initPhysics, type Balloon } from '../src/sim/engine';
import { stockVehicle } from '../src/ui/wave-forecast';

await initPhysics();
const bale = () => ({
  id: -1,
  x: 10.5,
  z: 10.5,
  w: 1.4,
  d: 1,
  h: 0.9,
  kind: 'hay' as const,
  loose: true,
  integrity: 1,
});
const arena = (): Arena => ({
  kind: 'barn',
  width: 24,
  depth: 22,
  ceiling: 9,
  obstacles: [bale()],
});
const body = (v: OwnedVehicle, x = 10.5, z = 7.5) => ({
  id: v.id,
  x,
  z,
  radius: vehicleRadius(v),
  vehicle: v,
});

test('only selected rounds contain seeded loose hay, with open gates and safe deployments', () => {
  for (const kind of ['barn', 'yard'] as const) {
    assert.equal(arenaFor(kind, 1).obstacles.filter((o) => o.loose).length, 0);
    assert.equal(arenaFor(kind, 5).obstacles.filter((o) => o.loose).length, 0);
    const a = arenaFor(kind, 4, 99);
    assert.equal(a.obstacles.filter((o) => o.loose).length, 4);
    assert.deepEqual(a, arenaFor(kind, 4, 99));
    assert.notDeepEqual(a, arenaFor(kind, 4, 100));
    assert.ok(clearPosition(a, 1.5, a.depth / 2, 1.2));
    assert.ok(clearPosition(a, a.width - 1.5, a.depth / 2, 1.2));
  }
});

test('stock tools crush, push or detour, with explicit traction and Blade unlocks', () => {
  for (const kind of ['harvester', 'excavator'] as const)
    assert.equal(hayHandling(stockVehicle(kind)).mode, 'crush');
  for (const kind of ['bulldozer', 'baler', 'mixer'] as const)
    assert.equal(hayHandling(stockVehicle(kind)).mode, 'push');
  for (const kind of ['sprayer', 'crane', 'blower'] as const) {
    const v = stockVehicle(kind);
    assert.equal(hayHandling(v).mode, 'detour');
    v.upgrades.traction = 2;
    assert.equal(hayHandling(v).mode, 'detour');
    v.upgrades.traction = 3;
    assert.equal(hayHandling(v).mode, 'push');
  }
  const v = stockVehicle('bulldozer');
  v.upgrades.unique = 3;
  assert.equal(hayHandling(v).mode, 'crush');
});

test('prediction is pure, pushes require grip and space, and sweeps cannot tunnel', () => {
  const a = arena(),
    v = stockVehicle('mixer'),
    self = body(v);
  const before = structuredClone(a);
  const contacts = hayContacts(a, self, 10.5, 10.5, [self]);
  assert.ok(contacts?.length);
  assert.ok(contacts[0].z > a.obstacles[0].z);
  assert.deepEqual(a, before);
  assert.equal(canTravel(a, body(stockVehicle('sprayer')), 10.5, 14, []), false);
  a.obstacles.push({ x: 10.5, z: 12.5, w: 4, d: 1, h: 2, kind: 'stall' });
  assert.equal(hayContacts(a, self, 10.5, 10.5, []), null);
  a.obstacles.pop();
  assert.equal(hayContacts(a, self, 10.5, 10.5, [{ id: 42, x: 10.5, z: 13, radius: 1 }]), null);
  a.obstacles.push({ ...bale(), id: -2, z: 12 });
  assert.equal(hayContacts(a, self, 10.5, 10.5, []), null, 'no chain pushing');
  a.obstacles = [{ ...bale(), x: 10.5, z: 19.5 }];
  assert.equal(hayContacts(a, body(v, 10.5, 17), 10.5, 20, []), null, 'no wall tunneling');
  a.obstacles = [{ ...bale(), x: 10.5, z: 3 }];
  const weak = stockVehicle('mixer');
  // Barn mud sits between x=.34w and .57w at z<5.
  assert.equal(hayContacts(a, body(weak, 10.5, 1.5), 10.5, 3.5, []), null);
  weak.upgrades.traction = 1;
  assert.ok(hayContacts(a, body(weak, 10.5, 1.5), 10.5, 3.5, []));
});

test('small chassis can use a gap that blocks a larger chassis; pushing is speed limited', () => {
  const a = arena();
  a.obstacles = [
    { x: 8.3, z: 10.5, w: 2.2, d: 6, h: 2, kind: 'stall' },
    { x: 12.7, z: 10.5, w: 2.2, d: 6, h: 2, kind: 'stall' },
  ];
  assert.equal(canTravel(a, body(stockVehicle('sprayer')), 10.5, 14, []), true);
  assert.equal(canTravel(a, body(stockVehicle('mixer')), 10.5, 14, []), false);
  const v = stockVehicle('baler');
  const near = body(v, 10.5, 8.8);
  assert.equal(hayDriveSpeed(arena(), near, 30), hayHandling(v).pushSpeed);
  const stock = hayHandling(v).pushSpeed;
  v.upgrades.speed = 5;
  assert.equal(hayHandling(v).pushSpeed, stock, 'speed cannot substitute for pushing force');
  v.upgrades.traction = 2;
  assert.ok(hayHandling(v).pushSpeed > stock);
});

test('routing and target cost fields detour around hay, and crushers can open a blocked corridor', () => {
  const a = arena(),
    v = stockVehicle('sprayer');
  const path = findPath(
    a,
    10.5,
    5.5,
    10.5,
    16.5,
    0.3,
    new Set(),
    0,
    vehicleRadius(v),
    undefined,
    v,
  );
  assert.deepEqual(path.at(-1), [10.5, 16.5]);
  assert.ok(path.every(([x, z]) => !touchesHay(a.obstacles[0], x, z, vehicleRadius(v))));
  assert.ok(Number.isFinite(pathCosts(a, 10.5, 5.5, 0.3, vehicleRadius(v), v)[16 * a.width + 10]));
  a.obstacles.push(
    { x: 5, z: 11, w: 8, d: 20, h: 3, kind: 'stall' },
    { x: 16, z: 11, w: 8, d: 20, h: 3, kind: 'stall' },
  );
  assert.notDeepEqual(
    findPath(a, 10.5, 5.5, 10.5, 16.5, 0.3, new Set(), 0, vehicleRadius(v), undefined, v).at(-1),
    [10.5, 16.5],
  );
  const crusher = stockVehicle('harvester');
  assert.deepEqual(
    findPath(
      a,
      10.5,
      5.5,
      10.5,
      16.5,
      0.5,
      new Set(),
      0,
      vehicleRadius(crusher),
      undefined,
      crusher,
    ).at(-1),
    [10.5, 16.5],
  );
});

function pin(sim: Simulation, b: Balloon, x: number, y: number, z: number) {
  sim.world.forEachRigidBody((body) => {
    const p = body.translation();
    if (Math.hypot(p.x - b.x, p.y - b.y, p.z - b.z) < 0.0001) {
      body.setTranslation({ x, y, z }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });
  Object.assign(b, {
    x,
    px: x,
    y,
    py: y,
    float: y,
    baseFloat: y,
    z,
    pz: z,
    dx: 0,
    dz: 0,
    nextTurn: Infinity,
    hp: 10000,
  });
}
function throughHay(kind: OwnedVehicle['kind'], traction = 0, unique = 0) {
  const run = newRun();
  run.round = 4;
  const o = arenaFor('barn', 4).obstacles.find((o) => o.loose)!;
  const v = { ...stockVehicle(kind), id: 1, placed: true, x: o.x - 1, z: o.z - 6.5 };
  v.upgrades.traction = traction;
  v.upgrades.unique = unique;
  run.fleet = [v];
  const sim = new Simulation(run);
  sim.wave = [{ tick: 0, kind: 'basic', layer: 1, fleeing: false, regen: false, armor: false }];
  sim.vehicles[0].attackTick = Infinity;
  sim.step();
  pin(sim, sim.balloons[0], o.x, 0.8, o.z + 8);
  const live = sim.vehicles[0];
  live.path = [[o.x, o.z + 5]];
  live.yieldUntil = 10000;
  live.nextPath = live.nextSelect = 10000;
  return { sim, live, o };
}

test('real driving spends time clearing hay, removes its collider, and preserves scenery', () => {
  for (const kind of ['harvester', 'excavator', 'bulldozer'] as const) {
    const { sim, live, o } = throughHay(kind, 0, kind === 'bulldozer' ? 3 : 0);
    try {
      let clearingTicks = 0;
      for (let i = 0; i < 550; i++) {
        sim.step();
        if (live.state === 'clearing') clearingTicks++;
        assert.ok(clearPosition(sim.arena, live.x, live.z, vehicleRadius(live)));
      }
      assert.ok(clearingTicks >= 40, `${kind}: clearing was free`);
      assert.ok(sim.hayCrushed >= 1);
      assert.ok(!sim.arena.obstacles.some((b) => b.id === o.id));
      assert.ok(!sim.bales.some((b) => b.id === o.id));
      assert.ok(live.z > o.z + 2, `${kind}: stopped at ${live.z}`);
      assert.equal(sim.arena.obstacles.filter((b) => !b.loose).length, 8);
    } finally {
      sim.dispose();
    }
  }
});

test('real pushing moves the same rendered obstacle and collider without crushing or overlap', () => {
  const { sim, live, o } = throughHay('bulldozer');
  try {
    for (let i = 0; i < 500; i++) {
      sim.step();
      assert.ok(clearPosition(sim.arena, live.x, live.z, vehicleRadius(live)));
    }
    const moved = sim.bales.find((b) => b.id === o.id)!;
    assert.ok(moved.z > o.z + 2);
    assert.ok(sim.hayPushed >= 1);
    assert.equal(sim.hayCrushed, 0);
    assert.equal(
      sim.arena.obstacles.find((b) => b.id === o.id),
      moved,
    );
    let colliderFound = false;
    sim.world.forEachRigidBody((body) => {
      const p = body.translation();
      if (Math.hypot(p.x - moved.x, p.z - moved.z) < 0.001) colliderFound = true;
    });
    assert.ok(colliderFound);
  } finally {
    sim.dispose();
  }
});

test('hay movement and clearing remain deterministic', () => {
  const outcomes = Array.from({ length: 2 }, () => {
    const { sim } = throughHay('harvester', 2);
    try {
      for (let i = 0; i < 400; i++) sim.step();
      return {
        bales: sim.bales,
        vehicles: sim.vehicles,
        crushed: sim.hayCrushed,
        pushed: sim.hayPushed,
      };
    } finally {
      sim.dispose();
    }
  });
  assert.deepEqual(outcomes[0], outcomes[1]);
});

test('carrier drops use the same terrain system and skip occupied landing spots', () => {
  for (const enabled of [true, false]) {
    const run = newRun();
    run.round = 10;
    run.fleet = [{ ...stockVehicle('sprayer'), id: 1, placed: true, x: 18, z: 16 }];
    const sim = new Simulation(run, enabled);
    try {
      sim.wave = [
        { tick: 0, kind: 'carrier', layer: 1, fleeing: false, regen: false, armor: false },
      ];
      sim.vehicles[0].attackTick = Infinity;
      sim.step();
      const b = sim.balloons[0];
      pin(sim, b, 25, 3, 18);
      b.spawned = 0;
      sim.tick = 1200;
      const initial = sim.bales.length;
      sim.step();
      assert.equal(sim.bales.length, initial + Number(enabled));
      if (enabled) {
        const dropped = sim.bales.find((bale) => bale.id > 0)!;
        assert.equal(
          sim.arena.obstacles.find((o) => o.id === dropped.id),
          dropped,
        );
        assert.equal(dropped.integrity, 1);
        pin(sim, b, sim.vehicles[0].x, 3, sim.vehicles[0].z);
        sim.tick = 2400;
        sim.step();
        assert.equal(sim.bales.length, initial + 1, 'no drops inside the chassis');
      } else assert.equal(initial, 0);
    } finally {
      sim.dispose();
    }
  }
});
