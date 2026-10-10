import { VEHICLES, type OwnedVehicle } from './data';
import { POP_RUSH } from './pop-rush';

export function vehicleStats(v: OwnedVehicle) {
  const s = VEHICLES[v.kind],
    u = v.upgrades;
  return {
    damage:
      s.damage *
      (u.attack >= 1 ? 1.25 : 1) *
      (u.attack >= 4 ? 2 : 1) *
      (u.attack === 5 ? (v.kind === 'harvester' ? 2 : v.kind === 'crane' ? 1 : 3) : 1),
    interval:
      (s.interval * (u.attack >= 2 ? 0.8 : 1)) /
      (u.speed >= 2 ? 1.15 : 1) /
      (v.kind === 'crane' && u.unique >= 2 ? 1.25 : 1) /
      (v.kind === 'baler' && u.unique >= 3 ? 1.25 : 1),
    speed:
      s.speed *
      (u.speed >= 1 ? 1.15 : 1) *
      (u.speed >= 3 ? 1.3 : 1) *
      (u.speed === 5 ? 1.15 : 1) *
      (u.traction === 5 ? 1.2 : 1) *
      (v.kind === 'crane' && u.unique === 5 ? 0.5 : 1),
    traction: Math.min(1, s.traction + Math.min(2, u.traction) * 0.1),
    range:
      s.range +
      (u.unique >= 1
        ? v.kind === 'crane' || v.kind === 'baler'
          ? 2
          : v.kind === 'harvester'
            ? 0.5
            : v.kind === 'bulldozer'
              ? 0.5
              : 1
        : 0) +
      (v.kind === 'excavator' && u.unique >= 3 ? 1 : 0) +
      (v.kind === 'crane' && u.unique === 5 ? 4 : 0) +
      (v.kind === 'blower' && u.unique >= 4 ? 2 : 0) +
      (v.kind === 'bulldozer' && u.unique === 5 ? 0.7 : 0),
    min: s.min,
    max:
      v.kind === 'harvester'
        ? u.unique >= 4
          ? 3
          : u.unique >= 2
            ? 2
            : 1.5
        : v.kind === 'bulldozer' && u.unique >= 4
          ? 2.8
          : (v.kind === 'crane' && u.unique === 5) || (v.kind === 'blower' && u.unique >= 4)
            ? 14
            : s.max,
  };
}
// Combat and preparation share the same altitude tolerance and armor rules.
export function armorDamageFactor(v: OwnedVehicle): number {
  let factor =
    v.kind === 'excavator'
      ? 1
      : v.kind === 'bulldozer'
        ? 0.75
        : v.kind === 'sprayer' || v.kind === 'mixer'
          ? 0.5
          : v.kind === 'baler'
            ? 0.25
            : 0;
  if (v.upgrades.attack >= 3) factor = v.kind === 'excavator' ? 1.5 : factor + (1 - factor) * 0.5;
  if (v.kind === 'sprayer' && v.upgrades.unique >= 4) factor = 1;
  if (v.kind === 'mixer' && v.upgrades.unique >= 4) factor = 1;
  return factor;
}
export function targetHeightRange(v: OwnedVehicle): [number, number] {
  const stats = vehicleStats(v);
  return [stats.min - 0.15, stats.max + 0.2];
}
export function canTargetBalloon(v: OwnedVehicle, height: number, armored: boolean) {
  const [min, max] = targetHeightRange(v);
  return height >= min && height <= max && (!armored || armorDamageFactor(v) > 0);
}
export function armorLabel(v: OwnedVehicle) {
  const factor = armorDamageFactor(v);
  return factor === 0
    ? 'Cannot damage armor'
    : factor > 1
      ? `${Math.round((factor - 1) * 100)}% bonus damage to armor`
      : factor === 1
        ? 'Full damage to armor'
        : `${Math.round(factor * 100)}% damage to armor`;
}

export function toolIntervalTicks(v: OwnedVehicle, overdrive = false, rush = false) {
  const rate = Math.min(2.6, (overdrive ? 2 : 1) * (rush ? POP_RUSH.tool : 1));
  return Math.max(1, (vehicleStats(v).interval * 60) / rate);
}

export function terrainSpeedFactor(v: OwnedVehicle, terrain: number) {
  if (v.upgrades.traction === 5) return 1;
  if (v.upgrades.traction >= 3 && terrain === 0.4) terrain += 0.2;
  return Math.min(1, terrain + 0.5 * vehicleStats(v).traction);
}

// Tool geometry is shared by combat and the balance audit. Angles are half cones.
export function vehicleTool(v: OwnedVehicle) {
  const u = v.upgrades,
    kind = v.kind;
  return {
    cone:
      kind === 'harvester'
        ? 1.2
        : kind === 'bulldozer'
          ? u.unique === 5
            ? 1.35
            : u.unique >= 2
              ? 1.12
              : 0.8
          : kind === 'sprayer'
            ? u.unique === 5
              ? Math.PI
              : u.unique >= 2
                ? Math.PI / 6
                : Math.PI / 9
            : kind === 'blower'
              ? u.unique >= 2
                ? Math.PI / 5
                : Math.PI / 9
              : 0,
    rear: kind === 'harvester' && u.unique >= 3,
    splash:
      kind === 'excavator' && u.unique >= 2
        ? 1
        : kind === 'crane' && u.unique >= 3
          ? 1.5
          : kind === 'mixer'
            ? u.unique === 5
              ? 2.5
              : u.unique >= 2
                ? 1.75
                : 1.25
            : 0,
    targets: kind === 'crane' && (u.attack === 5 || u.unique === 5) ? 2 : 1,
    pierce: kind === 'baler' ? (u.unique >= 4 ? 12 : u.unique >= 2 ? 8 : 4) : 0,
    baleRadius: kind === 'baler' ? (u.unique >= 4 ? 0.65 : 0.35) : 0,
    burst: kind === 'baler' && u.unique === 5 ? 2 : 0,
    shockwave: kind === 'excavator' && u.unique >= 4 ? 3 : 0,
    pull: kind === 'harvester' && u.unique === 5 ? 4 : 0,
    wind: kind === 'blower' ? (u.unique >= 3 ? 5 : 3) : 0,
    vortex: kind === 'blower' && u.unique === 5,
    slow: (kind === 'sprayer' || kind === 'bulldozer' || kind === 'mixer') && u.unique >= 3,
    acid: kind === 'sprayer' && u.unique >= 4,
    demolish: kind === 'excavator' && u.unique === 5,
    magnet: kind === 'crane' && u.unique >= 4,
  };
}
