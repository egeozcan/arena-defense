import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PopRhythm, POP_RUSH } from '../src/sim/pop-rush';
import { initPhysics, Simulation } from '../src/sim/engine';
import { newRun, type Spawn } from '../src/sim/data';

test('a quick chain ignites once and cannot extend or bank another rush while active', () => {
  const rhythm = new PopRhythm();
  for (let i = 0; i < 10; i++) rhythm.pop(i * 12);
  assert.equal(rhythm.rushes, 1);
  const end = rhythm.rushUntil;
  for (let tick = 109; tick < end; tick++) rhythm.pop(tick);
  assert.equal(rhythm.rushUntil, end);
  assert.equal(rhythm.rushes, 1);
  assert.equal(rhythm.charge, 0);
  assert.equal(rhythm.active(end), false);
  for (let i = 0; i < 10; i++) rhythm.pop(end + i);
  assert.equal(rhythm.rushes, 2);
  assert.equal(rhythm.rushUntil, end + 9 + POP_RUSH.durationTicks);
});

test('the chain expires on simulation time, preserves its best, and accepts the boundary pop', () => {
  const rhythm = new PopRhythm();
  rhythm.pop(0);
  rhythm.pop(150);
  assert.equal(rhythm.streak, 2);
  rhythm.update(150); // Repeated paused frames cannot consume the fuse.
  rhythm.update(150);
  assert.equal(rhythm.charge, 2);
  rhythm.pop(301);
  assert.equal(rhythm.streak, 1);
  assert.equal(rhythm.charge, 1);
  assert.equal(rhythm.bestStreak, 2);
  rhythm.update(452);
  assert.equal(rhythm.streak, 0);
  assert.equal(rhythm.charge, 0);
});

await initPhysics();
test('fleet overdrive closes travel distance faster and pops armor sooner through normal AI', () => {
  for (const x of [10, 26]) {
    const run = newRun();
    run.fleet = [
      {
        id: 1,
        kind: 'excavator',
        placed: true,
        x,
        z: 10,
        rotation: 0,
        targeting: 'Nearest',
        spent: 550,
        upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
      },
    ];
    const sims = [new Simulation(run), new Simulation(run)];
    try {
      for (const sim of sims)
        sim.wave = [
          {
            tick: 0,
            kind: 'armored',
            layer: 1,
            armor: true,
            fleeing: false,
            regen: false,
            gate: 1,
            lane: 0.5,
          },
        ];
      for (let i = 0; i < 10; i++) sims[1].rhythm.pop(0);
      const distance = [0, 0];
      for (let tick = 0; tick < 30; tick++) {
        sims.forEach((sim, i) => {
          sim.step();
          const vehicle = sim.vehicles[0];
          distance[i] += Math.hypot(vehicle.x - vehicle.px, vehicle.z - vehicle.pz);
        });
      }
      if (x === 10) assert.ok(distance[1] > distance[0] * 1.3, 'Rush should speed the approach');
      else {
        assert.equal(sims[0].pops, 0, 'ordinary tool is still waiting for its second hit');
        assert.equal(sims[1].pops, 1, 'Rush tool should already have broken the armor');
      }
    } finally {
      sims.forEach((sim) => sim.dispose());
    }
  }
});

test('ability pops charge rush and a replay reproduces rhythm and round highlights', () => {
  const run = newRun();
  run.abilities = { pitchfork: 0 };
  const wave: Spawn[] = Array.from({ length: 10 }, () => ({
    tick: 0,
    kind: 'basic',
    layer: 1,
    armor: false,
    fleeing: false,
    regen: false,
    gate: 0,
    lane: 0.5,
  }));
  const first = new Simulation(run);
  const second = new Simulation(run);
  try {
    first.wave = structuredClone(wave);
    second.wave = structuredClone(wave);
    first.step();
    const target = first.balloons[0];
    first.enqueue({ ability: 'pitchfork', x: target.x, z: target.z });
    first.step();
    assert.equal(first.pops, 10);
    assert.equal(first.rhythm.rushes, 1);
    assert.equal(first.summary?.bestStreak, 10);
    assert.equal(first.summary?.rushes, 1);
    for (const entry of first.replay().commands) {
      while (second.tick < entry.tick) second.step();
      second.enqueue(entry.command);
      second.step();
    }
    assert.deepEqual(second.rhythm, first.rhythm);
    assert.deepEqual(second.summary, first.summary);
  } finally {
    first.dispose();
    second.dispose();
  }
});
