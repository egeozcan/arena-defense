import { VEHICLES, type OwnedVehicle } from './data';

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
      (v.kind === 'crane' && u.unique >= 2 ? 1.25 : 1),
    speed: s.speed * (u.speed >= 1 ? 1.15 : 1) * (u.speed >= 3 ? 1.3 : 1),
    traction: Math.min(1, s.traction + Math.min(2, u.traction) * 0.1),
    range:
      s.range +
      (u.unique >= 1 ? (v.kind === 'crane' ? 2 : v.kind === 'harvester' ? 0.5 : 1) : 0) +
      (v.kind === 'excavator' && u.unique >= 3 ? 1 : 0),
    min: s.min,
    max:
      v.kind === 'harvester'
        ? u.unique >= 4
          ? 3
          : u.unique >= 2
            ? 2
            : 1.5
        : v.kind === 'crane' && u.unique === 5
          ? 14
          : s.max,
  };
}
// Combat and preparation share the same altitude tolerance and armor rules.
export function armorDamageFactor(v: OwnedVehicle): number {
  let factor = v.kind === 'excavator' ? 1 : v.kind === 'sprayer' ? 0.5 : 0;
  if (v.upgrades.attack >= 3) factor += (1 - factor) * 0.5;
  if (v.kind === 'sprayer' && v.upgrades.unique >= 4) factor = 1;
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
    : factor === 1
      ? 'Full damage to armor'
      : `${Math.round(factor * 100)}% damage to armor`;
}
