import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import {
  newRun,
  VEHICLES,
  type BalloonKind,
  type OwnedVehicle,
  type Spawn,
  type VehicleKind,
} from '../src/sim/data';
import { initPhysics, Simulation } from '../src/sim/engine';

// Headless CPU measurements. Render/GPU cost must be measured separately in a browser.
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')),
);
const ticks = Number(args.ticks ?? 1200);
const repetitions = Number(args.repetitions ?? 3);
if (
  !Number.isInteger(ticks) ||
  ticks < 1 ||
  ticks > 10800 ||
  !Number.isInteger(repetitions) ||
  repetitions < 1
)
  throw new Error('Use --ticks=1..10800 --repetitions=positive-integer --scenario=name');

const roster = Object.keys(VEHICLES) as VehicleKind[];
function fleet(kind?: VehicleKind, upgraded = false): OwnedVehicle[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    kind: kind ?? roster[i],
    x: 10 + (i % 4) * 6,
    z: 8 + Math.floor(i / 4) * 6,
    rotation: 0,
    targeting: 'Nearest',
    placed: true,
    upgrades: { attack: upgraded ? 5 : 0, speed: 0, traction: 0, unique: upgraded ? 2 : 0 },
    spent: VEHICLES[kind ?? roster[i]].cost,
  }));
}
function simulation(round: number, kind?: VehicleKind, upgraded = false) {
  const run = newRun('hard', 'yard');
  run.round = round;
  run.fleet = fleet(kind, upgraded);
  return new Simulation(run);
}
const spawn: Spawn = {
  tick: 0,
  kind: 'basic',
  layer: 1,
  fleeing: false,
  regen: false,
  armor: false,
};
function waiting(sim: Simulation) {
  sim.wave = [{ ...spawn, tick: 10799 }];
  return sim;
}
function dense(kind: VehicleKind, balloonKind: BalloonKind) {
  const sim = waiting(simulation(60, kind));
  // Scoped benchmark adapter creates separated bodies so the CPU workload remains
  // at the 300-balloon limit without depending on spawn-pack collisions or damage.
  const adapter = sim as unknown as {
    spawn(s: Spawn, at: { x: number; y: number; z: number }): void;
  };
  for (let i = 0; i < 300; i++)
    adapter.spawn(
      { ...spawn, kind: balloonKind },
      {
        x: 3 + (i % 20) * 3,
        y: balloonKind === 'high' ? 10 : 0.8,
        z: 3 + Math.floor(i / 20) * 2.8,
      },
    );
  for (const vehicle of sim.vehicles) vehicle.attackTick = 10801;
  return sim;
}
const scenarios: Record<string, () => Simulation> = {
  idle: () => waiting(simulation(60, 'harvester')),
  uncovered: () => dense('harvester', 'high'),
  'mixed-20': () => simulation(20),
  'late-60': () => simulation(60, undefined, true),
  'dense-harvesters': () => dense('harvester', 'basic'),
  'dense-cranes': () => dense('crane', 'high'),
  'dense-balers': () => dense('baler', 'basic'),
};
const selected = args.scenario ? [args.scenario] : Object.keys(scenarios);
if (selected.some((name) => !scenarios[name]))
  throw new Error(`Unknown scenario; choose ${Object.keys(scenarios).join(', ')}`);
await initPhysics();
// Warm the physics bridge before any timed samples.
const warmup = waiting(simulation(1, 'harvester'));
for (let i = 0; i < 30; i++) warmup.step();
warmup.dispose();

const report = [];
for (const name of selected) {
  const samples = [];
  let expectedChecksum: string | undefined;
  for (let repeat = 0; repeat < repetitions; repeat++) {
    const sim = scenarios[name]();
    const times: number[] = [];
    let maxBalloons = sim.balloons.length;
    try {
      for (let i = 0; i < ticks && !sim.summary; i++) {
        const start = performance.now();
        sim.step();
        times.push(performance.now() - start);
        maxBalloons = Math.max(maxBalloons, sim.balloons.length);
      }
      const checksum = createHash('sha256')
        .update(
          JSON.stringify({
            tick: sim.tick,
            balloons: sim.balloons,
            vehicles: sim.vehicles,
            bales: sim.bales,
            shots: sim.shots,
            winds: sim.winds,
            summary: sim.summary,
            pops: sim.pops,
            popCash: sim.popCash,
            rng: sim.rng.state,
          }),
        )
        .digest('hex');
      if (expectedChecksum && checksum !== expectedChecksum)
        throw new Error(`${name} produced different simulation state across repetitions`);
      expectedChecksum = checksum;
      times.sort((a, b) => a - b);
      samples.push({
        ticks: times.length,
        meanMs: times.reduce((sum, time) => sum + time, 0) / times.length,
        p50Ms: times[Math.floor(times.length * 0.5)],
        p95Ms: times[Math.floor(times.length * 0.95)],
        maxMs: times.at(-1),
        maxBalloons,
        balloons: sim.balloons.length,
        pending: sim.pending,
        pops: sim.pops,
        checksum,
      });
    } finally {
      sim.dispose();
    }
  }
  report.push({ scenario: name, samples });
}
console.log(JSON.stringify({ node: process.version, ticks, repetitions, report }, null, 2));
