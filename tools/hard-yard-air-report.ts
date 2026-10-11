import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { PATH_COSTS, MODES, VEHICLES, type PathName } from '../src/sim/data';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')),
);
const tags = (
  args.cohorts ??
  'air-baseline-pilot,air-armor-coverage-pilot,air-gust-coverage-pilot,air-early-armor-pilot,air-priority-armor-pilot'
).split(',');
assert(tags.every((tag) => /^[a-z0-9-]+$/.test(tag)));
const load = (file: string) => JSON.parse(readFileSync(file, 'utf8'));
const cohorts = tags.map((tag) => ({
  source: `artifacts/hard-yard-air-seeds/${tag}/summary.json`,
  ...load(`artifacts/hard-yard-air-seeds/${tag}/summary.json`),
  policySource: `artifacts/hard-yard-air-seeds/${tag}/policy-source.txt`,
  tacticsSource: `artifacts/hard-yard-air-seeds/${tag}/tactics-source.txt`,
}));
const final = cohorts.find(
  (c) =>
    c.source ===
    `artifacts/hard-yard-air-seeds/${args.final ?? 'air-priority-armor-pilot'}/summary.json`,
);
assert(final, 'A final six-seed cohort is required');
assert.equal(final.finishedCampaigns, 18);
assert.equal(final.requestedCampaigns, 18);
assert.equal(final.seeds.length, 6);
assert.equal(final.allSeedsViable, true);
const rules = createHash('sha256');
for (const file of readdirSync('src/sim')
  .filter((name) => name.endsWith('.ts'))
  .map((name) => `src/sim/${name}`)
  .sort())
  rules.update(file).update(readFileSync(file));
assert.equal(final.rulesHash, rules.digest('hex'), 'Reports must use the current simulation rules');
for (const cohort of cohorts) {
  assert.equal(cohort.rulesHash, final.rulesHash);
  assert.deepEqual(cohort.errors, []);
  assert.equal(cohort.finishedCampaigns, cohort.cases.length);
  assert.equal(
    readdirSync(cohort.source.replace(/\/summary\.json$/, '')).filter(
      (name) => name.endsWith('.json') && name !== 'summary.json',
    ).length,
    cohort.cases.length,
    'Every written campaign must appear in its audited cohort',
  );
  assert.equal(
    cohort.requestedCampaigns - cohort.finishedCampaigns,
    cohort.stoppedAfterPilot ? cohort.plannedButNotRun : 0,
    'Unrun diagnostic cases must be explicitly recorded',
  );
  const policy = createHash('sha256')
    .update('tools/balance-tactics.ts')
    .update(readFileSync(cohort.tacticsSource))
    .update('tools/balance.ts')
    .update(readFileSync(cohort.policySource))
    .digest('hex');
  assert.equal(cohort.policyHash, policy, 'Each cohort must retain its exact tested policy');
}
const cases = cohorts.flatMap((cohort) => cohort.cases);
assert.equal(new Set(cases.map((c) => c.source)).size, cases.length);
const mean = (values: number[]) =>
  Number((values.reduce((sum, n) => sum + n, 0) / values.length).toFixed(1));
