import {
  PATHS,
  VEHICLES,
  newRun,
  price,
  upgradeAllowed,
  upgradePrice,
  vehicleRadius,
  type Mode,
  type OwnedVehicle,
  type VehicleKind,
} from '../src/sim/data';
import {
  armorDamageFactor,
  canTargetBalloon,
  terrainSpeedFactor,
  toolIntervalTicks,
  vehicleStats,
  vehicleTool,
} from '../src/sim/capabilities';

import { hayHandling } from '../src/sim/hay';
import { WHEELBASE, MAX_STEER } from '../src/sim/vehicle-motion';

export function legalBuilds(): OwnedVehicle[] {
  const builds: OwnedVehicle[] = [];
  for (const kind of Object.keys(VEHICLES) as VehicleKind[])
    for (let attack = 0; attack <= 5; attack++)
      for (let speed = 0; speed <= 5; speed++)
        for (let traction = 0; traction <= 5; traction++)
          for (let unique = 0; unique <= 5; unique++) {
            const upgrades = { attack, speed, traction, unique };
            if (
              Object.values(upgrades).filter((tier) => tier > 0).length > 2 ||
              Object.values(upgrades).filter((tier) => tier > 2).length > 1
            )
              continue;
            builds.push({
              id: builds.length,
              kind,
              upgrades,
              spent: 0,
              placed: true,
              x: 0,
              z: 0,
              rotation: 0,
              targeting: 'Nearest',
            });
          }
  return builds;
}

export function buildLabel(v: OwnedVehicle) {
  return `${v.kind} ${
    PATHS.filter((p) => v.upgrades[p])
      .map((p) => `${p}:${v.upgrades[p]}`)
      .join(' ') || 'stock'
  }`;
}

export function buildCost(v: OwnedVehicle, mode: Mode) {
  const run = newRun(mode);
  // Round each purchase exactly as the garage does, rather than rounding a total.
  return (
    price(run, VEHICLES[v.kind].cost) +
    PATHS.reduce(
      (sum, path) =>
        sum +
        Array.from({ length: v.upgrades[path] }, (_, i) =>
          upgradePrice(run, v, path, i + 1),
        ).reduce((a, b) => a + b, 0),
      0,
    )
  );
}

