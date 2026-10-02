import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MODES,
  BALLOONS,
  newRun,
  waveFor,
  price,
  VEHICLES,
  type BalloonKind,
  type OwnedVehicle,
  type Spawn,
} from '../src/sim/data';
import { initPhysics, Simulation } from '../src/sim/engine';
await initPhysics();
const modes = ['easy', 'medium', 'hard'] as const;

function starter(): OwnedVehicle {
  return {
    id: 1,
    kind: 'harvester',
    placed: true,
    x: 10,
    z: 6,
    rotation: 0,
    targeting: 'Nearest',
    spent: 400,
    upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
  };
}

test('all modes have an affordable starter and a brisk, survivable opening in both arenas', () => {
  for (const mode of modes)
    for (const arena of ['barn', 'yard'] as const) {
      const run = newRun(mode, arena);
      assert.ok(run.cash >= price(run, VEHICLES.harvester.cost));
      run.fleet = [starter()];
      const sim = new Simulation(run);
      while (!sim.summary) sim.step();
      assert.equal(sim.summary.cleared, true, `${mode}/${arena} opening`);
      assert.equal(sim.summary.livesLost, 0);
      // A fixed front cutter must maneuver into position instead of hitting behind the chassis.
      assert.ok(sim.summary.seconds < 35, `${mode}/${arena} opening took ${sim.summary.seconds}s`);
      assert.ok(sim.summary.bonus <= MODES[mode].clearBonus);
      assert.ok(
        sim.summary.earned < 300,
        'the opening should not bankroll a second vehicle by itself',
      );
      sim.dispose();
    }
});

test('difficulty increases wave density without moving the tutorial type introductions', () => {
  for (const round of [1, 8, 20, 40, 60]) {
    const waves = modes.map((mode) => waveFor(round, 73429, mode));
    assert.ok(waves[0].length < waves[1].length && waves[1].length < waves[2].length);
    assert.ok(waves[0].at(-1)!.tick > waves[1].at(-1)!.tick);
    assert.ok(waves[1].at(-1)!.tick > waves[2].at(-1)!.tick);
    for (const wave of waves) assert.ok(wave.every((s, i) => !i || s.tick >= wave[i - 1].tick));
  }
  for (const mode of modes) {
    assert.ok(waveFor(5, 73429, mode).every((s) => s.kind !== 'armored'));
    assert.ok(waveFor(6, 73429, mode).some((s) => s.kind === 'armored'));
    assert.ok(waveFor(7, 73429, mode).every((s) => s.kind !== 'high'));
    assert.ok(waveFor(8, 73429, mode).some((s) => s.kind === 'high'));
  }
});

test('Hard introduces modifiers earlier and Easy has no added armor during its campaign', () => {
  assert.ok(waveFor(10, 73429, 'hard').some((s) => s.fleeing));
  assert.ok(waveFor(10, 73429, 'easy').every((s) => !s.fleeing && !s.regen && !s.armor));
  assert.ok(waveFor(14, 73429, 'hard').some((s) => s.regen));
  assert.ok(waveFor(22, 73429, 'hard').some((s) => s.armor));
  assert.ok(waveFor(22, 73429, 'medium').every((s) => !s.armor));
  for (let round = 1; round <= 20; round++)
    assert.ok(waveFor(round, 73429, 'easy').every((s) => !s.armor));
});

test('later specialist targets get tougher, while basic and layered balloons keep one-hit pops', () => {
  for (const kind of Object.keys(BALLOONS) as BalloonKind[]) {
    const health = modes.map((mode) => {
      const run = newRun(mode);
      run.round = 40;
      const sim = new Simulation(run);
      sim.wave = [{ tick: 0, kind, layer: 2, fleeing: false, regen: false, armor: false }];
      sim.step();
      const hp = sim.balloons[0].maxHp;
      sim.dispose();
      return hp;
    });
    if (kind === 'basic' || kind === 'layered') assert.deepEqual(health, [1, 1, 1]);
    else assert.ok(health[0] < health[1] && health[1] < health[2]);
  }
});

test('timeout counts queued balloons beyond the physics capacity as lives lost', () => {
  const run = newRun('hard');
  run.round = 60;
  const sim = new Simulation(run);
  sim.wave = Array.from({ length: 350 }, (): Spawn => ({
    tick: 0,
    kind: 'basic',
    layer: 1,
    fleeing: false,
    regen: false,
    armor: false,
  }));
  sim.tick = 10799;
  sim.step();
  assert.equal(sim.balloons.length, 300);
  assert.equal(sim.pending, 50);
  assert.equal(sim.summary?.reason, 'timeout');
  assert.equal(sim.summary?.livesLost, 350);
  assert.equal(sim.summary?.bonus, 0);
  sim.dispose();
});

test('a late queued spawn cannot be reported as a cleared wave at timeout', () => {
  const sim = new Simulation(newRun());
  sim.wave = [{ tick: 12000, kind: 'high', layer: 1, fleeing: false, regen: false, armor: false }];
  sim.tick = 10799;
  sim.step();
  assert.equal(sim.summary?.reason, 'timeout');
  assert.equal(sim.summary?.livesLost, 2);
  sim.dispose();
});

test('Hard command replay reproduces the mode-specific wave and payout', () => {
  const run = newRun('hard');
  run.round = 18;
  run.fleet = [starter()];
  run.abilities = { pitchfork: 0 };
  const first = new Simulation(run);
  while (!first.summary) {
    if (first.tick === 600) first.enqueue({ ability: 'pitchfork', x: 8, z: 10 });
    first.step();
  }
  const replay = first.replay();
  const second = new Simulation(replay.run);
  let index = 0;
  while (!second.summary) {
    while (replay.commands[index]?.tick === second.tick)
      second.enqueue(replay.commands[index++].command);
    second.step();
  }
  assert.deepEqual(second.summary, first.summary);
  assert.deepEqual(second.balloons, first.balloons);
  first.dispose();
  second.dispose();
});
