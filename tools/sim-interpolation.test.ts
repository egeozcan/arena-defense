import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun } from '../src/sim/data';
import { SimHost, type HostResponse } from '../src/sim/host';
import { initPhysics } from '../src/sim/engine';
import { SimView, type SimClient } from '../src/ui/sim-client';
await initPhysics();

function fixture() {
  const run = newRun();
  const host = new SimHost();
  const view = new SimView({} as SimClient, 1, run);
  host.handle({ type: 'start', session: 1, run });
  const response = structuredClone(host.handle({ type: 'advance', session: 1, ticks: 1 }));
  assert.ok(response?.type === 'snapshot');
  return { host, view, snapshot: response.snapshot };
}

test('120 Hz frames interpolate between 60 Hz worker snapshots without advancing the simulation', () => {
  const { host, view, snapshot } = fixture();
  try {
    view.apply(snapshot, 0, 1000);
    assert.ok(Math.abs(view.interpolate(1000 + 1000 / 120, 1, false) - 0.5) < 1e-10);
    assert.equal(view.tick, snapshot.tick);
    assert.ok(Math.abs(view.interpolate(1000 + 1000 / 60, 1, false) - 1) < 1e-10);
    assert.equal(view.interpolate(1100, 1, false), 1, 'a busy worker must not cause extrapolation');
    const response: HostResponse | null = structuredClone(
      host.handle({ type: 'advance', session: 1, ticks: 1 }),
    );
    assert.ok(response?.type === 'snapshot');
    view.apply(response.snapshot, 0, 1100);
    assert.ok(Math.abs(view.interpolate(1100 + 1000 / 120, 1, false) - 0.5) < 1e-10);
  } finally {
    host.handle({ type: 'dispose', session: 1 });
  }
});

test('snapshot interpolation follows speed changes and stays at the latest state across pause', () => {
  const { host, view, snapshot } = fixture();
  try {
    view.apply(snapshot, 0.25, 1000);
    assert.ok(Math.abs(view.interpolate(1000 + 1000 / 720, 3, false) - 0.5) < 1e-10);
    assert.ok(Math.abs(view.interpolate(1000 + 4000 / 720, 1, false) - 0.75) < 1e-10);
    assert.equal(view.interpolate(1010, 1, true), 1);
    assert.equal(view.interpolate(2010, 1, true), 1);
    assert.equal(
      view.interpolate(2011, 1, false),
      1,
      'resuming must not move the display backward',
    );
    // A snapshot already in flight when paused may still arrive.
    view.apply(snapshot, 0.1, 2012);
    assert.equal(view.interpolate(2013, 1, true), 1);
  } finally {
    host.handle({ type: 'dispose', session: 1 });
  }
});
