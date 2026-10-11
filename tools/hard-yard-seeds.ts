import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ABILITIES, MODES, PATHS, PATH_COSTS, VEHICLES, type PathName } from '../src/sim/data';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')),
);
let seeds = (args.seeds ?? '73429,73531,101,2027,900001,20261010').split(',').map(Number);
const jobs = Number(args.jobs ?? 8);
const scope = args.scope ?? 'ground';
assert(['ground', 'air'].includes(scope));
const tag = args.tag ?? 'reliable';
let profile = args.profile ?? 'reliable';
assert(['initial', 'coverage', 'reliable'].includes(profile));
const runner = args.runner ?? 'tools/balance.ts';
const selectedPaths = (
  args.paths ?? (scope === 'air' ? 'speed,traction,unique' : PATHS.join(','))
).split(',');
const airTools = (args['air-tools'] ?? 'both').split(',');
assert(airTools.length && airTools.every((tool) => ['crane', 'blower', 'both'].includes(tool)));
assert(new Set(airTools).size === airTools.length);
const reliableAirSupport = scope === 'air' && profile !== 'initial';
const armorAirCounters = Number(args['armor-air-counters'] ?? (reliableAirSupport ? 1 : 0));
const armorAirRound =
  args['armor-air-round'] !== undefined
    ? Number(args['armor-air-round'])
    : reliableAirSupport && armorAirCounters > 0
      ? 16
      : undefined;
assert(armorAirRound === undefined || (Number.isInteger(armorAirRound) && armorAirRound >= 1));
assert(Number.isInteger(armorAirCounters) && armorAirCounters >= 0 && armorAirCounters <= 4);
assert(selectedPaths.length && selectedPaths.every((p) => PATHS.some((valid) => valid === p)));
assert(new Set(selectedPaths).size === selectedPaths.length);
assert(/^tools\/[a-zA-Z0-9_.-]+\.ts$/.test(runner) && existsSync(join(root, runner)));
assert(
  seeds.length >= 2 && new Set(seeds).size === seeds.length && seeds.every(Number.isSafeInteger),
);
assert(Number.isInteger(jobs) && jobs >= 1 && jobs <= 24);
assert(/^[a-z0-9-]+$/.test(tag));
assert(args.resume === undefined || ['on', 'off'].includes(args.resume));
assert(args['audit-only'] === undefined || ['on', 'off'].includes(args['audit-only']));
assert(args['reserve-gust'] === undefined || ['on', 'off'].includes(args['reserve-gust']));
const auditOnly = args['audit-only'] === 'on';
const awaiting = new Map<string, number>(
  (args['await-pids'] ?? '')
    .split(',')
    .filter(Boolean)
    .map((entry) => {
      const [key, pid] = entry.split(':');
      assert(/^(?:(?:crane|blower|both)-)?(unique|attack|speed|traction)-[0-9]+$/.test(key));
      assert(Number.isSafeInteger(Number(pid)) && Number(pid) > 0);
      return [key, Number(pid)];
    }),
);

// Keep each strategy fixed across seeds, including paid armor support.
type Strategy = {
  id?: string;
  airTools?: string;
  cranePrimary?: PathName;
  craneSecondary?: PathName;
  blowerPrimary?: PathName;
  blowerSecondary?: PathName;
  armorAirCounters?: number;
  armorAirRound?: number;
  reserveGust?: boolean;
  primary: PathName;
  plan: 'balanced' | 'expanded';
  secondary: PathName;
  reinforce: boolean;
  reinforcementRound?: number;
  reinforcementCount?: number;
};
const groundStrategies: Strategy[] = (
  [
    { primary: 'unique', plan: 'balanced', secondary: 'attack', reinforce: false },
    { primary: 'attack', plan: 'expanded', secondary: 'unique', reinforce: false },
    { primary: 'speed', plan: 'expanded', secondary: 'unique', reinforce: false },
    { primary: 'traction', plan: 'expanded', secondary: 'unique', reinforce: true },
  ] as Strategy[]
)
  .filter((s) => selectedPaths.includes(s.primary))
  .map((s) => ({
    ...s,
    ...(profile !== 'initial' && s.primary !== 'attack'
      ? {
          reinforce: true,
          reinforcementRound: 28,
          reinforcementCount: s.primary === 'traction' ? (profile === 'reliable' ? 5 : 4) : 2,
        }
      : {}),
    ...(args['reinforce-round'] ? { reinforcementRound: Number(args['reinforce-round']) } : {}),
    ...(args['reinforce-count'] ? { reinforcementCount: Number(args['reinforce-count']) } : {}),
  }));
