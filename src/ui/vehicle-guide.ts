import type { PathName, VehicleKind } from '../sim/data';

// These describe the stock chassis; upgrades can change its limits.
export const VEHICLE_GUIDES: Record<
  VehicleKind,
  { strength: string; weakness: string; partner: string }
> = {
  baler: {
    strength: 'Travelling bales pierce up to 4 lined-up balloons from 7 m away.',
    weakness: 'Slow firing rate, only 25% damage to armor, and no reach above 4 m.',
    partner: 'A blower gathers targets into a pack; a crane covers high-flyers.',
  },
  blower: {
    strength: 'Air bursts reach 1.5–12 m and herd packs toward nearby teammates.',
    weakness: 'Low damage. Cannot reach ground balloons or damage armor until Attack tier 3.',
    partner: 'Pair with a baler for piercing shots or a harvester for low crowds after Downburst.',
  },
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

// Describe each path as a primary commitment: a specialist chosen at tier 3
// leaves only two tiers for coverage/damage/mobility on the secondary path.
export const UPGRADE_DIRECTIONS: Record<VehicleKind, Record<PathName, string>> = {
  harvester: {
    attack: 'Cut armor and hit harder; Header stops at tier 2 (2 m high).',
    speed: 'Chase and sustain rapid cuts; armor still needs a teammate.',
    traction: 'Cut through muddy routes and traffic; armor still needs a teammate.',
    unique: 'Reach 3 m, cut behind and gather crowds; armor still needs a teammate.',
  },
  sprayer: {
    attack: 'Burst damage with 75% armor damage; Chemicals stops at tier 2.',
    speed: 'Chase fast packs and spray faster; no sticky spray or acid.',
    traction: 'Cover muddy lanes reliably; no sticky spray or acid.',
    unique: 'Slow packs, strip armor and spray all around; stays below 4 m.',
  },
  excavator: {
    attack: 'Shatter armor with heavy hits; Hydraulics can still add small splash.',
    speed: 'Reach scattered armor and crush faster; no advanced shockwaves.',
    traction: 'Recover through mud and traffic; no advanced shockwaves.',
    unique: 'Splash, ground shock and remove layers; stays below 5 m.',
  },
  crane: {
    attack: 'Twin armor-breaking hooks; Boom stops at tier 2 (12 m high).',
    speed: 'Chase and sustain rapid hooks; armor still needs a teammate.',
    traction: 'Reach high targets across muddy lanes; armor still needs a teammate.',
    unique: 'Carrier control and a splash tower at half speed; needs armor support.',
  },
  baler: {
    attack: 'Heavy armor-piercing shots; Bale Press stops at 8 targets per bale.',
    speed: 'Reposition and fire continuously; armor damage stays at 25%.',
    traction: 'Keep firing lanes accessible in mud; armor damage stays at 25%.',
    unique: 'Wide 12-target bales and straw bursts; weak armor, no high reach.',
  },
  blower: {
    attack: 'Damage armored air packs; Airflow stops at tier 2 (12 m high).',
    speed: 'Chase and keep herding packs; armor still needs a teammate.',
    traction: 'Herd across muddy routes and traffic; armor needs a teammate.',
    unique: 'Herd from 9 m, gather high packs and lower them; needs armor support.',
  },
};