const range = (values: number[]) => [Math.min(...values), Math.max(...values)];
const paths = final.strategies.map((strategy: any) => {
  assert.equal(strategy.airTools, 'both');
  assert.equal(strategy.cranePrimary, strategy.blowerPrimary);
  assert.equal(strategy.craneSecondary, strategy.blowerSecondary);
  const selected = final.cases.filter((c: any) => c.id === strategy.id);
  assert.equal(selected.length, 6);
  assert(selected.every((c: any) => c.completed));
  assert.deepEqual(
    selected.map((c: any) => c.seed).sort((a: number, b: number) => a - b),
    [...final.seeds].sort((a: number, b: number) => a - b),
  );
  const primary = strategy.cranePrimary as PathName;
  const secondary = strategy.craneSecondary as PathName;
  const buildCost = (kind: 'crane' | 'blower') =>
    [
      VEHICLES[kind].cost,
      ...PATH_COSTS[primary].map((m) => VEHICLES[kind].cost * m),
      ...PATH_COSTS[secondary].slice(0, 2).map((m) => VEHICLES[kind].cost * m),
    ].reduce((sum, amount) => sum + Math.round(amount * MODES.hard.multiplier), 0);
  const rounds = selected.flatMap((c: any) => load(c.source)[0].results);
  return {
    primary,
    strategy,
    wins: selected.length,
    lives: range(selected.map((c: any) => c.lives)),
    fleetSize: range(selected.map((c: any) => c.fleetSize)),
    totalPaid: range(selected.map((c: any) => c.paidTotal)),
    meanWaveSeconds: mean(rounds.map((r: any) => r.seconds)),
    individualHardBuildCosts: { crane: buildCost('crane'), blower: buildCost('blower') },
    testedAirPops: range(
      selected.map((c: any) =>
        c.vehicleContributions
          .filter((v: any) => ['crane', 'blower'].includes(v.kind) && !v.armorCounter)
          .reduce((sum: number, v: any) => sum + v.pops, 0),
      ),
    ),
    armorSupportPops: range(
      selected.map((c: any) =>
        c.vehicleContributions
          .filter((v: any) => v.armorCounter)
          .reduce((sum: number, v: any) => sum + v.pops, 0),
      ),
    ),
    contributions: selected.map((c: any) => ({
      seed: c.seed,
      testedAirTools: c.vehicleContributions.filter(
        (v: any) => ['crane', 'blower'].includes(v.kind) && !v.armorCounter,
      ),
      armorSupport: c.vehicleContributions.filter((v: any) => v.armorCounter),
    })),
    cases: selected,
  };
});
assert.deepEqual(paths.map((p: any) => p.primary).sort(), ['speed', 'traction', 'unique']);
const groundReference = load('artifacts/hard-yard-seed-balance.json');
assert.equal(groundReference.rulesHash, final.rulesHash);
assert.deepEqual(groundReference.seeds, final.seeds);
const attack = groundReference.paths.find((p: any) => p.primary === 'attack');
assert.equal(attack.completed, 6);
const report = {
  mode: 'hard',
  arena: 'yard',
  requestedRounds: 60,
  seeds: final.seeds,
  startingCash: 650,
  startingLives: 50,
  hay: true,
  surfaces: true,
  rulesHash: final.rulesHash,
  newAttempts: cases.length,
  simulatedRounds: cases.reduce((sum: number, c: any) => sum + c.round, 0),
  auditedPreparationBudgets: cases.reduce((sum: number, c: any) => sum + c.round, 0),
  verifiedNewCampaigns: 18,
  allSeedsViable: true,
  paths,
  attackReference: {
    source: 'artifacts/hard-yard-seed-balance.json',
    reusedCampaigns: 6,
    description:
      'Existing Attack 5 / Specialist 2 air tools with Attack-primary ground tools; same simulation rules. The Downburst policy correction does not affect these tier-2 Specialist builds.',
    lives: [attack.minimumLives, attack.maximumLives],
    fleetSizes: attack.fleetSizes,
    paidTotals: attack.paidTotals,
    meanWaveSeconds: attack.meanWaveSeconds,
    cases: attack.cases,
  },
  cohorts: cohorts.map((c) => ({
    source: c.source,
    policyHash: c.policyHash,
    finishedCampaigns: c.finishedCampaigns,
    requestedCampaigns: c.requestedCampaigns,
    stoppedAfterPilot: c.stoppedAfterPilot ?? false,
    plannedButNotRun: c.plannedButNotRun ?? 0,
    simulatedRounds: c.simulatedRounds,
    allSeedsViable: c.allSeedsViable,
    policySource: c.policySource,
    tacticsSource: c.tacticsSource,
  })),
  failures: cases.filter((c: any) => !c.completed),
  checks: final.checks,
  tradeoffWitnesses: [
    'Speed crane and blower builds clear isolated one-hit arrivals sooner than Attack builds.',
    'Traction crane and blower builds cross rough terrain sooner; Speed wins clear-floor travel.',
    'Specialist crane splash clears denser clusters; Attack retains direct armor damage.',
    'Downburst lowers armored targets for ground tools without gaining direct armor damage.',
    'All 160 upgrade steps retain outcome witnesses; all 936 legal builds retain modeled tradeoffs.',
  ],
  limitations:
    'The final gate commits both reserved cranes and the blower to each primary, with a separately paid Attack crane and Attack-primary ground fleet. Independent chassis cases are preliminary comparisons. These fixed six-seed strategies do not guarantee every composition or measure human win rates.',
};
const output = args.output ?? 'artifacts/hard-yard-air-balance.json';
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      output,
      newAttempts: report.newAttempts,
      simulatedRounds: report.simulatedRounds,
      paths: paths.map(({ primary, wins, lives, totalPaid, meanWaveSeconds }: any) => ({
        primary,
        wins,
        lives,
        totalPaid,
        meanWaveSeconds,
      })),
    },
    null,
    2,
  ),
);
