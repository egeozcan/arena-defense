import {
  ABILITIES,
  MODES,
  PATHS,
  TARGETS,
  VEHICLES,
  arenaFor,
  fitFleet,
  newRun,
  type OwnedVehicle,
  type PathName,
  type Run,
} from '../sim/data';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function knownKey<T extends object>(value: unknown, choices: T): value is keyof T {
  return typeof value === 'string' && Object.hasOwn(choices, value);
}

function integer(value: unknown, min = 0): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function savedUpgrades(value: unknown): value is Record<PathName, number> {
  if (!record(value) || Object.keys(value).some((path) => !PATHS.some((known) => known === path)))
    return false;
  const levels: number[] = [];
  for (const path of PATHS) {
    const level = value[path];
    if (!integer(level) || level > 5) return false;
    if (level > 0) levels.push(level);
  }
  return levels.length <= 2 && levels.filter((level) => level >= 3).length <= 1;
}

function savedAbilities(value: unknown): value is Run['abilities'] {
  return (
    record(value) &&
    Object.entries(value).every(
      ([kind, tier]) => knownKey(kind, ABILITIES) && integer(tier) && tier <= 2,
    )
  );
}

function savedVehicle(value: unknown): value is OwnedVehicle {
  return (
    record(value) &&
    integer(value.id, 1) &&
    knownKey(value.kind, VEHICLES) &&
    typeof value.placed === 'boolean' &&
    finite(value.x) &&
    finite(value.z) &&
    finite(value.rotation) &&
    TARGETS.some((target) => target === value.targeting) &&
    integer(value.spent) &&
    savedUpgrades(value.upgrades)
  );
}

function savedRun(value: unknown): value is Run {
  if (
    !record(value) ||
    value.version !== 1 ||
    !knownKey(value.mode, MODES) ||
    (value.arena !== 'barn' && value.arena !== 'yard') ||
    !integer(value.round, 1) ||
    !integer(value.cash) ||
    !integer(value.lives, 1) ||
    !integer(value.seed, -Number.MAX_SAFE_INTEGER) ||
    !integer(value.nextId, 1) ||
    typeof value.freeplay !== 'boolean' ||
    !savedAbilities(value.abilities) ||
    !Array.isArray(value.fleet) ||
    !value.fleet.every(savedVehicle)
  )
    return false;
  // Waves are allocated eagerly. This generous save-only bound prevents a
  // corrupted freeplay round from exhausting memory during the first render.
  if (value.round > (value.freeplay ? 10000 : MODES[value.mode].rounds)) return false;
  const ids = new Set<number>();
  for (const vehicle of value.fleet) {
    if (ids.has(vehicle.id) || vehicle.id >= value.nextId) return false;
    ids.add(vehicle.id);
  }
  return true;
}

export function parseSavedRun(serialized: string | null): Run {
  try {
    const run = JSON.parse(serialized || 'null');
    if (savedRun(run))
      return {
        ...run,
        fleet: fitFleet(arenaFor(run.arena, run.round, run.seed), run.fleet),
      };
  } catch {}
  return newRun();
}