let strategies: Strategy[] =
  scope === 'ground'
    ? groundStrategies
    : airTools.flatMap((tool) =>
        selectedPaths.map((path) => {
          const primary = path as PathName;
          const secondary: PathName = primary === 'unique' ? 'attack' : 'unique';
          return {
            id: `${tool}-${primary}`,
            airTools: tool,
            primary: 'attack' as const,
            secondary: 'unique' as const,
            plan: 'expanded' as const,
            reinforce: args['reinforce-count'] !== undefined,
            ...(args['reinforce-count']
              ? {
                  reinforcementRound: Number(args['reinforce-round'] ?? 28),
                  reinforcementCount: Number(args['reinforce-count']),
                }
              : {}),
            cranePrimary: tool === 'blower' ? ('attack' as const) : primary,
            craneSecondary: tool === 'blower' ? ('unique' as const) : secondary,
            blowerPrimary: tool === 'crane' ? ('attack' as const) : primary,
            blowerSecondary: tool === 'crane' ? ('unique' as const) : secondary,
            armorAirCounters,
            ...(armorAirRound !== undefined ? { armorAirRound } : {}),
            reserveGust: args['reserve-gust'] === 'on',
          };
        }),
      );
const strategyId = (strategy: Strategy) => strategy.id ?? strategy.primary;
const fingerprint = (files: string[]) => {
  const hash = createHash('sha256');
  for (const file of files.sort()) hash.update(file).update(readFileSync(join(root, file)));
  return hash.digest('hex');
};
const rulesHash = fingerprint(
  readdirSync(join(root, 'src/sim'))
    .filter((f) => f.endsWith('.ts'))
    .map((f) => `src/sim/${f}`),
);
// Alternate entry points with identical policy source have the same fingerprint.
const policyHash = createHash('sha256')
  .update('tools/balance-tactics.ts')
  .update(readFileSync(join(root, 'tools/balance-tactics.ts')))
  .update('tools/balance.ts')
  .update(readFileSync(join(root, runner)))
  .digest('hex');
const folder = join(
  root,
  scope === 'air' ? 'artifacts/hard-yard-air-seeds' : 'artifacts/hard-yard-seeds',
  tag,
);
const summaryFile = join(folder, 'summary.json');
mkdirSync(folder, { recursive: true });
const previous = existsSync(summaryFile)
  ? JSON.parse(readFileSync(summaryFile, 'utf8'))
  : undefined;
const canResume =
  args.resume === 'on' &&
  previous?.rulesHash === rulesHash &&
  previous?.policyHash === policyHash &&
  JSON.stringify(previous.strategies) === JSON.stringify(strategies);
if (auditOnly && previous) {
  assert.equal(previous.rulesHash, rulesHash, 'Existing reports use different game rules');
  assert.equal(previous.policyHash, policyHash, 'Existing reports use a different policy');
  assert.equal(previous.scope ?? 'ground', scope, 'Existing reports use a different scope');
  // Revalidate the recorded matrix rather than silently replacing it with new defaults.
  seeds = previous.seeds;
  strategies = previous.strategies;
  profile = previous.profile ?? profile;
}
const results: any[] = [];
const errors: any[] = [];
const tasks = seeds.flatMap((seed) => strategies.map((strategy) => ({ strategy, seed })));
const cost = (amount: number) => Math.round(amount * MODES.hard.multiplier);

