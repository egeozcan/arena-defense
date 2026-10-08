import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arenaFor, balloonHeightRange, newRun, waveFor } from '../src/sim/data';
import { armorDamageFactor, canTargetBalloon, vehicleStats } from '../src/sim/capabilities';
import { coverageFor, forecast, futureChanges, stockVehicle } from '../src/ui/wave-forecast';
import { initPhysics, Simulation } from '../src/sim/engine';

const harvester = stockVehicle('harvester');
const sprayer = stockVehicle('sprayer');
const excavator = stockVehicle('excavator');
const crane = stockVehicle('crane');

test('forecasts match seeded wave counts and distinguish added armor', () => {
  for (const mode of ['easy', 'medium', 'hard'] as const) {
    const run = { ...newRun(mode), round: 35 };
    const wave = waveFor(run.round, run.seed, mode);
    const report = forecast(run);
    assert.equal(report.total, wave.length);
    assert.equal(
      report.threats.filter((t) => !t.child).reduce((n, t) => n + t.count, 0),
      wave.length,
    );
    assert.equal(report.fleeing, wave.filter((s) => s.fleeing).length);
    assert.equal(report.regen, wave.filter((s) => s.regen).length);
    assert.equal(report.addedArmor, wave.filter((s) => s.armor).length);
    assert.equal(
      report.threats
        .filter((t) => t.armored && t.kind !== 'armored')
        .reduce((n, t) => n + t.count, 0),
      report.addedArmor,
    );
  }
});

test('owned but undeployed vehicles never count as fleet coverage', () => {
  const run = newRun();
  run.fleet = [{ ...sprayer, placed: false }];
  assert.equal(forecast(run).threats[0].coverage, 'uncovered');
  run.fleet[0].placed = true;
  assert.equal(forecast(run).threats[0].coverage, 'covered');
});

test('round four warns about partial height coverage before armor arrives', () => {
  const run = { ...newRun(), fleet: [harvester], round: 3 };
  assert.equal(forecast(run).gaps.length, 0);
  assert.ok(futureChanges(run).some((s) => s.includes('rise to 0.6–2.8 m')));
  const next = forecast({ ...run, round: 4 });
  assert.ok(next.threats.some((t) => t.kind === 'basic' && t.coverage === 'partial'));
  assert.equal(forecast({ ...run, round: 4, fleet: [sprayer] }).gaps.length, 0);
});

test('coverage combines intervals without ignoring gaps or armor immunity', () => {
  assert.equal(coverageFor([harvester, crane], 0.6, 3.5, false), 'partial');
  assert.equal(coverageFor([sprayer, crane], 0.6, 11.8, false), 'covered');
  assert.equal(coverageFor([crane], 0.7, 0.7, false), 'uncovered');
  assert.equal(coverageFor([crane], 6, 11.8, true), 'uncovered');
  assert.equal(
    coverageFor([{ ...crane, upgrades: { ...crane.upgrades, attack: 3 } }], 6, 11.8, true),
    'covered',
  );
  assert.equal(coverageFor([harvester, crane], 0.7, 0.7, true), 'uncovered');
  assert.equal(coverageFor([excavator], 0.7, 0.7, true), 'covered');
});

test('carrier forecasts include their low cargo and per-arena high flight ceiling', () => {
  const run = { ...newRun(), round: 11, fleet: [crane] };
  const report = forecast(run);
  const carriers = report.threats.find((t) => t.kind === 'carrier')!;
  const cargo = report.threats.find((t) => t.child)!;
  assert.equal(cargo.count, carriers.count * 3);
  assert.equal(cargo.coverage, 'uncovered');
  assert.equal(cargo.min, 0.8);
  assert.equal(report.threats.find((t) => t.kind === 'high')!.max, 8.4);
  assert.equal(
    forecast({ ...run, arena: 'yard' }).threats.find((t) => t.kind === 'high')!.max,
    11.8,
  );
});

