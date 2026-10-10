import { mkdirSync, writeFileSync } from 'node:fs';
import {
  arenaFor,
  SHARED_EFFECTS,
  UNIQUE_EFFECTS,
  PATHS,
  vehicleRadius,
  VEHICLES,
  type Arena,
  type OwnedVehicle,
} from '../src/sim/data';
import { armorDamageFactor, vehicleStats, terrainSpeedFactor } from '../src/sim/capabilities';
import { hayHandling, hayLabel } from '../src/sim/hay';
import { findPath, pathCosts } from '../src/sim/pathfinding';
import { UPGRADE_DIRECTIONS } from '../src/ui/vehicle-guide';
import {
  buildCost,
  buildLabel,
  capabilityProfile,
  frontierAudit,
  legalBuilds,
} from './vehicle-frontier';

// These isolated route probes complement the capability frontier and campaign
// runner. They measure navigation decisions, not win rates or fleet synergy.
function probe(v: OwnedVehicle, scenario: 'clear' | 'hay' | 'pinned' | 'narrow' | 'mud' | 'choke') {
  const a: Arena = {
    kind: scenario === 'mud' ? 'yard' : 'barn',
    width: 24,
    depth: 22,
    ceiling: 9,
    obstacles: [],
  };
  let sx = 10.5,
    sz = 5.5,
    tx = 10.5,
    tz = 16.5;
  if (scenario === 'narrow') {
    a.obstacles.push(
      { x: 8.3, z: 11, w: 2.2, d: 20, h: 3, kind: 'stall' },
      { x: 12.7, z: 11, w: 2.2, d: 20, h: 3, kind: 'stall' },
    );
  } else if (scenario !== 'clear') {
    a.obstacles.push({
      id: -1,
      x: 10.5,
      z: 10.5,
      w: 1.4,
      d: 1,
      h: 0.9,
      kind: 'hay',
      loose: true,
      integrity: 1,
    });
    if (scenario === 'choke')
      a.obstacles.push(
        { x: 4.5, z: 11, w: 9, d: 20, h: 3, kind: 'stall' },
        { x: 18, z: 11, w: 12, d: 20, h: 3, kind: 'stall' },
      );
    if (scenario === 'pinned')
      a.obstacles.push({ x: 10.5, z: 12, w: 1.4, d: 1, h: 3, kind: 'stall' });
    if (scenario === 'mud') {
      sx = tx = 12.5;
      sz = 14.5;
      tz = 19.5;
      a.obstacles[0].x = 12.5;
      a.obstacles[0].z = 17;
    }
  }
  const s = vehicleStats(v),
    radius = vehicleRadius(v);
  const path = findPath(a, sx, sz, tx, tz, s.traction, new Set(), 0, radius, undefined, v);
  const reached = path.at(-1)?.[0] === tx && path.at(-1)?.[1] === tz;
  const costs = pathCosts(a, sx, sz, s.traction, radius, v);
  return {
    reached,
    meters: reached ? path.length : null,
    estimatedCost: reached ? +costs[Math.floor(tz) * a.width + Math.floor(tx)].toFixed(2) : null,
  };
}

