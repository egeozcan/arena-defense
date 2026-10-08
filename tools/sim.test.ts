import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  arenaFor,
  canPlace,
  newRun,
  upgradeAllowed,
  waveFor,
  type OwnedVehicle,
  type VehicleKind,
} from '../src/sim/data';
import { Simulation, initPhysics, vehicleStats } from '../src/sim/engine';
import { findPath } from '../src/sim/pathfinding';
await initPhysics();
function vehicle(kind: VehicleKind, id = 1, x = 10, z = 6): OwnedVehicle {
  return {
    id,
    kind,
    upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
    spent: 400,
    placed: true,
    x,
    z,
    rotation: 0,
    targeting: 'Nearest',
  };
}
test('gust expiry keeps yard high-flyers within base crane coverage', () => {
  const run = newRun('easy', 'yard');
  run.round = 8;
  run.abilities.gust = 0;
  run.fleet = [vehicle('crane', 1, 1, 12)];
  const sim = new Simulation(run);
  try {
    sim.wave = [
      {
        tick: 0,
        kind: 'high',
        layer: 1,
        fleeing: false,
        regen: false,
        armor: false,
        gate: 1,
        lane: 0.5,
      },
    ];
    sim.step();
    const originalHeight = sim.balloons[0].float;
    // The faster crane can now catch this balloon before the gust expires.
    // Hold its tool so this scenario still verifies height restoration first.
    sim.vehicles[0].attackTick = 602;
    sim.enqueue({ ability: 'gust', dx: 1, dz: 0 });
    while (sim.tick < 602 && !sim.summary) sim.step();
    assert.equal(sim.balloons[0]?.float, originalHeight);
    while (sim.tick < 6000 && !sim.summary) sim.step();
    assert.equal(sim.summary?.cleared, true);
  } finally {
    sim.dispose();
  }
});
test('tower cranes attack eligible targets instead of earlier immune armored balloons', () => {
  const run = newRun();
  run.round = 30;
  run.fleet = [vehicle('crane', 1, 26, 10)];
  run.fleet[0].upgrades.unique = 5;
  const sim = new Simulation(run);
  try {
    sim.wave = [true, true, false].map((armor) => ({
      tick: 0,
      kind: 'high',
      layer: 1,
      fleeing: false,
      regen: false,
      armor,
      gate: 1,
      lane: 0.5,
    }));
    for (let i = 0; i < 1200; i++) sim.step();
    assert.equal(sim.pops, 1);
    assert.ok(sim.balloons.every((b) => b.armor && b.hp === 2));
  } finally {
    sim.dispose();
  }
});
test('deterministic physics: 10,000 ticks, identical seed and timestamped commands', () => {
  const run = newRun();
  run.round = 15;
  run.abilities = { gust: 0, pitchfork: 0 };
  const sims = [new Simulation(run), new Simulation(run)];
  for (const sim of sims)
    for (let i = 0; i < 10000; i++) {
      if (i === 1200) sim.enqueue({ ability: 'gust', dx: 1, dz: 0 });
      if (i === 1800) sim.enqueue({ ability: 'pitchfork', x: 12, z: 8 });
      sim.step();
    }
  assert.deepEqual(sims[0].balloons, sims[1].balloons);
  assert.deepEqual(sims[0].replay(), sims[1].replay());
  assert.equal(sims[0].tick, 10000);
  sims.forEach((s) => s.dispose());
});
test('a starter harvester clears the first round and receives the documented payout', () => {
  const run = newRun();
  run.fleet = [vehicle('harvester')];
  const sim = new Simulation(run);
  while (!sim.summary) sim.step();
  assert.equal(sim.summary.cleared, true);
  assert.equal(sim.summary.pops, 30);
  assert.equal(sim.summary.livesLost, 0);
  assert.equal(sim.summary.baseIncome, 162);
  assert.equal(sim.summary.bonus, 100);
  assert.equal(sim.summary.earned, sim.summary.popCash + 262);
  sim.dispose();
});
test('timeout pays income and deducts weighted remaining lives', () => {
  const run = newRun();
  run.round = 6;
  const sim = new Simulation(run);
  while (!sim.summary) sim.step();
  assert.equal(sim.tick, 10800);
  assert.equal(sim.summary.baseIncome, 172);
  assert.equal(sim.summary.bonus, 0);
  assert.equal(sim.summary.livesLost, 72);
  sim.dispose();
});
test('upgrades lock other paths and enforce the 5 + 2 cap', () => {
  const v = vehicle('harvester');
  v.upgrades.attack = 3;
  v.upgrades.speed = 2;
  assert.equal(upgradeAllowed(v, 'speed'), false);
  assert.equal(upgradeAllowed(v, 'traction'), false);
  assert.equal(upgradeAllowed(v, 'unique'), false);
  assert.equal(upgradeAllowed(v, 'attack'), true);
  v.upgrades.attack = 5;
  assert.equal(upgradeAllowed(v, 'attack'), false);
});
test('placement honors obstacles, footprints, bounds and overlaps', () => {
  const a = arenaFor('barn'),
    v = vehicle('harvester');
  assert.equal(canPlace(a, [], v, 10, 6), true);
  assert.equal(canPlace(a, [], v, 2, 3), false);
  assert.equal(canPlace(a, [], v, a.width - 1, a.depth - 1), false);
  assert.equal(canPlace(a, [v], vehicle('sprayer', 2), 10, 7), false);
});
test('pathfinding routes around barn hay stacks', () => {
  const a = arenaFor('barn');
  const path = findPath(a, 1.5, 4.5, 7.5, 4.5, 0.5);
  assert.ok(path.length > 6);
  assert.deepEqual(path.at(-1), [7.5, 4.5]);
});
test('armor blocks cutting; excavators can clear it', () => {
  const run = newRun();
  run.round = 6;
  run.fleet = [vehicle('harvester')];
  const sim = new Simulation(run);
  while (!sim.summary) sim.step();
  assert.ok(sim.balloons.some((b) => b.kind === 'armored'));
  assert.ok(sim.balloons.filter((b) => b.kind === 'armored').every((b) => b.hp === 6));
  sim.dispose();
  run.fleet = [vehicle('excavator')];
  const second = new Simulation(run);
  while (!second.summary) second.step();
  assert.equal(second.summary.cleared, true);
  second.dispose();
});
test('all roster and modifiers appear by round 20; later waves are seeded', () => {
  const wave = waveFor(20, 1);
  assert.equal(new Set(wave.map((s) => s.kind)).size, 5);
  assert.ok(wave.some((s) => s.regen));
  assert.ok(wave.some((s) => s.fleeing));
  assert.deepEqual(waveFor(40, 2), waveFor(40, 2));
  assert.notDeepEqual(waveFor(40, 2), waveFor(40, 3));
});
test('abilities consume a charge, respect cooldown and produce replay events', () => {
  const run = newRun();
  run.abilities = { gust: 2 };
  const sim = new Simulation(run);
  sim.enqueue({ ability: 'gust', dx: 1, dz: 0 });
  sim.step();
  assert.equal(sim.abilityReady.gust[0], 1440);
  assert.equal(sim.abilityReady.gust[1], 0);
  assert.equal(sim.commands[0].tick, 0);
  sim.enqueue({ ability: 'gust', dx: 0, dz: 1 });
  sim.step();
  assert.equal(sim.abilityReady.gust[1], 1441);
  sim.dispose();
});
test('vehicle coverage widens with its unique upgrades', () => {
  const v = vehicle('harvester');
  v.upgrades.unique = 4;
  assert.equal(vehicleStats(v).max, 3);
});
test('displayed permanent damage matches actual tier-4 and tier-5 hits', () => {
  const damages: Record<VehicleKind, [number, number]> = {
    harvester: [2.5, 5],
    sprayer: [2.5, 7.5],
    excavator: [10, 30],
    crane: [7.5, 7.5],
  };
  for (const kind of Object.keys(damages) as VehicleKind[]) {
    for (const tier of [4, 5]) {
      const run = newRun();
      run.fleet = [vehicle(kind, 1, 4, 7)];
      run.fleet[0].upgrades.attack = tier;
      const expected = damages[kind][tier - 4];
      assert.equal(vehicleStats(run.fleet[0]).damage, expected, `${kind} tier ${tier} profile`);
      const sim = new Simulation(run);
      try {
        sim.wave = [
          {
            tick: 0,
            kind: kind === 'crane' ? 'high' : 'basic',
            layer: 1,
            fleeing: false,
            regen: false,
            armor: false,
            gate: 0,
            lane: 0.5,
          },
        ];
        sim.vehicles[0].attackTick = 10000;
        sim.step();
        const balloon = sim.balloons[0];
        balloon.hp = 100;
        sim.vehicles[0].attackTick = 0;
        while (!sim.attacks.length && sim.tick < 600 && !sim.summary) sim.step();
        assert.ok(sim.attacks.length, `${kind} tier ${tier} must land a hit`);
        assert.equal(100 - balloon.hp, expected, `${kind} tier ${tier} combat`);
      } finally {
        sim.dispose();
      }
    }
  }
});
test('replaying a full fleet with ticked abilities reproduces the outcome', () => {
  const run = newRun();
  run.round = 15;
  run.fleet = [
    vehicle('harvester', 1, 9, 5),
    vehicle('sprayer', 2, 13, 5),
    vehicle('excavator', 3, 7, 8),
    vehicle('crane', 4, 15, 9),
  ];
  run.fleet.forEach((v) => (v.upgrades.unique = 3));
  run.abilities = { gust: 0, pitchfork: 0, boost: 0 };
  const first = new Simulation(run);
  while (!first.summary) {
    if (first.tick === 600) first.enqueue({ ability: 'gust', dx: 1, dz: 1 });
    if (first.tick === 1200) first.enqueue({ ability: 'boost', vehicleId: 2 });
    if (first.tick === 1500) first.enqueue({ ability: 'vehicle', vehicleId: 3 });
    first.step();
  }
  const replay = first.replay(),
    second = new Simulation(replay.run);
  let index = 0;
  while (!second.summary) {
    while (index < replay.commands.length && replay.commands[index].tick === second.tick)
      second.enqueue(replay.commands[index++].command);
    second.step();
  }
  assert.deepEqual(second.summary, first.summary);
  assert.deepEqual(second.balloons, first.balloons);
  assert.deepEqual(second.vehicles, first.vehicles);
  first.dispose();
  second.dispose();
});
test('freeplay HP scaling starts after the selected mode victory round', () => {
  const run = newRun('hard');
  run.round = 61;
  const campaign = new Simulation(run);
  campaign.step();
  run.freeplay = true;
  const sim = new Simulation(run);
  sim.step();
  assert.equal(sim.balloons[0].kind, campaign.balloons[0].kind);
  assert.ok(Math.abs(sim.balloons[0].maxHp / campaign.balloons[0].maxHp - 1.02) < 1e-9);
  campaign.dispose();
  sim.dispose();
});

