import { PATHS, VEHICLES, type OwnedVehicle, type VehicleKind } from '../sim/data';

export type VehicleUpgrades = OwnedVehicle['upgrades'];
export const STOCK_UPGRADES: VehicleUpgrades = { attack: 0, speed: 0, traction: 0, unique: 0 };
export const UPGRADE_COLORS = {
  attack: '#ed654e',
  speed: '#ffd45e',
  traction: '#76b995',
  unique: '#56cadd',
};

// All paths contribute to the finish, independent of purchase order. Dedicated
// colored hardware keeps a secondary path readable beside a dominant tier 5.
export function vehicleAppearance(kind: VehicleKind, upgrades = STOCK_UPGRADES) {
  const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const paint = channels(VEHICLES[kind].color).map((c) => c * 5);
  let weight = 5;
  for (const path of PATHS) {
    const tier = upgrades[path];
    const tint = channels(UPGRADE_COLORS[path]);
    for (let i = 0; i < 3; i++) paint[i] += tint[i] * tier;
    weight += tier;
  }
  return {
    paint: `#${paint
      .map((c) =>
        Math.round(c / weight)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')}`,
    toolWidth: 1 + upgrades.attack * 0.055,
    reach: 1 + (upgrades.unique >= 1 ? 0.12 : 0) + (upgrades.unique >= 3 ? 0.1 : 0),
    tireScale: 1 + upgrades.traction * 0.035,
  };
}