function audit(report: any, strategy: (typeof strategies)[number], seed: number, source: string) {
  assert.equal(report.mode, 'hard');
  assert.equal(report.arena, 'yard');
  assert.equal(report.seed, seed);
  assert.equal(report.primaryPath, strategy.primary);
  assert.equal(report.plan, strategy.plan);
  assert.equal(report.reinforce, strategy.reinforce);
  assert.equal(report.primaryScope, 'all');
  assert.equal(report.mobilitySecondary, strategy.secondary === 'unique' ? 'unique' : 'attack');
  assert.equal(report.hay, true);
  assert.equal(report.surfaces, true);
  assert.equal(report.reserveAir, true);
  assert.equal(report.airCounters, 2);
  assert.equal(report.airTarget, 'nearest');
  assert.equal(report.tactics, 'responsive');
  assert.equal(report.cranePrimary ?? 'attack', strategy.cranePrimary ?? 'attack');
  assert.equal(report.craneSecondary ?? 'unique', strategy.craneSecondary ?? 'unique');
  assert.equal(report.blowerPrimary ?? 'attack', strategy.blowerPrimary ?? 'attack');
  assert.equal(report.blowerSecondary ?? 'unique', strategy.blowerSecondary ?? 'unique');
  assert.equal(report.armorAirCounters ?? 0, strategy.armorAirCounters ?? 0);
  if (strategy.armorAirRound !== undefined)
    assert.equal(report.armorAirRound, strategy.armorAirRound);
  assert.equal(report.reserveGust ?? false, strategy.reserveGust ?? false);
  if (strategy.reinforcementRound !== undefined)
    assert.equal(report.reinforcementRound, strategy.reinforcementRound);
  if (strategy.reinforcementCount !== undefined)
    assert.equal(report.reinforcementCount, strategy.reinforcementCount);
  assert.equal(report.requestedRounds, 60);
  assert(Number.isInteger(report.round) && report.round >= 1 && report.round <= 60);
  if (report.round < 60)
    assert.equal(report.lives, 0, 'A full attempt can only end early on defeat');
  assert.equal(report.results.length, report.round);
  assert.equal(report.campaignCompleted, report.round === 60 && report.lives > 0);
  assert.equal(report.survived, report.campaignCompleted);
  let cash = 650,
    lives = 50,
    spend = 0;
  for (const [index, round] of report.results.entries()) {
    assert.equal(round.round, index + 1);
    assert(Number.isInteger(round.lost) && round.lost >= 0);
    assert(Number.isInteger(round.lives) && round.lives >= 0 && round.lives <= 50);
    assert(round.seconds > 0 && round.seconds <= 180 && round.peak <= 300);
    assert.equal(round.lives, Math.max(0, lives - round.lost));
    lives = round.lives;
    const prep = round.preparation;
    assert(prep.cash >= 0);
    assert.equal(new Set(prep.fleet.map((v: any) => v.id)).size, prep.fleet.length);
    assert.deepEqual(
      round.vehicleResults.map((v: any) => v.id),
      prep.fleet.map((v: any) => v.id),
    );
    assert(round.pops >= round.vehicleResults.reduce((sum: number, v: any) => sum + v.pops, 0));
    let paid = 0;
    for (const vehicle of prep.fleet) {
      const levels = PATHS.map((p) => vehicle.upgrades[p]);
      assert(levels.every((n) => Number.isInteger(n) && n >= 0 && n <= 5));
      assert(levels.filter((n) => n > 0).length <= 2);
      assert(levels.filter((n) => n > 2).length <= 1);
      const stock = VEHICLES[vehicle.kind as keyof typeof VEHICLES].cost;
      let expected = cost(stock);
      for (const path of PATHS)
        for (let tier = 0; tier < vehicle.upgrades[path]; tier++)
          expected += cost(stock * PATH_COSTS[path][tier]);
      assert.equal(vehicle.spent, expected);
      paid += expected;
    }
    for (const [ability, rank] of Object.entries(prep.abilities) as [
      keyof typeof ABILITIES,
      number,
    ][]) {
      assert(Number.isInteger(rank) && rank >= 0 && rank <= 2);
      const price = ABILITIES[ability].price;
      paid += cost(price) + (rank >= 1 ? cost(price * 0.5) : 0) + (rank === 2 ? cost(price) : 0);
    }
    assert.equal(prep.cash, cash - (paid - spend), `${source} round ${round.round} budget`);
    assert(round.cash >= prep.cash + 160 + 2 * round.round);
    cash = round.cash;
    spend = paid;
  }
  assert.equal(report.lives, lives);
  assert.equal(report.cash, cash);
  assert.equal(
    report.averageSeconds,
    Number(
      (
        report.results.reduce((sum: number, round: any) => sum + round.seconds, 0) /
        report.results.length
      ).toFixed(1),
    ),
  );
  assert.equal(report.slowest, Math.max(...report.results.map((round: any) => round.seconds)));
  const finalFleet = report.results.at(-1).preparation.fleet;
  assert.deepEqual(
    report.fleet,
    finalFleet.map(({ kind, upgrades }: any) => ({ kind, upgrades })),
  );
  if (report.campaignCompleted) {
    const armorIds = new Set(report.armorAirIds ?? []);
    assert.equal(armorIds.size, strategy.armorAirCounters ?? 0);
    assert.equal(armorIds.size, (report.armorAirIds ?? []).length);
    for (const id of armorIds)
      assert(
        finalFleet.some((v: any) => v.id === id && v.kind === 'crane'),
        'Every armor counter must be an actual paid crane',
      );
    assert(finalFleet.filter((v: any) => v.kind === 'crane' && !armorIds.has(v.id)).length >= 2);
    if (scope === 'air') assert(finalFleet.some((v: any) => v.kind === 'blower'));
    assert(finalFleet.some((v: any) => v.kind !== 'crane' && v.kind !== 'blower'));
    for (const vehicle of finalFleet) {
      const armor = armorIds.has(vehicle.id);
      if (armor) assert.equal(vehicle.kind, 'crane');
      const primary = armor
        ? 'attack'
        : vehicle.kind === 'crane'
          ? (strategy.cranePrimary ?? 'attack')
          : vehicle.kind === 'blower'
            ? (strategy.blowerPrimary ?? 'attack')
            : strategy.primary;
      const secondary = armor
        ? 'unique'
        : vehicle.kind === 'crane'
          ? (strategy.craneSecondary ?? 'unique')
          : vehicle.kind === 'blower'
            ? (strategy.blowerSecondary ?? 'unique')
            : strategy.secondary;
      assert.equal(vehicle.upgrades[primary], 5, `${source} ${vehicle.kind} primary tier`);
      assert.equal(vehicle.upgrades[secondary], 2, `${source} ${vehicle.kind} secondary tier`);
    }
  }
  assert.equal(
    report.totalLost,
    report.results.reduce((sum: number, r: any) => sum + r.lost, 0),
  );
  return {
    source,
    seed,
    ...strategy,
    completed: report.campaignCompleted,
    round: report.round,
    lives,
    totalLost: report.totalLost,
    fleetSize: report.fleet.length,
    vehicleContributions: finalFleet.map((v: any) => ({
      id: v.id,
      kind: v.kind,
      upgrades: v.upgrades,
      armorCounter: (report.armorAirIds ?? []).includes(v.id),
      pops: report.results.reduce(
        (sum: number, round: any) =>
          sum + (round.vehicleResults.find((entry: any) => entry.id === v.id)?.pops ?? 0),
        0,
      ),
    })),
    paidTotal: spend,
    averageSeconds: report.averageSeconds,
    slowest: report.slowest,
    losses: report.results
      .filter((r: any) => r.lost)
      .map((r: any) => ({
        round: r.round,
        lost: r.lost,
        remaining: r.remaining,
        armored: r.remainingArmored,
        pending: r.pending,
      })),
  };
}