// A partial ordering, with no weighted "power score" or vehicle-name bonuses.
// Geometry dimensions describe situations where the tool can hit an extra target;
// utility dimensions are actual mechanics, not inferred direct damage. This is a
// capability audit, not a prediction of campaign performance or fleet synergy.
export function capabilityProfile(v: OwnedVehicle): Record<string, number> {
  const s = vehicleStats(v),
    t = vehicleTool(v);
  const hay = hayHandling(v);
  const tracked = v.kind === 'excavator' || v.kind === 'bulldozer' || v.kind === 'crane';
  const profile: Record<string, number> = {
    hayCrushing: hay.mode === 'crush' ? hay.crushRate : 0,
    hayPushing: hay.mode === 'push' ? hay.pushSpeed : 0,
    hayForce: hay.mode === 'push' ? hay.force : 0,
    pivotSteering: Number(tracked),
    turnCurvature: tracked ? 0 : Math.tan(MAX_STEER) / WHEELBASE,
    clearance: -vehicleRadius(v),
    reach: s.range,
    cone: t.cone,
    rearCut: Number(t.rear),
    splash: t.splash,
    hooks: t.targets,
    balePierce: t.pierce,
    baleWidth: t.baleRadius,
    baleLaneClearance: -t.baleRadius,
    strawBurst: t.burst,
    groundShock: t.shockwave,
    crowdPull: t.pull,
    herding: t.wind,
    vortex: Number(t.vortex),
    slowing: Number(t.slow),
    armorStripping: Number(t.acid),
    layerRemoval: Number(t.demolish),
    carrierMagnet: Number(t.magnet),
    retarget: 60 / (v.upgrades.speed >= 3 ? 8 : 12),
    trafficRecovery: v.upgrades.traction >= 4 ? 2 : 1,
  };
  for (const terrain of [0.4, 0.6, 0.75, 0.9, 1]) {
    profile[`move:${terrain}`] = s.speed * terrainSpeedFactor(v, terrain);
    profile[`handling:${terrain}`] = terrainSpeedFactor(v, terrain);
    profile[`pivotRate:${terrain}`] = tracked
      ? (v.kind === 'crane' ? 1.6 : 2.2) * terrainSpeedFactor(v, terrain)
      : 0;
  }
  // Every coverage boundary appears on both sides, including targeting tolerance.
  for (const height of [
    0, 0.8, 1.34, 1.36, 1.7, 1.71, 2.2, 2.21, 2.84, 2.86, 3.2, 3.21, 4.2, 4.21, 5.2, 5.21, 6, 12.2,
    12.21, 14,
  ])
    for (const armor of [false, true]) {
      const damage = canTargetBalloon(v, height, armor)
        ? s.damage * (armor ? armorDamageFactor(v) : 1)
        : 0;
      const key = `${height}:${armor ? 'armor' : 'plain'}`;
      profile[`hit:${key}`] = damage;
      // Both cold starts and a sustained pop chain matter. Permanent overdrive
      // has a benefit even where a cheaper tier-4 tool matches it after a kill.
      for (const warm of [false, true]) {
        const boosted = v.upgrades.speed === 5 || (warm && v.upgrades.speed >= 4);
        profile[`dps:${key}:${warm}`] = (damage * 60) / toolIntervalTicks(v, boosted);
        // HP breakpoints prevent raw DPS from hiding one-shot vs. two-shot tools.
        for (const hp of [1, 2, 4, 6, 12])
          profile[`pops:${key}:${warm}:${hp}`] =
            damage > 0 ? 60 / (toolIntervalTicks(v, boosted) * Math.ceil(hp / damage)) : 0;
      }
    }
  // Abilities remain separate: Downburst can lower armored balloons even when
  // the blower cannot damage them. Do not count that as independent coverage.
  const unlocked = v.upgrades.unique >= 3;
  profile.throttleSeconds = v.kind === 'harvester' && unlocked ? 3 : 0;
  profile.stickyCloudSeconds = v.kind === 'sprayer' && unlocked ? 6 : 0;
  profile.armorBypassingSlam = v.kind === 'excavator' && unlocked ? 3 : 0;
  profile.singleTargetYank = v.kind === 'crane' && unlocked ? 1 : 0;
  profile.barrageShots = v.kind === 'baler' && unlocked ? 3 : 0;
  profile.groupDownburstSeconds = v.kind === 'blower' && unlocked ? 5 : 0;
  profile.bladeSweep = v.kind === 'bulldozer' && unlocked ? 3 : 0;
  profile.slabDrop = v.kind === 'mixer' && unlocked ? 2.5 : 0;
  return profile;
}

export function dominates(a: Record<string, number>, b: Record<string, number>) {
  let better = false;
  for (const key of Object.keys(b)) {
    if (a[key] + 1e-9 < b[key]) return false;
    if (a[key] > b[key] + 1e-9) better = true;
  }
  return better;
}

export function frontierAudit(mode: Mode) {
  const builds = legalBuilds();
  const profiles = builds.map((v) => ({
    affordability: -buildCost(v, mode),
    ...capabilityProfile(v),
  }));
  const dominated = builds.flatMap((v, i) => {
    const by = profiles.findIndex((profile, j) => j !== i && dominates(profile, profiles[i]));
    return by < 0
      ? []
      : [
          {
            build: buildLabel(v),
            cost: buildCost(v, mode),
            by: buildLabel(builds[by]),
            byCost: buildCost(builds[by], mode),
          },
        ];
  });
  const deadUpgrades = builds.flatMap((v, i) =>
    PATHS.flatMap((path) => {
      if (!upgradeAllowed(v, path)) return [];
      const next = { ...v, upgrades: { ...v.upgrades, [path]: v.upgrades[path] + 1 } };
      const nextProfile = capabilityProfile(next);
      return Object.keys(nextProfile).some((key) => nextProfile[key] > profiles[i][key] + 1e-9)
        ? []
        : [`${buildLabel(v)} → ${path}:${next.upgrades[path]}`];
    }),
  );
  return {
    mode,
    builds: builds.length,
    frontier: builds.length - dominated.length,
    dominated,
    deadUpgrades,
  };
}
