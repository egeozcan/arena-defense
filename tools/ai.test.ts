import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arenaFor, newRun, TARGETS, type OwnedVehicle, type VehicleKind } from '../src/sim/data';
import { Simulation, initPhysics } from '../src/sim/engine';
import { findPath } from '../src/sim/pathfinding';
await initPhysics();
test('anchored cranes apply every strategy only to balloons in boom range', () => {
  for (const targeting of TARGETS) {
    const run = newRun();
    run.round = 8;
    run.fleet = [vehicle('crane', 1, 26, 10)];
    run.fleet[0].upgrades.unique = 5;
    run.fleet[0].targeting = targeting;
    const sim = new Simulation(run);
    try {
      sim.wave = [0, 1].map((gate, i) => ({
        tick: i * 30,
        kind: 'high',
        layer: 1,
        fleeing: false,
        regen: false,
        armor: false,
        gate,
        lane: 0.5,
      }));
      for (let i = 0; i < 1200; i++) sim.step();
      assert.equal(sim.pops, 1, `${targeting}: distant target blocked a reachable balloon`);
      assert.equal(sim.vehicles[0].x, 27);
      assert.equal(sim.vehicles[0].z, 11.5);
      assert.equal(sim.canFinishEarly, true);
    } finally {
      sim.dispose();
    }
  }
});
function vehicle(kind: VehicleKind, id: number, x: number, z: number): OwnedVehicle {
  return {
    id,
    kind,
    x,
    z,
    rotation: 0,
    targeting: 'Nearest',
    placed: true,
    upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
    spent: 400,
  };
}
test('nearest stays nearest even when another vehicle is chasing that balloon', () => {
  const run = newRun();
  run.fleet = [vehicle('sprayer', 1, 4, 7), vehicle('sprayer', 2, 6, 7)];
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
    assert.equal(
      sim.vehicles[1].target,
      sim.balloons[0].id,
      'second vehicle must select the nearby balloon, not the far gate',
    );
  } finally {
    sim.dispose();
  }
});
test('a crowded fleet keeps engaging instead of spending the remainder of a wave stuck', () => {
  const run = newRun();
  run.round = 10;
  run.fleet = [
    vehicle('harvester', 1, 9, 5),
    vehicle('sprayer', 2, 13, 5),
    vehicle('excavator', 3, 7, 8),
    vehicle('crane', 4, 15, 9),
  ];
  const sim = new Simulation(run);
  try {
    const stalls = [0, 0, 0, 0];
    while (!sim.summary && sim.tick < 6000) {
      sim.step();
      sim.vehicles.forEach((v, i) => {
        if (
          v.state === 'stuck' ||
          (v.state === 'moving' && Math.hypot(v.x - v.px, v.z - v.pz) < 0.0001)
        )
          stalls[i]++;
      });
    }
    assert.ok(
      stalls.every((n) => n < 600),
      `vehicles stall for ${stalls.map((n) => (n / 60).toFixed(1)).join(', ')} seconds`,
    );
  } finally {
    sim.dispose();
  }
});
test('nearest attacks a balloon within reach above an obstacle before driving to the far gate', () => {
  const run = newRun();
  run.fleet = [vehicle('sprayer', 1, 5, 3)];
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
      lane: 4 / sim.arena.depth,
    }));
    sim.vehicles[0].attackTick = 10000;
    sim.step();
    assert.equal(sim.vehicles[0].target, sim.balloons[0].id);
    assert.equal(sim.vehicles[0].state, 'attacking');
  } finally {
    sim.dispose();
  }
});
test('changing strategy mid-wave retargets immediately and replays deterministically', () => {
  const run = newRun();
  run.fleet = [vehicle('excavator', 1, 5, 7)];
  const sim = new Simulation(run);
  const replay = new Simulation(run);
  try {
    sim.wave = [
      {
        tick: 0,
        kind: 'basic',
        layer: 1,
        fleeing: false,
        regen: false,
        armor: false,
        gate: 0,
        lane: 0.5,
      },
      {
        tick: 0,
        kind: 'armored',
        layer: 1,
        fleeing: false,
        regen: false,
        armor: true,
        gate: 1,
        lane: 0.5,
      },
    ];
    replay.wave = structuredClone(sim.wave);
    for (const s of [sim, replay]) {
      s.vehicles[0].attackTick = 10000;
      s.step();
    }
    assert.equal(sim.vehicles[0].target, sim.balloons[0].id);
    sim.enqueue({ ability: 'targeting', vehicleId: 1, targeting: 'Strongest' });
    sim.step();
    assert.equal(sim.vehicles[0].target, sim.balloons[1].id);
    assert.equal(sim.vehicles[0].targeting, 'Strongest');
    assert.equal(sim.replay().run.fleet[0].targeting, 'Nearest');
    replay.enqueue(sim.replay().commands[0].command);
    replay.step();
    assert.deepEqual(replay.vehicles, sim.vehicles);
    assert.deepEqual(replay.balloons, sim.balloons);
  } finally {
    sim.dispose();
    replay.dispose();
  }
});
test('specialist idling explains height and armor limits and resumes for eligible targets', () => {
  const run = newRun();
  run.fleet = [vehicle('harvester', 1, 9, 5)];
  const sim = new Simulation(run);
  try {
    sim.wave = [
      { tick: 0, kind: 'high', layer: 1, fleeing: false, regen: false, armor: false },
      { tick: 30, kind: 'armored', layer: 1, fleeing: false, regen: false, armor: true },
      { tick: 60, kind: 'basic', layer: 1, fleeing: false, regen: false, armor: false },
    ];
    sim.step();
    assert.equal(sim.vehicles[0].state, 'idle');
    assert.match(sim.vehicleStatus(sim.vehicles[0]), /Out of reach/);
    while (sim.tick <= 30) sim.step();
    assert.match(sim.vehicleStatus(sim.vehicles[0]), /Armor needs upgrades/);
    while (sim.tick <= 60) sim.step();
    assert.notEqual(sim.vehicles[0].state, 'idle');
    assert.match(sim.vehicleStatus(sim.vehicles[0]), /Basic/);
  } finally {
    sim.dispose();
  }
});
test('strongest strategy is not overridden by a teammate claiming the strongest target', () => {
  const run = newRun();
  run.fleet = [vehicle('excavator', 1, 5, 7), vehicle('excavator', 2, 8, 7)];
  run.fleet.forEach((v) => (v.targeting = 'Strongest'));
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
        gate: 0,
        lane: 0.5,
      },
      {
        tick: 0,
        kind: 'armored',
        layer: 1,
        fleeing: false,
        regen: false,
        armor: true,
        gate: 1,
        lane: 0.5,
      },
    ];
    sim.vehicles.forEach((v) => (v.attackTick = 10000));
    sim.step();
    assert.ok(sim.vehicles.every((v) => v.target === sim.balloons[1].id));
  } finally {
    sim.dispose();
  }
});
test('approach paths finish at the firing point even when it is in the current grid cell', () => {
  const path = findPath(arenaFor('barn'), 7.9, 5.9, 5, 5, 0.5, new Set(), 2.7);
  assert.ok(path.length > 0);
  const [x, z] = path.at(-1)!;
  assert.ok(Math.hypot(x - 5, z - 5) <= 2.7);
});
