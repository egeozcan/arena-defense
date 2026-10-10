import {
  MODES,
  VEHICLES,
  upgradePrice,
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
import { responsiveCommands } from './balance-tactics';
import { writeFileSync, mkdirSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')),
);
const modes = args.mode ? [args.mode as Mode] : (Object.keys(MODES) as Mode[]);
const arenas = args.arena ? [args.arena as ArenaKind] : (['barn', 'yard'] as ArenaKind[]);
const plan = args.plan ?? 'balanced';
const seed = Number(args.seed ?? 73429);
const hay = args.hay !== 'off';
const surfaces = args.surfaces !== 'off';
const reserveAir = args['reserve-air'] === 'on';
const primaryPath = args.primary ?? 'unique';
const primaryScope = args['primary-scope'] ?? 'all';
const mobilitySecondary = args['mobility-secondary'] ?? 'attack';
const airCounters = Number(args['air-counters'] ?? 1);
const airTarget = args['air-target'] ?? 'highest';
const tactics = args.tactics ?? 'periodic';
const reinforce = args.reinforce === 'on';
if (
  (args.hay && !['on', 'off'].includes(args.hay)) ||
  (args.surfaces && !['on', 'off'].includes(args.surfaces)) ||
  (args['reserve-air'] && !['on', 'off'].includes(args['reserve-air'])) ||
  modes.some((mode) => !MODES[mode]) ||
  arenas.some((arena) => !['barn', 'yard'].includes(arena)) ||
  !['balanced', 'basic', 'expanded'].includes(plan) ||
  !['attack', 'speed', 'traction', 'unique'].includes(primaryPath) ||
  !['all', 'harvester'].includes(primaryScope) ||
  !['attack', 'unique'].includes(mobilitySecondary) ||
  !['nearest', 'highest'].includes(airTarget) ||
  !['periodic', 'responsive'].includes(tactics) ||
  (args.reinforce && !['on', 'off'].includes(args.reinforce)) ||
  !Number.isSafeInteger(airCounters) ||
  airCounters < 1 ||
  !Number.isSafeInteger(seed) ||
  (args.rounds && (!Number.isInteger(Number(args.rounds)) || Number(args.rounds) < 1))
) {
  throw new Error(
    'Use --mode=easy|medium|hard --arena=barn|yard --plan=balanced|basic|expanded --primary=attack|speed|traction|unique --primary-scope=all|harvester --mobility-secondary=attack|unique --seed=integer --rounds=positive-integer --hay=on|off --surfaces=on|off --reserve-air=on|off --air-counters=positive-integer --air-target=nearest|highest --tactics=periodic|responsive --reinforce=on|off',
  );
}
await initPhysics();
const reports = [];
for (const mode of modes)
  for (const arena of arenas) {
    let run = newRun(mode, arena);
    run.seed = seed;
    const results = [];
    let reinforcementsBought = 0;
    const rounds = Math.min(MODES[mode].rounds, Number(args.rounds ?? MODES[mode].rounds));
    const requiredAir = () =>
      reserveAir ? (run.round >= 11 ? airCounters : run.round >= 7 ? 1 : 0) : 0;
    function buy(kind: VehicleKind) {
      if (kind !== 'crane' && run.fleet.filter((v) => v.kind === 'crane').length < requiredAir())
        return false;
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
        targeting: kind === 'crane' && airTarget === 'highest' ? 'Highest' : 'Nearest',
      };
      const a = arenaFor(arena, run.round, run.seed);
      if (!hay) a.obstacles = a.obstacles.filter((o) => !o.loose);
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
      if (run.fleet.filter((v) => v.kind === 'crane').length < requiredAir()) return false;
      if (!upgradeAllowed(v, path)) return false;
      const cost = upgradePrice(run, v, path);
      if (cost > run.cash) return false;
      run.cash -= cost;
      v.spent += cost;
      v.upgrades[path]++;
      return true;
    }
    for (let round = 1; round <= rounds; round++) {
      run.round = round;
      while (run.fleet.filter((v) => v.kind === 'crane').length < requiredAir())
        if (!buy('crane')) break;
      for (const [kind, intro] of [
        ['harvester', 1],
        ['sprayer', 2],
        ['excavator', 5],
        ['crane', 7],
        ...(plan === 'expanded'
          ? ([
              ['baler', 4],
              ['bulldozer', 6],
              ['blower', 9],
              ['mixer', 10],
            ] as const)
          : []),
      ] as const)
        if (round >= intro && !run.fleet.some((v) => v.kind === kind)) buy(kind);
      if (plan !== 'basic') {
        const extras = ['excavator', 'sprayer', 'crane', 'harvester'] as const;
        const rosterSize = plan === 'expanded' ? 8 : 4;
        const targetFleet =
          plan === 'expanded'
            ? round >= 32
              ? 10
              : round >= 24
                ? 9
                : 8
            : round >= 32
              ? 8
              : round >= 24
                ? 7
                : round >= 16
                  ? 6
                  : round >= 12
                    ? 5
                    : 4;
        while (run.fleet.length >= rosterSize && run.fleet.length < targetFleet)
          if (!buy(extras[run.fleet.length - rosterSize])) break;
      }
      if (reinforce && plan !== 'basic' && round >= 35) {
        const reinforcements = ['excavator', 'mixer', 'baler', 'sprayer'] as const;
        while (reinforcementsBought < reinforcements.length) {
          if (!buy(reinforcements[reinforcementsBought])) break;
          reinforcementsBought++;
        }
      }
      // Spread affordable tiers before saving for a costly signature transformation.
      for (const tier of [1, 2, 3, 4, 5]) {
        // Layer removal cuts splitting work; acid supplies wide armor coverage.
        // Buy those before crowd pull, straw bursts or support vortexes.
        const priority = [
          'excavator',
          'sprayer',
          'bulldozer',
          'mixer',
          'crane',
          'baler',
          'harvester',
          'blower',
        ];
        const investments =
          tier >= 4
            ? [...run.fleet].sort((a, b) => priority.indexOf(a.kind) - priority.indexOf(b.kind))
            : run.fleet;
        for (const v of investments) {
          const airDamage = v.kind === 'crane' || v.kind === 'blower';
          // Keep an armor-capable air specialist while varying the ground
          // fleet's commitment. Mobility builds still need role coverage.
          const primary: PathName = airDamage
            ? 'attack'
            : primaryScope === 'all' || v.kind === 'harvester'
              ? (primaryPath as PathName)
              : 'unique';
          const secondary: PathName =
            airDamage || primary === 'attack'
              ? 'unique'
              : primary === 'speed' || primary === 'traction'
                ? (mobilitySecondary as PathName)
                : 'attack';
          const goal =
            plan === 'basic' ? 2 : round >= 25 ? 5 : round >= 16 ? 4 : round >= 8 ? 3 : 2;
          if (round >= 8 && tier <= goal && v.upgrades[primary] < tier) upgrade(v, primary);
          if (round >= 8 && tier <= 2 && v.upgrades[secondary] < tier) upgrade(v, secondary);
        }
      }
      if (plan !== 'basic' && round >= 10 && run.fleet.length >= 4) {
        for (const ability of ['boost', 'gust', 'pitchfork'] as const)
          if (run.abilities[ability] === undefined || (round >= 20 && run.abilities[ability]! < 2))
            run = purchaseAbility(run, ability);
      }
      const preparation = {
        cash: run.cash,
        abilities: { ...run.abilities },
        fleet: structuredClone(run.fleet),
      };
      const sim = new Simulation(run, hay, surfaces);
      let peak = 0;
      while (!sim.summary) {
        if (plan !== 'basic' && tactics === 'responsive' && sim.tick % 60 === 0) {
          for (const command of responsiveCommands(sim)) sim.enqueue(command);
        }
        if (plan !== 'basic' && tactics === 'periodic' && sim.tick % 900 === 0) {
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
        pending: sim.pending,
        hayRemaining: sim.bales.length,
        hayCrushed: sim.hayCrushed,
        hayPushed: sim.hayPushed,
        oil: sim.arena.surfaces?.filter((p) => p.kind === 'oil').length ?? 0,
        rough: sim.arena.surfaces?.filter((p) => p.kind === 'rough').length ?? 0,
        remaining: Object.fromEntries(
          (['basic', 'layered', 'armored', 'high', 'carrier'] as const).map((kind) => [
            kind,
            sim.balloons.filter((b) => b.kind === kind).length,
          ]),
        ),
        remainingArmored: sim.balloons.filter((b) => b.armor).length,
        preparation,
        vehicleResults: sim.vehicles.map((v) => ({
          id: v.id,
          kind: v.kind,
          pops: v.pops,
          state: v.state,
          x: v.x,
          z: v.z,
        })),
      });
      if (args.progress)
        console.error(
          JSON.stringify({
            mode,
            arena,
            hay,
            round,
            lost: s.livesLost,
            seconds: +s.seconds.toFixed(1),
            hayCrushed: sim.hayCrushed,
            hayPushed: sim.hayPushed,
          }),
        );
      sim.dispose();
      if (!run.lives) break;
    }
    const report = {
      mode,
      arena,
      hay,
      surfaces,
      reserveAir,
      airCounters,
      airTarget,
      tactics,
      reinforce,
      plan,
      primaryPath,
      primaryScope,
      mobilitySecondary,
      seed,
      requestedRounds: rounds,
      survived: run.lives > 0 && run.round === rounds,
      campaignCompleted: run.lives > 0 && run.round === MODES[mode].rounds,
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
    if (plan !== 'basic' && !report.survived) process.exitCode = 1;
  }
mkdirSync('artifacts', { recursive: true });
writeFileSync(
  `artifacts/balance-${plan}-${seed}-${modes.join('-')}-${arenas.join('-')}-${hay ? 'hay' : 'clear'}-surfaces-${surfaces ? 'on' : 'off'}${reserveAir ? '-air-reserve' : ''}${args.primary ? `-primary-${primaryPath}` : ''}${args['primary-scope'] ? `-primary-scope-${primaryScope}` : ''}${args['mobility-secondary'] ? `-mobility-secondary-${mobilitySecondary}` : ''}${args['air-counters'] ? `-air-counters-${airCounters}` : ''}${args['air-target'] ? `-air-target-${airTarget}` : ''}${args.tactics ? `-tactics-${tactics}` : ''}${reinforce ? '-reinforced' : ''}${args.rounds ? `-through-${args.rounds}` : ''}.json`,
  JSON.stringify(reports, null, 2),
);
