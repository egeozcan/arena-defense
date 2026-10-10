import type { PathName, VehicleKind } from '../sim/data';
import { hayLabel } from '../sim/hay';

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
  bulldozer: {
    strength: 'A broad front blade sweeps low packs and deals 75% damage to armor.',
    weakness: 'Short 2.8 m reach and only 1.8 m height. Must turn its chassis toward targets.',
    partner: 'A crane or blower handles high-flyers; a mixer reaches scattered mid-height groups.',
  },
  mixer: {
    strength: 'Each concrete splat damages a 1.25 m area from 7 m away.',
    weakness: 'Slow 0.9 s firing, half damage to armor, and no reach above 5 m.',
    partner: 'A bulldozer or excavator crushes armor; a crane handles high-flyers.',
  },
};
for (const kind of Object.keys(VEHICLE_GUIDES) as VehicleKind[]) {
  const stock = { kind, upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 } };
  if (kind === 'sprayer' || kind === 'crane' || kind === 'blower')
    VEHICLE_GUIDES[kind].weakness += ' Routes around hay until Traction tier 3.';
  else VEHICLE_GUIDES[kind].strength += ` ${hayLabel(stock)}.`;
  VEHICLE_GUIDES[kind].weakness +=
    kind === 'harvester' || kind === 'excavator'
      ? ' Clearing hay takes time.'
      : ' Bales can block tight approaches.';
}

// Describe each path as a primary commitment: a specialist chosen at tier 3
// leaves only two tiers for coverage/damage/mobility on the secondary path.
export const UPGRADE_DIRECTIONS: Record<VehicleKind, Record<PathName, string>> = {
  harvester: {
    attack: 'Cut armor and hit harder; Header stops at tier 2 (2 m high).',
    speed: 'Chase and sustain rapid cuts; armor still needs a teammate.',
    traction: 'Clear hay faster and handle muddy routes; armor still needs a teammate.',
    unique: 'Reach 3 m, cut behind and gather crowds; armor still needs a teammate.',
  },
  sprayer: {
    attack: 'Burst damage with 75% armor damage; Chemicals stops at tier 2.',
    speed: 'Chase fast packs and spray faster; no sticky spray or acid.',
    traction: 'Push hay and cover muddy lanes reliably; no sticky spray or acid.',
    unique: 'Slow packs, strip armor and spray all around; stays below 4 m.',
  },
  excavator: {
    attack: 'Shatter armor with heavy hits; Hydraulics can still add small splash.',
    speed: 'Reach scattered armor and crush faster; no advanced shockwaves.',
    traction: 'Clear hay faster and recover through mud; no advanced shockwaves.',
    unique: 'Splash, ground shock and remove layers; stays below 5 m.',
  },
  crane: {
    attack: 'Twin armor-breaking hooks; Boom stops at tier 2 (12 m high).',
    speed: 'Chase and sustain rapid hooks; armor still needs a teammate.',
    traction: 'Push hay and cross muddy lanes; armor still needs a teammate.',
    unique: 'Carrier control and a splash tower at half speed; needs armor support.',
  },
  baler: {
    attack: 'Heavy armor-piercing shots; Bale Press stops at 8 targets per bale.',
    speed: 'Reposition and fire continuously; armor damage stays at 25%.',
    traction: 'Push hay with more grip to open firing lanes; armor damage stays at 25%.',
    unique: 'Wide 12-target bales and straw bursts; weak armor, no high reach.',
  },
  blower: {
    attack: 'Damage armored air packs; Airflow stops at tier 2 (12 m high).',
    speed: 'Chase and keep herding packs; armor still needs a teammate.',
    traction: 'Push hay and herd across muddy routes; armor needs a teammate.',
    unique: 'Herd from 9 m, gather high packs and lower them; needs armor support.',
  },
  bulldozer: {
    attack: 'Cut through armored ground packs with faster, stronger sweeps; Blade stops at tier 2.',
    speed: 'Reach low swarms sooner and sweep more often; Blade stays short and low.',
    traction: 'Push hay faster and recover through mud; Blade stays short and low.',
    unique:
      'Crush hay, widen and raise the blade, slow packs, and unlock Blade sweep; high-flyers need support.',
  },
  mixer: {
    attack: 'Heavy concrete blasts with 75% armor damage; Drum stops at tier 2.',
    speed: 'Keep splash damage moving between packs; armor damage stays at 50%.',
    traction: 'Push hay faster to reach rough firing spots; armor damage stays at 50%.',
    unique:
      'Grow the splash, slow groups, and eventually damage armor fully; high-flyers need support.',
  },
};