function save() {
  const ordered = [...results].sort(
    (a, b) =>
      strategies.findIndex((s) => strategyId(s) === (a.id ?? a.primary)) -
        strategies.findIndex((s) => strategyId(s) === (b.id ?? b.primary)) ||
      seeds.indexOf(a.seed) - seeds.indexOf(b.seed),
  );
  const paths = strategies.map((strategy) => {
    const cases = ordered.filter((r) => (r.id ?? r.primary) === strategyId(strategy));
    return {
      ...strategy,
      attempted: cases.length,
      completed: cases.filter((r) => r.completed).length,
      allSeedsViable: cases.length === seeds.length && cases.every((r) => r.completed),
      minimumLives: cases.length ? Math.min(...cases.map((r) => r.lives)) : null,
      maximumLives: cases.length ? Math.max(...cases.map((r) => r.lives)) : null,
    };
  });
  const summary = {
    mode: 'hard',
    arena: 'yard',
    requestedRounds: 60,
    startingCash: 650,
    startingLives: 50,
    hay: true,
    surfaces: true,
    rulesHash,
    policyHash,
    runner,
    profile,
    scope,
    seeds,
    strategies,
    requestedCampaigns: tasks.length,
    finishedCampaigns: results.length,
    allSeedsViable:
      results.length === tasks.length && !errors.length && paths.every((p) => p.allSeedsViable),
    simulatedRounds: results.reduce((sum, r) => sum + r.round, 0),
    checks: [
      '60-round completion and life accounting',
      'Exact normal purchase/upgrade/ability prices',
      'Every preparation budget reconciles with previous income',
      'Two-path and 5+2 caps',
      'Winning fleets actually finish their selected primary and secondary paths',
      '180-second timeout and 300-body limit',
    ],
    limitations:
      scope === 'air'
        ? 'Fixed purchasing, deployment, and responsive ability policies; ground tools use Attack primary. Additional armor cranes, if present, are paid separately and do not replace the tested primary cranes. Consistency applies to this seed set and these strategies, not every fleet composition or human win rates.'
        : 'Fixed purchasing, deployment, and responsive ability policies; air tools use Attack primary. Consistency applies to this seed set and these strategies, not every fleet composition or human win rates.',
    paths,
    cases: ordered,
    errors,
  };
  writeFileSync(summaryFile, JSON.stringify(summary, null, 2) + '\n');
  return summary;
}

