import {
  MODES,
  VEHICLES,
  TIER_COSTS,
  newRun,
  price,
  canPlace,
  arenaFor,
  upgradeAllowed,
  type ArenaKind,
  type Mode,
  type OwnedVehicle,
  type VehicleKind,
  type PathName,
} from '../src/sim/data';
import { purchaseAbility } from '../src/sim/economy';
import { initPhysics, Simulation } from '../src/sim/engine';
import { writeFileSync, mkdirSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')),
);
const modes = args.mode ? [args.mode as Mode] : (Object.keys(MODES) as Mode[]);
const arenas = args.arena ? [args.arena as ArenaKind] : (['barn', 'yard'] as ArenaKind[]);
const plan = args.plan ?? 'balanced';
const seed = Number(args.seed ?? 73429);
if (
  modes.some((mode) => !MODES[mode]) ||
  arenas.some((arena) => !['barn', 'yard'].includes(arena)) ||
  !['balanced', 'basic'].includes(plan) ||
  !Number.isSafeInteger(seed) ||
  (args.rounds && (!Number.isInteger(Number(args.rounds)) || Number(args.rounds) < 1))
) {
  throw new Error(
    'Use --mode=easy|medium|hard --arena=barn|yard --plan=balanced|basic --seed=integer --rounds=positive-integer',
  );
}
await initPhysics();
const reports = [];
for (const mode of modes)
  for (const arena of arenas) {
    let run = newRun(mode, arena);
    run.seed = seed;
    const results = [];
    const rounds = Math.min(MODES[mode].rounds, Number(args.rounds ?? MODES[mode].rounds));
    function buy(kind: VehicleKind) {
      const cost = price(run, VEHICLES[kind].cost);
      if (run.cash < cost) return false;
      const v: OwnedVehicle = {
        id: run.nextId,
        kind,
        upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
        spent: cost,
        placed: true,
        x: 0,
        z: 0,
        rotation: 0,
        targeting: kind === 'crane' ? 'Highest' : 'Nearest',
      };
      const a = arenaFor(arena);
      const preferred = [
        [a.width / 2 - 1, a.depth / 2 - 1],
        [7, 7],
        [a.width - 8, 7],
        [10, 3],
        [a.width / 2, a.depth - 6],
        [a.width - 9, a.depth - 8],
        [a.width / 2 + 4, a.depth / 2 + 3],
      ];
      const candidates = [...preferred];
      for (let z = 2; z < a.depth - 3; z++)
        for (let x = 2; x < a.width - 3; x++) candidates.push([x, z]);
      const position = candidates.find(([x, z]) => canPlace(a, run.fleet, v, x, z));
      if (!position) return false;
      [v.x, v.z] = position;
      run.nextId++;
      run.cash -= cost;
      run.fleet.push(v);
      return true;
    }
    function upgrade(v: OwnedVehicle, path: PathName) {
      if (!upgradeAllowed(v, path)) return false;
      const cost = price(run, VEHICLES[v.kind].cost * TIER_COSTS[v.upgrades[path]]);
      if (cost > run.cash) return false;
      run.cash -= cost;
      v.spent += cost;
      v.upgrades[path]++;
      return true;
    }
    for (let round = 1; round <= rounds; round++) {
      run.round = round;
      for (const [kind, intro] of [
        ['harvester', 1],
        ['sprayer', 2],
        ['excavator', 5],
        ['crane', 7],
      ] as const)
        if (round >= intro && !run.fleet.some((v) => v.kind === kind)) buy(kind);
      if (plan === 'balanced') {
        const extras = ['excavator', 'sprayer', 'crane', 'harvester'] as const;
        const targetFleet =
          round >= 32 ? 8 : round >= 24 ? 7 : round >= 16 ? 6 : round >= 12 ? 5 : 4;
        while (run.fleet.length >= 4 && run.fleet.length < targetFleet)
          if (!buy(extras[run.fleet.length - 4])) break;
      }
      // Spread affordable tiers before saving for a costly signature transformation.
      for (const tier of [1, 2, 3, 4, 5])
        for (const v of run.fleet) {
          const primary = v.kind === 'crane' ? 'attack' : 'unique';
          const secondary = v.kind === 'crane' ? 'unique' : 'attack';
          const goal =
            plan === 'basic' ? 2 : round >= 25 ? 5 : round >= 16 ? 4 : round >= 8 ? 3 : 2;
          if (round >= 8 && tier <= goal && v.upgrades[primary] < tier) upgrade(v, primary);
          if (round >= 8 && tier <= 2 && v.upgrades[secondary] < tier) upgrade(v, secondary);
        }
      if (plan === 'balanced' && round >= 10 && run.fleet.length >= 4) {
        for (const ability of ['boost', 'gust', 'pitchfork'] as const)
          if (run.abilities[ability] === undefined || (round >= 20 && run.abilities[ability]! < 2))
            run = purchaseAbility(run, ability);
      }
      const sim = new Simulation(run);
      let peak = 0;
      while (!sim.summary) {
        if (plan === 'balanced' && sim.tick % 900 === 0) {
          for (const v of sim.vehicles)
            if (v.upgrades.unique >= 3) sim.enqueue({ ability: 'vehicle', vehicleId: v.id });
          const high = sim.balloons.filter((b) => b.kind === 'high').length;
          if (high > 3) sim.enqueue({ ability: 'gust', dx: 0, dz: 0 });
          const busiest = [...sim.vehicles].sort(
            (a, b) =>
              sim.balloons.filter((t) => Math.hypot(t.x - b.x, t.z - b.z) < 8).length -
              sim.balloons.filter((t) => Math.hypot(t.x - a.x, t.z - a.z) < 8).length,
          )[0];
          if (busiest) sim.enqueue({ ability: 'boost', vehicleId: busiest.id });
          const target = sim.balloons.find((b) => b.armor) ?? sim.balloons[0];
          if (target) sim.enqueue({ ability: 'pitchfork', x: target.x, z: target.z });
        }
        sim.step();
        peak = Math.max(peak, sim.balloons.length);
      }
      const s = sim.summary;
      run.cash += s.earned;
      run.lives = Math.max(0, run.lives - s.livesLost);
      results.push({
        round,
        pops: s.pops,
        lost: s.livesLost,
        lives: run.lives,
        cash: run.cash,
        fleet: run.fleet.length,
        seconds: +s.seconds.toFixed(1),
        peak,
      });
      sim.dispose();
      if (!run.lives) break;
    }
    const report = {
      mode,
      arena,
      plan,
      seed,
      survived: run.lives > 0 && run.round === rounds,
      round: run.round,
      lives: run.lives,
      cash: run.cash,
      fleet: run.fleet.map((v) => ({ kind: v.kind, upgrades: v.upgrades })),
      totalLost: results.reduce((sum, r) => sum + r.lost, 0),
      averageSeconds: +(results.reduce((sum, r) => sum + r.seconds, 0) / results.length).toFixed(1),
      slowest: Math.max(...results.map((r) => r.seconds)),
      peak: Math.max(...results.map((r) => r.peak)),
      results,
    };
    reports.push(report);
    console.log(
      JSON.stringify(
        args.verbose ? report : { ...report, fleet: run.fleet.length, results: undefined },
      ),
    );
    if (plan === 'balanced' && !report.survived) process.exitCode = 1;
  }
mkdirSync('artifacts', { recursive: true });
writeFileSync(
  `artifacts/balance-${plan}-${seed}-${modes.join('-')}-${arenas.join('-')}.json`,
  JSON.stringify(reports, null, 2),
);