const builds = legalBuilds().map((v) => {
  const s = vehicleStats(v),
    h = hayHandling(v),
    u = v.upgrades;
  const pros = [
    `${VEHICLES[v.kind].role}; ${s.range} m reach, ${s.min}–${s.max} m height, ${s.damage.toFixed(2)} damage per hit.`,
  ];
  const cons = [
    v.kind === 'baler'
      ? 'Low travelling projectiles can be stopped by scenery and loose hay.'
      : v.kind === 'bulldozer' || v.kind === 'harvester'
        ? 'Front tool requires chassis alignment; clearing and turning interrupt pursuit.'
        : `Tool interval ${s.interval.toFixed(3)} s; drive speed ${s.speed.toFixed(2)} m/s before terrain. Combat investment competes with mobility or another role.`,
  ];
  for (const path of PATHS)
    if (u[path]) {
      pros.push(
        `${path} ${u[path]}: ${(path === 'unique' ? UNIQUE_EFFECTS[v.kind] : SHARED_EFFECTS[path])[u[path] - 1]}`,
      );
      if (u[path] >= 3)
        cons.push(
          `Primary ${path}: ${UPGRADE_DIRECTIONS[v.kind][path]} Only one other path is available, capped at tier 2.`,
        );
    }
  if (!PATHS.some((p) => u[p]))
    pros.push('Lowest purchase cost for this chassis; preserves cash and all upgrade options.');
  else
    cons.push(
      `Costs $${buildCost(v, 'medium') - VEHICLES[v.kind].cost} above stock; competes with adding another vehicle.`,
    );
  if (h.mode === 'crush') {
    pros.push(
      `Opens blocked hay lanes in ${(1 / h.crushRate).toFixed(2)} s per bale at continuous contact.`,
    );
    cons.push('Stops to clear hay; this delay can lose pursuit time.');
  }
  if (h.mode === 'push') {
    pros.push(`Can reposition hay at up to ${h.pushSpeed.toFixed(2)} m/s.`);
    cons.push(
      'Cannot push against a wall, another bale, or traffic; pushing can obstruct a teammate or firing lane.',
    );
    if (h.force * 0.79 < 0.48)
      cons.push('Stock grip cannot push a bale on deep mud; Traction tier 1 solves this.');
  }
  if (h.mode === 'detour') {
    pros.push(
      v.kind === 'crane'
        ? 'Ranged high-altitude attacks can engage without entering a hay lane.'
        : 'Small chassis and ranged engagement can avoid paying for hay clearance.',
    );
    cons.push(
      'Needs a detour or a clearing teammate; Traction tier 3 is unavailable as a secondary path.',
    );
  }
  if (armorDamageFactor(v) === 0) cons.push('Cannot independently damage armor.');
  else if (armorDamageFactor(v) < 1)
    cons.push(`Only ${Math.round(100 * armorDamageFactor(v))}% damage to armor.`);
  if (s.min > 0.8) cons.push('Cannot cover ground balloons or carrier cargo.');
  if (s.max < 6) cons.push('Cannot cover high-flyers.');
  if (v.kind === 'baler' && u.unique >= 4)
    cons.push(
      'Wide bales need 0.65 m projectile clearance instead of 0.35 m; hay and scenery can block more low shots.',
    );
  if (v.kind === 'crane' && u.unique === 5) cons.push('Tower capstone halves movement speed.');
  if (v.kind === 'excavator' && u.unique === 5)
    cons.push('Layer removal gives up split-pop income and Pop Rush charge.');
  const profile = capabilityProfile(v);
  const marginal = PATHS.filter((p) => u[p] > 0).map((path) => {
    const previous = { ...v, upgrades: { ...u, [path]: u[path] - 1 } };
    const before = capabilityProfile(previous);
    return {
      path,
      tier: u[path],
      extraCost: buildCost(v, 'medium') - buildCost(previous, 'medium'),
      gainCount: Object.keys(profile).filter((k) => profile[k] > before[k] + 1e-9).length,
      gains: [
        ...new Set(
          Object.keys(profile)
            .filter((k) => profile[k] > before[k] + 1e-9)
            .map((k) =>
              k.startsWith('hit:')
                ? 'hit damage / coverage'
                : k.startsWith('dps:')
                  ? 'damage cadence'
                  : k.startsWith('pops:')
                    ? 'HP breakpoint pop cadence'
                    : k.startsWith('move:')
                      ? 'terrain movement'
                      : k.startsWith('handling:')
                        ? 'terrain handling'
                        : k,
            ),
        ),
      ],
      losses: [
        ...new Set(
          Object.keys(profile)
            .filter((k) => profile[k] < before[k] - 1e-9)
            .map((k) => (k.startsWith('move:') ? 'terrain movement' : k)),
        ),
      ],
    };
  });
  return {
    build: buildLabel(v),
    kind: v.kind,
    upgrades: u,
    cost: Object.fromEntries(
      (['easy', 'medium', 'hard'] as const).map((mode) => [mode, buildCost(v, mode)]),
    ),
    hay: hayLabel(v),
    crushSeconds: h.mode === 'crush' ? +(1 / h.crushRate).toFixed(3) : null,
    pushSpeed: h.mode === 'push' ? +h.pushSpeed.toFixed(3) : null,
    radius: vehicleRadius(v),
    mudSpeed: +(s.speed * terrainSpeedFactor(v, 0.4)).toFixed(3),
    pros,
    cons,
    marginal,
    routes: Object.fromEntries(
      (['clear', 'hay', 'pinned', 'narrow', 'mud', 'choke'] as const).map((scenario) => [
        scenario,
        probe(v, scenario),
      ]),
    ),
  };
});
const frontiers = (['easy', 'medium', 'hard'] as const).map(frontierAudit);
const report = {
  buildCount: builds.length,
  frontiers,
  scope:
    'All legal individual builds; capability dominance with cost plus isolated navigation probes. Campaign performance is measured separately; neither audit predicts human win rates.',
  rounds: [1, 4, 7, 10, 13, 16, 19, 22, 25].map((round) => ({
    round,
    barnHay: arenaFor('barn', round).obstacles.filter((o) => o.loose).length,
    yardHay: arenaFor('yard', round).obstacles.filter((o) => o.loose).length,
  })),
  builds,
};
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/hay-build-balance.json', JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    buildCount: builds.length,
    frontiers,
    missingTradeoffs: builds
      .filter((b) => !b.pros.length || !b.cons.length || b.marginal.some((m) => !m.gains.length))
      .map((b) => b.build),
    smallGapReach: builds.filter((b) => b.routes.narrow.reached).length,
  }),
);
if (
  frontiers.some((f) => f.dominated.length || f.deadUpgrades.length) ||
  builds.some((b) => !b.pros.length || !b.cons.length || b.marginal.some((m) => !m.gains.length))
)
  process.exitCode = 1;