test('armor percentages and upgraded height limits match targeting rules', () => {
  assert.equal(armorDamageFactor(harvester), 0);
  assert.equal(armorDamageFactor(sprayer), 0.5);
  assert.equal(armorDamageFactor(excavator), 1);
  assert.equal(
    armorDamageFactor({ ...sprayer, upgrades: { ...sprayer.upgrades, attack: 3 } }),
    0.75,
  );
  assert.equal(armorDamageFactor({ ...sprayer, upgrades: { ...sprayer.upgrades, unique: 4 } }), 1);
  assert.equal(canTargetBalloon(crane, 0.8, false), false);
  const tallHarvester = { ...harvester, upgrades: { ...harvester.upgrades, unique: 4 } };
  assert.equal(vehicleStats(tallHarvester).max, 3);
  assert.equal(coverageFor([tallHarvester], 0.6, 2.8, false), 'covered');
});

test('preparation warns one wave before specialist introductions', () => {
  assert.ok(futureChanges({ ...newRun(), round: 5 }).some((s) => s.startsWith('Armored arrive')));
  assert.ok(
    futureChanges({ ...newRun(), round: 7 }).some((s) => s.startsWith('High-flyer arrive')),
  );
  assert.ok(
    futureChanges({ ...newRun(), round: 9 }).some((s) => s.startsWith('Hay carrier arrive')),
  );
});

test('upcoming armor warning clears when a counter is deployed and returns when removed', () => {
  const run = { ...newRun(), round: 5, fleet: [harvester] };
  const armorWarning = () => futureChanges(run).some((s) => s.startsWith('Armored arrive'));
  assert.equal(armorWarning(), true);
  run.fleet.push({ ...excavator, id: 2 });
  assert.equal(armorWarning(), false, 'deployed excavator resolves the upcoming armor warning');
  run.fleet.pop();
  assert.equal(armorWarning(), true);
});

test('buying a future counter changes the warning to deployment, then placement clears it', () => {
  const run = {
    ...newRun(),
    round: 5,
    fleet: [harvester, { ...excavator, id: 2, placed: false }],
  };
  assert.ok(futureChanges(run).some((s) => s.includes('deploy Excavator #2')));
  assert.equal(
    forecast({ ...run, round: 6 }).gaps.some((t) => t.armored),
    true,
  );
  run.fleet[1].placed = true;
  assert.equal(futureChanges(run).length, 0);
});

test('height and armor upgrades immediately resolve current and upcoming warnings', () => {
  const run = { ...newRun(), round: 3, fleet: [stockVehicle('harvester')] };
  assert.ok(futureChanges(run).length > 0);
  run.fleet[0].upgrades.unique = 4;
  assert.equal(futureChanges(run).length, 0);
  run.round = 6;
  assert.ok(forecast(run).gaps.some((t) => t.armored));
  run.fleet[0].upgrades.attack = 3;
  assert.equal(forecast(run).gaps.length, 0);
});

test('upcoming carrier warning includes its separate low cargo gap', () => {
  const run = { ...newRun(), round: 9, fleet: [stockVehicle('crane')] };
  assert.ok(futureChanges(run).some((s) => s.startsWith('Carrier cargo arrive')));
  run.fleet.push(stockVehicle('excavator'));
  assert.equal(futureChanges(run).length, 0);
});

test('simulation spawns stay inside the height bands shown in the briefing', async () => {
  await initPhysics();
  for (const arena of ['barn', 'yard'] as const) {
    const run = { ...newRun('hard', arena), round: 20 };
    const sim = new Simulation(run);
    // Stay below the 300 live-balloon cap so the sample can finish spawning.
    sim.wave = sim.wave.slice(0, 200);
    while (sim.pending) sim.step();
    for (const b of sim.balloons) {
      const [min, max] = balloonHeightRange(b.kind, run.round, arenaFor(arena));
      assert.ok(
        b.baseFloat >= min && b.baseFloat <= max,
        `${b.kind} ${b.baseFloat} outside ${min}–${max}`,
      );
    }
    sim.dispose();
  }
});
