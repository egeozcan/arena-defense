import {
  BALLOONS,
  VEHICLES,
  arenaFor,
  balloonHeightRange,
  waveFor,
  type BalloonKind,
  type OwnedVehicle,
  type Run,
  type VehicleKind,
} from '../sim/data';
import { armorDamageFactor, targetHeightRange } from '../sim/capabilities';

export type Coverage = 'covered' | 'partial' | 'uncovered';
export type Threat = {
  key: string;
  kind: BalloonKind;
  count: number;
  armored: boolean;
  min: number;
  max: number;
  child: boolean;
  coverage: Coverage;
  responders: OwnedVehicle[];
};
export function coverageFor(
  fleet: OwnedVehicle[],
  min: number,
  max: number,
  armored: boolean,
): Coverage {
  const ranges = fleet
    .filter((v) => !armored || armorDamageFactor(v) > 0)
    .map(targetHeightRange)
    .filter(([low, high]) => high >= min && low <= max)
    .sort((a, b) => a[0] - b[0]);
  if (!ranges.length) return 'uncovered';
  let reached = min;
  for (const [low, high] of ranges) {
    if (low > reached) return 'partial';
    reached = Math.max(reached, high);
    if (reached >= max) return 'covered';
  }
  return 'partial';
}
export function forecast(run: Run, fleet = run.fleet.filter((v) => v.placed)) {
  const wave = waveFor(run.round, run.seed, run.mode);
  const arena = arenaFor(run.arena, run.round, run.seed);
  const groups = new Map<string, Omit<Threat, 'coverage' | 'responders'>>();
  for (const spawn of wave) {
    const armored = spawn.armor || spawn.kind === 'armored';
    const key = `${spawn.kind}-${armored}`;
    const existing = groups.get(key);
    if (existing) existing.count++;
    else {
      const [min, max] = balloonHeightRange(spawn.kind, run.round, arena);
      groups.set(key, { key, kind: spawn.kind, count: 1, armored, min, max, child: false });
    }
  }
  // Carriers release three ground-level basics on popping, even in an all-air wave.
  const carriers = wave.filter((s) => s.kind === 'carrier').length;
  if (carriers)
    groups.set('carrier-children', {
      key: 'carrier-children',
      kind: 'basic',
      count: carriers * 3,
      armored: false,
      min: 0.8,
      max: 0.8,
      child: true,
    });
  const threats: Threat[] = [...groups.values()]
    .sort((a, b) => a.min - b.min)
    .map((t) => ({
      ...t,
      coverage: coverageFor(fleet, t.min, t.max, t.armored),
      responders: fleet.filter((v) => coverageFor([v], t.min, t.max, t.armored) !== 'uncovered'),
    }));
  return {
    threats,
    total: wave.length,
    livesAtRisk: wave.reduce(
      (sum, s) => sum + (s.kind === 'layered' ? s.layer : BALLOONS[s.kind].lives),
      0,
    ),
    fleeing: wave.filter((s) => s.fleeing).length,
    regen: wave.filter((s) => s.regen).length,
    addedArmor: wave.filter((s) => s.armor).length,
    layers: Math.max(0, ...wave.filter((s) => s.kind === 'layered').map((s) => s.layer)),
    gaps: threats.filter((t) => t.coverage !== 'covered'),
  };
}
export function stockVehicle(kind: VehicleKind): OwnedVehicle {
  return {
    id: 0,
    kind,
    placed: true,
    x: 0,
    z: 0,
    rotation: 0,
    targeting: 'Nearest',
    spent: 0,
    upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
  };
}
export function threatName(t: Threat) {
  return t.child
    ? 'Carrier cargo'
    : `${t.armored && t.kind !== 'armored' ? 'Armored ' : ''}${BALLOONS[t.kind].name}`;
}
export function heightLabel(min: number, max: number) {
  const number = (n: number) => Number(n.toFixed(1)).toString();
  return min === max ? `${number(min)} m` : `${number(min)}–${number(max)} m`;
}
export function recommendation(t: Threat): VehicleKind {
  return t.min >= 6 ? 'crane' : t.armored ? 'excavator' : t.max <= 1.5 ? 'harvester' : 'sprayer';
}
export function futureChanges(run: Run) {
  const current = forecast(run);
  const next = forecast({ ...run, round: run.round + 1 });
  const changes: string[] = [];
  for (const t of next.gaps) {
    const before = current.threats.find((c) => c.key === t.key);
    const undeployed = run.fleet.filter(
      (v) => !v.placed && coverageFor([v], t.min, t.max, t.armored) !== 'uncovered',
    );
    const action =
      coverageFor(run.fleet, t.min, t.max, t.armored) === 'covered'
        ? ` · deploy ${undeployed.map(responderLabel).join(', ')}`
        : t.armored
          ? ' · needs armor damage'
          : ' · needs height coverage';
    if (!before) changes.push(`${threatName(t)} arrive at ${heightLabel(t.min, t.max)}${action}`);
    else if (before.max < t.max)
      changes.push(`${threatName(t)} rise to ${heightLabel(t.min, t.max)}${action}`);
  }
  return changes;
}
export function responderLabel(v: OwnedVehicle) {
  return `${VEHICLES[v.kind].short} #${v.id}`;
}
