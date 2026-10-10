import { PATHS, VEHICLES, SURFACE_GRIP, type OwnedVehicle, type PathName } from '../sim/data';
import {
  armorDamageFactor,
  terrainHandlingFactor,
  toolIntervalTicks,
  vehicleStats,
  vehicleTool,
} from '../sim/capabilities';
import { hayHandling } from '../sim/hay';

export const pathLabel = (v: OwnedVehicle, path: PathName) =>
  path === 'unique' ? VEHICLES[v.kind].unique : path[0].toUpperCase() + path.slice(1);

// Preview the inspected step, including installed tiers, from the same stats as
// combat. Other paths remain at their current level so cross-path bonuses show.
export function upgradeChanges(v: OwnedVehicle, path: PathName, tier: number) {
  const before = { ...v, upgrades: { ...v.upgrades, [path]: tier - 1 } };
  const after = { ...v, upgrades: { ...v.upgrades, [path]: tier } };
  const a = vehicleStats(before),
    b = vehicleStats(after);
  const changes: string[] = [];
  const add = (label: string, from: number, to: number, unit = '') => {
    if (Math.abs(from - to) > 1e-9)
      changes.push(`${label} ${Number(from.toFixed(2))} → ${Number(to.toFixed(2))}${unit}`);
  };
  add('Damage', a.damage, b.damage);
  add(
    'Attacks',
    60 / toolIntervalTicks(before, before.upgrades.speed === 5),
    60 / toolIntervalTicks(after, after.upgrades.speed === 5),
    '/s',
  );
  add('Drive', a.speed, b.speed, ' m/s');
  add('Reach', a.range, b.range, ' m');
  add('Height', a.max, b.max, ' m');
  add('Armor damage', armorDamageFactor(before) * 100, armorDamageFactor(after) * 100, '%');
  const fromTool = vehicleTool(before),
    toTool = vehicleTool(after);
  add('Sweep', (fromTool.cone * 360) / Math.PI, (toTool.cone * 360) / Math.PI, '°');
  add('Splash', fromTool.splash, toTool.splash, ' m');
  add('Targets / bale', fromTool.pierce, toTool.pierce);
  add('Hooks', fromTool.targets, toTool.targets);
  if (path === 'traction') {
    add(
      'Oil control',
      terrainHandlingFactor(before, SURFACE_GRIP.oil) * 100,
      terrainHandlingFactor(after, SURFACE_GRIP.oil) * 100,
      '%',
    );
    add(
      'Rough control',
      terrainHandlingFactor(before, SURFACE_GRIP.rough) * 100,
      terrainHandlingFactor(after, SURFACE_GRIP.rough) * 100,
      '%',
    );
    const fromHay = hayHandling(before),
      toHay = hayHandling(after);
    add(
      'Hay push',
      fromHay.mode === 'push' ? fromHay.pushSpeed : 0,
      toHay.mode === 'push' ? toHay.pushSpeed : 0,
      ' m/s',
    );
    if (fromHay.mode === 'crush' && toHay.mode === 'crush')
      add('Hay clear', 1 / fromHay.crushRate, 1 / toHay.crushRate, ' s');
  }
  return changes.join(' · ');
}

export function upgradeCommitment(v: OwnedVehicle, path: PathName, tier: number) {
  if (tier <= v.upgrades[path]) return 'Installed on this vehicle.';
  const used = PATHS.filter((p) => v.upgrades[p] > 0);
  const primary = PATHS.find((p) => v.upgrades[p] >= 3);
  const name = pathLabel(v, path);
  if (!used.includes(path) && used.length === 2)
    return `Locked by ${used.map((p) => pathLabel(v, p)).join(' + ')}.`;
  if (primary && primary !== path && tier > 2)
    return `${pathLabel(v, primary)} is primary. ${name} stops at tier 2.`;
  if (tier >= 3) {
    const secondary = used.find((p) => p !== path);
    const status = primary === path ? 'is primary' : 'becomes primary';
    return secondary
      ? `${name} ${status}. ${pathLabel(v, secondary)} stops at tier 2; its tiers 3–5 are unavailable.`
      : `${name} ${status}. Your second path will stop at tier 2.`;
  }
  if (!used.includes(path) && used.length === 1) {
    const locked = PATHS.filter((p) => p !== path && !used.includes(p));
    return `Uses your last path slot. Locks ${locked.map((p) => pathLabel(v, p)).join(' and ')}.`;
  }
  if (used.length === 0)
    return 'Uses one of two path slots. Choose your second to cover a weakness.';
  return primary
    ? `${name} supports ${pathLabel(v, primary)} and stops at tier 2.`
    : 'The first path to tier 3 becomes primary; the other stops at tier 2.';
}
