import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  arenaFor,
  clearPosition,
  newRun,
  vehicleRadius,
  type OwnedVehicle,
  type VehicleKind,
} from '../src/sim/data';
import { Simulation, initPhysics } from '../src/sim/engine';
import { canTravel, trafficCells } from '../src/sim/traffic';
import { findPath } from '../src/sim/pathfinding';
await initPhysics();
function vehicle(kind: VehicleKind, id: number, x: number, z: number): OwnedVehicle {
  return {
    id,
    kind,
    x,
    z,
    rotation: 0,
    targeting: 'Nearest',
    placed: true,
    spent: 400,
    upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
  };
}
function assertClear(sim: Simulation) {
  for (const v of sim.vehicles) {
    assert.ok(
      clearPosition(sim.arena, v.x, v.z, vehicleRadius(v)),
      `vehicle ${v.id} clips scenery at ${v.x},${v.z}`,
    );
    for (const other of sim.vehicles)
      if (v.id < other.id)
        assert.ok(
          Math.hypot(v.x - other.x, v.z - other.z) >=
            vehicleRadius(v) + vehicleRadius(other) + 0.019,
          `vehicles ${v.id} and ${other.id} overlap at tick ${sim.tick}`,
        );
  }
}
test('expanded arenas provide substantially more playable room', () => {
  assert.ok(arenaFor('barn').width * arenaFor('barn').depth >= 48 * 36);
  assert.ok(arenaFor('yard').width * arenaFor('yard').depth >= 64 * 48);
});
test('a swept collision blocks tunneling through parked vehicles', () => {
  const a = arenaFor('barn');
  const self = { id: 1, x: 10, z: 12, radius: 1 };
  const parked = { id: 2, x: 15, z: 12, radius: 1 };
  assert.equal(canTravel(a, self, 20, 12, [self, parked]), false);
  assert.equal(canTravel(a, self, 10, 15, [self, parked]), true);
});
test('routing leaves space for the chassis around parked vehicles and scenery', () => {
  const a = arenaFor('barn');
  const self = { id: 1, x: 10.5, z: 12.5, radius: 1.12 };
  const parked = { id: 2, x: 15.5, z: 12.5, radius: 1.12 };
  const path = findPath(
    a,
    self.x,
    self.z,
    22.5,
    12.5,
    0.5,
    trafficCells(a, self, [self, parked]),
    0,
    self.radius,
  );
  assert.deepEqual(path.at(-1), [22.5, 12.5]);
  for (const [x, z] of path) {
    assert.ok(clearPosition(a, x, z, self.radius));
    assert.ok(Math.hypot(x - parked.x, z - parked.z) >= 2.24);
  }
});
test('head-on vehicles pass each other without collisions or permanent gridlock', () => {
  const run = newRun();
  run.fleet = [vehicle('excavator', 1, 9, 11), vehicle('excavator', 2, 17, 11)];
  const sim = new Simulation(run);
  try {
    sim.wave = [0, 1].map((gate) => ({
      tick: 0,
      kind: 'basic',
      layer: 1,
      fleeing: false,
      regen: false,
      armor: false,
      gate,
      lane: 0.5,
    }));
    sim.vehicles.forEach((v) => (v.attackTick = 10000));
    sim.step();
    // Fixed destinations isolate the chassis-passing problem from balloon steering.
    for (const b of sim.balloons) {
      b.dx = b.dz = 0;
      b.nextTurn = Infinity;
    }
    sim.vehicles[0].target = sim.balloons[1].id;
    sim.vehicles[1].target = sim.balloons[0].id;
    sim.vehicles.forEach((v) => {
      v.nextSelect = 10000;
      v.path = [];
      v.nextPath = 0;
    });
    for (let i = 0; i < 1800; i++) {
      sim.step();
      assertClear(sim);
    }
    assert.ok(sim.vehicles[0].x > 22, `eastbound vehicle stopped at ${sim.vehicles[0].x}`);
    assert.ok(sim.vehicles[1].x < 9, `westbound vehicle stopped at ${sim.vehicles[1].x}`);
  } finally {
    sim.dispose();
  }
});
test('moving vehicles detour around an idle specialist rather than driving through it', () => {
  const run = newRun();
  run.fleet = [vehicle('excavator', 1, 9, 10), vehicle('crane', 2, 14, 10)];
  const sim = new Simulation(run);
  try {
    sim.wave = [
      {
        tick: 0,
        kind: 'basic',
        layer: 1,
        fleeing: false,
        regen: false,
        armor: false,
        gate: 1,
        lane: 11 / sim.arena.depth,
      },
    ];
    sim.vehicles.forEach((v) => (v.attackTick = 10000));
    const parked = { x: sim.vehicles[1].x, z: sim.vehicles[1].z };
    sim.step();
    for (const b of sim.balloons) {
      b.dx = b.dz = 0;
      b.nextTurn = Infinity;
    }
    for (let i = 0; i < 1500; i++) {
      sim.step();
      assertClear(sim);
    }
    assert.ok(sim.vehicles[0].x > 22);
    assert.equal(sim.vehicles[1].x, parked.x);
    assert.equal(sim.vehicles[1].z, parked.z);
  } finally {
    sim.dispose();
  }
});
test('an idle specialist yields when it blocks the last attackable balloon in a narrow bay', () => {
  const run = newRun();
  run.fleet = [vehicle('harvester', 1, 9, 6), vehicle('crane', 2, 2, 6)];
  run.fleet[0].upgrades.attack = 3;
  const sim = new Simulation(run);
  try {
    sim.wave = [
      {
        tick: 0,
        kind: 'armored',
        layer: 1,
        fleeing: false,
        regen: false,
        armor: true,
        gate: 0,
        lane: 7.5 / sim.arena.depth,
      },
    ];
    const parked = { x: sim.vehicles[1].x, z: sim.vehicles[1].z };
    for (let i = 0; i < 1200 && !sim.summary; i++) {
      sim.step();
      assertClear(sim);
    }
    assert.equal(sim.summary?.cleared, true, 'the idle crane blocked the harvester for 20 seconds');
    assert.ok(Math.hypot(sim.vehicles[1].x - parked.x, sim.vehicles[1].z - parked.z) > 1);
    assert.ok(sim.vehicles[0].pops > 0);
  } finally {
    sim.dispose();
  }
});
test('a vehicle finishes pulling aside when its last eligible target is popped', () => {
  const run = newRun();
  run.abilities.pitchfork = 0;
  run.fleet = [vehicle('harvester', 1, 9, 6)];
  const sim = new Simulation(run);
  try {
    sim.wave = ['basic', 'high'].map((kind) => ({
      tick: 0,
      kind: kind as 'basic' | 'high',
      layer: 1,
      fleeing: false,
      regen: false,
      armor: false,
      gate: kind === 'high' ? 0 : 1,
      lane: 0.5,
    }));
    sim.step();
    const v = sim.vehicles[0];
    const destination: [number, number] = [v.x, v.z + 2.5];
    v.path = [destination];
    v.yieldUntil = sim.tick + 150;
    v.nextPath = v.yieldUntil;
    const target = sim.balloons.find((b) => b.kind === 'basic')!;
    sim.enqueue({ ability: 'pitchfork', x: target.x, z: target.z });
    for (let i = 0; i < 150; i++) {
      sim.step();
      assertClear(sim);
    }
    assert.ok(Math.hypot(v.x - destination[0], v.z - destination[1]) < 0.01);
    assert.equal(v.yieldUntil, 0);
    assert.equal(v.state, 'idle');
    assert.match(sim.vehicleStatus(v), /Out of reach/);
  } finally {
    sim.dispose();
  }
});
test('older touching deployments are separated while keeping valid saved placements', async () => {
  const { fitFleet, canPlace } = await import('../src/sim/data');
  const a = arenaFor('barn');
  const original = [vehicle('harvester', 1, 9, 5), vehicle('harvester', 2, 11, 5)];
  const fitted = fitFleet(a, original);
  assert.equal(fitted[0].x, original[0].x);
  assert.equal(fitted[0].z, original[0].z);
  assert.ok(canPlace(a, [fitted[0]], fitted[1], fitted[1].x, fitted[1].z));
  assert.deepEqual(fitFleet(a, fitted), fitted);
  assert.equal(original[1].x, 11);
});
test('a mixed fleet stays separated and keeps working in both larger arenas', () => {
  for (const arena of ['barn', 'yard'] as const) {
    const run = newRun('easy', arena);
    run.round = 15;
    run.fleet = [
      vehicle('harvester', 1, 9, 5),
      vehicle('sprayer', 2, 13, 5),
      vehicle('excavator', 3, 7, 8),
      vehicle('crane', 4, 15, 9),
      vehicle('sprayer', 5, 18, 12),
      vehicle('excavator', 6, 10, 12),
    ];
    run.fleet.forEach((v) => {
      v.upgrades.unique = 2;
      v.upgrades.attack = 2;
      v.upgrades.traction = 4;
    });
    const sim = new Simulation(run);
    try {
      let maxWorking = 0;
      for (let i = 0; i < 1800 && !sim.summary; i++) {
        if (i === 300) sim.enqueue({ ability: 'boost', vehicleId: 1 });
        sim.step();
        assertClear(sim);
        maxWorking = Math.max(
          maxWorking,
          sim.vehicles.filter((v) => v.state === 'moving' || v.state === 'attacking').length,
        );
      }
      assert.ok(maxWorking >= 4, `${arena}: fleet stopped engaging`);
      assert.ok(sim.pops > 20, `${arena}: traffic prevented attacks`);
    } finally {
      sim.dispose();
    }
  }
});
