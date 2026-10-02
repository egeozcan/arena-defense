import type { VehicleKind } from '../sim/data';

// These describe the stock chassis; upgrades can change its limits.
export const VEHICLE_GUIDES: Record<
  VehicleKind,
  { strength: string; weakness: string; partner: string }
> = {
  harvester: {
    strength: 'Rapid, wide cuts clear dense groups of low balloons.',
    weakness: 'Only reaches 1.5 m. Cannot hurt armor until Attack tier 3.',
    partner: 'Pair with a crane for high-flyers and an excavator for armor.',
  },
  sprayer: {
    strength: 'Fastest chassis. A 5 m spray cone hits several balloons at once.',
    weakness:
      'Low damage, weakest terrain grip, and only half damage to armor. Cannot reach above 4 m.',
    partner: 'Add Chemicals for slowing and acid; a crane covers high-flyers.',
  },
  excavator: {
    strength: 'Heavy hits deal full damage to armor. Strong terrain grip.',
    weakness:
      'Slow movement and attacks. Hits one balloon at a time until Hydraulics tier 2; reaches only 5 m high.',
    partner: 'Pair with a harvester for crowds and a crane for high-flyers.',
  },
  crane: {
    strength: 'Reaches balloons from 3–12 m high with a long-range, heavy hook.',
    weakness: 'Slowest chassis. Cannot hit below 3 m or hurt armor until Attack tier 3.',
    partner: 'Pair with a harvester for low balloons and an excavator for armor.',
  },
};