test('opening waves arrive in short packs and starter rounds clear briskly in both arenas', () => {
  const wave = waveFor(1, 73429);
  assert.ok(wave[2].tick <= 20, 'the opening pack should arrive immediately');
  assert.equal(wave.length, 30, 'the opening wave should have a full arcade-sized crowd');
  assert.ok(wave.at(-1)!.tick < 9 * 60, 'opening spawns should finish within 9 seconds');
  for (const arena of ['barn', 'yard'] as const) {
    const run = newRun('easy', arena);
    run.fleet = [vehicle('harvester')];
    const sim = new Simulation(run);
    while (!sim.summary) sim.step();
    assert.equal(sim.summary.cleared, true);
    // Allow the fixed header to brake and turn toward its targets while retaining a brisk opening.
    assert.ok(sim.summary.seconds < 30, `${arena} opening round took ${sim.summary.seconds}s`);
    sim.dispose();
  }
});
test('later rounds bring larger crowds from both gates across the wider arena', () => {
  const wave = waveFor(20, 73429);
  assert.ok(wave.length >= 230);
  assert.ok(wave.at(-1)!.tick < 9 * 60);
  assert.deepEqual(new Set(wave.map((spawn) => spawn.gate)), new Set([0, 1]));
  const lanes = wave.map((spawn) => spawn.lane!);
  assert.ok(Math.max(...lanes) - Math.min(...lanes) > 0.5);
});
test('uncovered balloons can end a wave with lives deducted and a deterministic replay', () => {
  const run = newRun();
  run.fleet = [vehicle('harvester')];
  const sim = new Simulation(run);
  sim.wave = [{ tick: 0, kind: 'armored', layer: 1, fleeing: false, regen: false, armor: true }];
  sim.enqueue({ ability: 'finish' });
  sim.step();
  assert.equal(sim.summary, null, 'cannot end before the grace period');
  for (let i = 0; i < 185; i++) sim.step();
  assert.equal(sim.canFinishEarly, true);
  sim.enqueue({ ability: 'finish' });
  sim.step();
  assert.equal(sim.summary!.reason, 'uncovered');
  assert.equal(sim.summary!.livesLost, 3);
  assert.equal(sim.summary!.earned, 162);
  assert.equal(sim.summary!.bonus, 0);
  const second = new Simulation(run);
  second.wave = structuredClone(sim.wave);
  for (const entry of sim.replay().commands) {
    while (second.tick < entry.tick) second.step();
    second.enqueue(entry.command);
    second.step();
  }
  assert.deepEqual(second.summary, sim.summary);
  second.dispose();
  sim.dispose();
});
test('end-wave shortcut cannot skip balloons that the deployed fleet can hit', () => {
  const run = newRun();
  run.fleet = [vehicle('sprayer')];
  const sim = new Simulation(run);
  sim.wave = [{ tick: 0, kind: 'armored', layer: 1, fleeing: false, regen: false, armor: true }];
  for (let i = 0; i < 185; i++) sim.step();
  assert.equal(sim.canFinishEarly, false);
  sim.enqueue({ ability: 'finish' });
  sim.step();
  assert.equal(sim.summary, null);
  sim.dispose();
});

test('dense freeplay packs remain chronological when their spawn intervals overlap', () => {
  const wave = waveFor(200, 73429);
  assert.ok(wave.every((spawn, i) => !i || spawn.tick >= wave[i - 1].tick));
  assert.ok(wave.at(-1)!.tick < 33 * 60);
});
test('a base crane can clear the high-flyer height band in either arena', () => {
  for (const arena of ['barn', 'yard'] as const) {
    const run = newRun('easy', arena);
    run.round = 8;
    run.fleet = [vehicle('crane')];
    const sim = new Simulation(run);
    sim.wave = sim.wave.filter((s) => s.kind === 'high');
    while (!sim.summary) sim.step();
    assert.equal(sim.summary.cleared, true, `${arena} crane left unreachable high-flyers`);
    sim.dispose();
  }
});
