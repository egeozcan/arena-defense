import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, VEHICLES, type Run, type VehicleKind } from '../src/sim/data';
import { Simulation, initPhysics } from '../src/sim/engine';
import { SimHost, type HostResponse, type SimSnapshot } from '../src/sim/host';
import { SimView, type SimClient } from '../src/ui/sim-client';
import { neutralDriverInput } from '../src/sim/vehicle-pilot';
await initPhysics();

function mixedRun(): Run {
  const run = newRun('hard', 'yard');
  run.round = 20;
  const roster = Object.keys(VEHICLES) as VehicleKind[];
  run.fleet = roster.map((kind, i) => ({
    id: i + 1,
    kind,
    x: 10 + (i % 4) * 6,
    z: 8 + Math.floor(i / 4) * 6,
    rotation: 0,
    targeting: 'Nearest',
    placed: true,
    upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
    spent: VEHICLES[kind].cost,
  }));
  return run;
}

// postMessage delivers a structured clone; mimic it so the view never aliases engine state.
function deliver(response: HostResponse | null): HostResponse {
  assert.ok(response);
  return structuredClone(response);
}
function snapshotOf(response: HostResponse | null): SimSnapshot {
  const message = deliver(response);
  assert.ok(message.type === 'snapshot' || message.type === 'started');
  return message.snapshot;
}

test('worker snapshots mirror the simulation and keep entity identity', () => {
  const run = mixedRun();
  const host = new SimHost();
  const direct = new Simulation(run);
  const view = new SimView({} as SimClient, 1, run);
  try {
    const started = deliver(host.handle({ type: 'start', session: 1, run }));
    assert.equal(started.type, 'started');
    if (started.type !== 'started') return;
    view.run = started.run;
    view.apply(started.snapshot);
    const firstVehicle = view.vehicles[0];
    let ticks = 0;
    for (const batch of [1, 3, 2, 8, 1, 5, 4, 1, 2, 3].flatMap((n) => Array(12).fill(n))) {
      view.apply(snapshotOf(host.handle({ type: 'advance', session: 1, ticks: batch })));
      for (let i = 0; i < batch; i++) direct.step();
      ticks += batch;
      assert.equal(view.tick, direct.tick);
      assert.deepEqual(view.balloons, direct.balloons);
      assert.deepEqual(view.vehicles, direct.vehicles);
      assert.deepEqual(view.events, direct.events);
      assert.equal(view.pops, direct.pops);
      assert.equal(view.pending, direct.pending);
      assert.equal(view.canFinishEarly, direct.canFinishEarly);
      assert.equal(view.rhythm.active(view.tick), direct.rhythm.active(direct.tick));
      for (const v of direct.vehicles) assert.equal(view.vehicleStatus(v), direct.vehicleStatus(v));
    }
    assert.ok(ticks > 300);
    assert.ok(direct.pops > 0, 'the comparison should cover combat');
    // Renderers keep a vehicle reference across frames.
    assert.equal(view.vehicles[0], firstVehicle);
    assert.equal(firstVehicle.x, direct.vehicles[0].x);
  } finally {
    direct.dispose();
    host.handle({ type: 'dispose', session: 1 });
  }
});

test('worker host ignores requests from a previous round', () => {
  const host = new SimHost();
  const run = mixedRun();
  try {
    host.handle({ type: 'start', session: 1, run });
    host.handle({ type: 'start', session: 2, run });
    assert.equal(host.handle({ type: 'advance', session: 1, ticks: 5 }), null);
    assert.equal(snapshotOf(host.handle({ type: 'advance', session: 2, ticks: 5 })).tick, 5);
  } finally {
    host.handle({ type: 'dispose', session: 2 });
  }
});

test('driver input sent with an advance applies before its first tick', () => {
  const run = mixedRun();
  const host = new SimHost();
  const direct = new Simulation(run);
  const input = { ...neutralDriverInput(), throttle: 1 };
  try {
    host.handle({ type: 'start', session: 1, run });
    host.handle({ type: 'enqueue', session: 1, command: { ability: 'pilot', vehicleId: 1 } });
    direct.enqueue({ ability: 'pilot', vehicleId: 1 });
    host.handle({ type: 'advance', session: 1, ticks: 1 });
    direct.step();
    const snapshot = snapshotOf(
      host.handle({ type: 'advance', session: 1, ticks: 30, drive: { vehicleId: 1, input } }),
    );
    direct.enqueue({ ability: 'drive', vehicleId: 1, input });
    for (let i = 0; i < 30; i++) direct.step();
    assert.deepEqual(snapshot.vehicles, structuredClone(direct.vehicles));
    assert.ok(Math.abs(snapshot.vehicles.find((v) => v.id === 1)!.speed) > 0.1);
    const replay = deliver(host.handle({ type: 'replay', session: 1 }));
    assert.equal(replay.type, 'replay');
    if (replay.type === 'replay') assert.deepEqual(replay.replay, direct.replay());
  } finally {
    direct.dispose();
    host.handle({ type: 'dispose', session: 1 });
  }
});