async function check(task: (typeof tasks)[number]) {
  const { strategy, seed } = task;
  const id = strategyId(strategy);
  const output = join(folder, `${id}-${seed}.json`);
  const source = relative(root, output);
  const recorded = previous?.cases?.some((entry: any) => entry.source === source);
  const pid = awaiting.get(`${id}-${seed}`);
  if (auditOnly) {
    if (!existsSync(output)) return;
  } else if (pid) {
    // Adopt an already-running check without launching a duplicate simulation.
    console.log(`Await ${id} seed ${seed} (process ${pid})`);
    while (true) {
      if (existsSync(output)) {
        try {
          JSON.parse(readFileSync(output, 'utf8'));
          break;
        } catch {
          /* Writer is finishing. */
        }
      }
      try {
        process.kill(pid, 0);
      } catch {
        throw new Error(`Process ${pid} ended without a complete report: ${source}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } else if (!(canResume && recorded && existsSync(output))) {
    // A crashed child must not accidentally validate a stale report from an older run.
    rmSync(output, { force: true });
    const flags = [
      '--mode=hard',
      '--arena=yard',
      `--seed=${seed}`,
      `--plan=${strategy.plan}`,
      `--primary=${strategy.primary}`,
      `--mobility-secondary=${strategy.secondary}`,
      `--reinforce=${strategy.reinforce ? 'on' : 'off'}`,
      ...(strategy.reinforcementRound !== undefined
        ? [`--reinforce-round=${strategy.reinforcementRound}`]
        : []),
      ...(strategy.reinforcementCount !== undefined
        ? [`--reinforce-count=${strategy.reinforcementCount}`]
        : []),
      '--reserve-air=on',
      '--air-counters=2',
      '--air-target=nearest',
      '--tactics=responsive',
      '--progress=on',
      ...(scope === 'air'
        ? [
            `--crane-primary=${strategy.cranePrimary}`,
            `--crane-secondary=${strategy.craneSecondary}`,
            `--blower-primary=${strategy.blowerPrimary}`,
            `--blower-secondary=${strategy.blowerSecondary}`,
            `--armor-air-counters=${strategy.armorAirCounters}`,
            ...(strategy.armorAirRound !== undefined
              ? [`--armor-air-round=${strategy.armorAirRound}`]
              : []),
            ...(strategy.reserveGust ? ['--reserve-gust=on'] : []),
          ]
        : []),
      `--output=${output}`,
    ];
    console.log(`Start ${id} seed ${seed}`);
    await new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, ['--import', 'tsx', runner, ...flags], {
        cwd: root,
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      let pending = '',
        stderr = '';
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk: string) => {
        stderr = (stderr + chunk).slice(-4000);
        pending += chunk;
        const lines = pending.split('\n');
        pending = lines.pop()!;
        for (const line of lines) {
          try {
            const progress = JSON.parse(line);
            if (progress.round && (progress.round % 10 === 0 || progress.lost))
              console.log(
                `${id} seed ${seed}: round ${progress.round}, lost ${progress.lost}, ${progress.seconds}s`,
              );
          } catch {
            /* Node/WASM diagnostic rather than a progress event. */
          }
        }
      });
      child.once('error', reject);
      child.once('exit', (code) =>
        code === 0 || code === 1
          ? resolve()
          : reject(new Error(`${id}/${seed} exit ${code}: ${stderr}`)),
      );
    });
  }
  const reports = JSON.parse(readFileSync(output, 'utf8'));
  assert.equal(reports.length, 1);
  const result = audit(reports[0], strategy, seed, source);
  results.push(result);
  save();
  console.log(
    `Finish ${id} seed ${seed}: ${result.completed ? 'COMPLETE' : `FAILED round ${result.round}`}, ${result.lives} lives`,
  );
}

let next = 0;
// Show a new matrix immediately, without dropping previously recorded cache entries.
if (!previous?.finishedCampaigns) save();
await Promise.all(
  Array.from({ length: Math.min(jobs, tasks.length) }, async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      try {
        await check(task);
      } catch (error) {
        errors.push({ strategy: strategyId(task.strategy), seed: task.seed, error: String(error) });
        save();
        console.error(String(error));
      }
    }
  }),
);
const summary = save();
console.log(
  JSON.stringify(
    {
      summary: relative(root, summaryFile),
      finishedCampaigns: summary.finishedCampaigns,
      allSeedsViable: summary.allSeedsViable,
      simulatedRounds: summary.simulatedRounds,
      paths: summary.paths,
      errors,
    },
    null,
    2,
  ),
);
if (!summary.allSeedsViable) process.exitCode = 1;
