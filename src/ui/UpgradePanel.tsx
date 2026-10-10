import { useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  Check,
  CircleGauge,
  Crosshair,
  Droplets,
  Gauge,
  Lock,
  Magnet,
  MoveUpRight,
  Radar,
  Scissors,
  Shield,
  Sparkles,
  Target,
  Tractor,
  Waves,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  PATHS,
  SHARED_EFFECTS,
  upgradePrice,
  UNIQUE_EFFECTS,
  VEHICLES,
  upgradeAllowed,
  type OwnedVehicle,
  type PathName,
  type Run,
  type VehicleKind,
} from '../sim/data';
import { UPGRADE_DIRECTIONS } from './vehicle-guide';

const PATH_INFO = {
  attack: {
    name: 'Attack',
    icon: Crosshair,
    color: '#f4a47e',
    description: 'Hit harder and break through armor.',
  },
  speed: {
    name: 'Speed',
    icon: Gauge,
    color: '#f6d779',
    description: 'Chase faster and shorten tool downtime.',
  },
  traction: {
    name: 'Traction',
    icon: Tractor,
    color: '#b9d693',
    description: 'Control oil, rough ground, mud and traffic.',
  },
  unique: {
    name: 'Specialist',
    icon: Wrench,
    color: '#96d6dc',
    description: 'Evolve your tool and unlock a vehicle ability.',
  },
};
const SHARED_ICONS: Record<Exclude<PathName, 'unique'>, LucideIcon[]> = {
  attack: [Target, Gauge, Shield, Crosshair, Sparkles],
  speed: [MoveUpRight, CircleGauge, MoveUpRight, Zap, Zap],
  traction: [Tractor, Tractor, Waves, ArrowRight, Shield],
};
const UNIQUE_ICONS: Record<VehicleKind, LucideIcon[]> = {
  baler: [MoveUpRight, ArrowRight, Zap, Shield, Sparkles],
  blower: [MoveUpRight, Radar, Waves, MoveUpRight, Magnet],
  harvester: [Scissors, MoveUpRight, Zap, MoveUpRight, Magnet],
  sprayer: [Droplets, Radar, Waves, Shield, Radar],
  excavator: [MoveUpRight, Waves, Zap, Waves, Sparkles],
  crane: [MoveUpRight, Gauge, Waves, Magnet, Radar],
  bulldozer: [MoveUpRight, Radar, Waves, MoveUpRight, Shield],
  mixer: [MoveUpRight, Waves, Droplets, Shield, Radar],
};
const UNIQUE_DETAILS: Record<VehicleKind, string[]> = {
  baler: [
    'Extends horizontal shot range from 7 m to 9 m. Height coverage stays at 0–4 m.',
    'Each travelling bale can hit 8 balloons instead of 4. Each balloon is hit once per bale.',
    'Runs the press 25% faster. Unlocks Bale Barrage: three piercing shots in a widening fan (26 s cooldown).',
    'Wider bales catch scattered targets and pierce up to 12 balloons per shot.',
    'Bales burst into straw at their endpoint, dealing half shot damage within a 2 m sphere. Obstacles stop bales.',
  ],
  blower: [
    'Extends horizontal air range from 6 m to 7 m. Height coverage stays at 1.5–12 m.',
    'Widens the gust cone from 40° to 72° to herd and damage more balloons.',
    'Strengthens herding wind. Unlocks Downburst: lowers nearby balloons to 1.2 m for 5 seconds, including armored balloons (30 s cooldown).',
    'Extends horizontal air range from 7 m to 9 m and raises height coverage from 12 m to 14 m. Wider reach helps herding and Downburst even below the ceiling.',
    'Each gust first gathers balloons into a pack, then releases them toward a teammate. Pair with a baler for piercing shots.',
  ],
  harvester: [
    'Adds 0.5 m of horizontal range to catch more low balloons in each sweep.',
    'Raises the cutting height from 1.5 m to 2 m.',
    'Cuts behind the chassis too. Unlocks Full throttle: 3 seconds of double movement speed and damage, aimed at a dense crowd (24 s cooldown).',
    'Raises the cutting height to 3 m, covering more mid-height balloons.',
    'Pulls balloons within 4 m toward the header so crowds stay in cutting range.',
  ],
  sprayer: [
    'Extends horizontal spray range from 5 m to 6 m. Height coverage stays at 0–4 m.',
    'Widens the spray cone from 40° to 60° to catch more balloons per attack.',
    'Hits slow balloons for 3 seconds. Unlocks Sticky cloud: a 6-second slowing cloud around the sprayer (30 s cooldown).',
    'Deals full damage to armored balloons and removes their armor after 3 acid hits.',
    'Sprays in every direction, hitting all eligible balloons within range.',
  ],
  excavator: [
    'Extends horizontal arm range from 5 m to 6 m. Height coverage stays at 0–5 m.',
    'Each strike also hits eligible balloons within 1 m of the target.',
    'Extends horizontal range to 7 m. Unlocks Ground slam: 3 damage that bypasses armor within 4 m, below 2 m high (36 s cooldown).',
    'Each attack also damages balloons below 1 m high within 3 m of the chassis.',
    "Destroys all remaining layers at once, preventing child balloons. Earns only the outer pop's cash and Pop Rush charge.",
  ],
  crane: [
    'Extends horizontal boom range from 6 m to 8 m. Height coverage stays at 3–12 m.',
    'Swings the hook 25% faster for more frequent attacks.',
    'Adds splash damage within 1.5 m of the target. Unlocks Hook yank: lowers a nearby balloon to 2 m for 5 seconds, letting low tools help (28 s cooldown).',
    'Slows carriers within boom reach by 60% and lowers those above 3 m to 3 m, where raised harvester headers can help. Lower carriers stay low; the crane can still hit those at 3 m.',
    'Reaches 12 m horizontally and 14 m high. Two hooks each retain wrecking-ball splash; overlapping blasts hit each balloon once. Travels at half speed with the tower fitted.',
  ],
  bulldozer: [
    'Extends horizontal blade range from 2.8 m to 3.3 m. Height coverage stays at 0–1.8 m.',
    'Widens the front sweep from about 92° to 128° so it catches more low balloons per hit.',
    'Crushes loose hay instead of pushing it. Sweeps slow hit balloons for 2 seconds. Unlocks Blade sweep: an immediate 3-damage front sweep out to 3.8 m (30 s cooldown).',
    'Raises blade height from 1.8 m to 2.8 m, covering more layered and carrier balloons.',
    'Extends horizontal reach to 4 m and widens the sweep to about 155°. Still cannot reach high-flyers.',
  ],
  mixer: [
    'Extends horizontal concrete range from 7 m to 8 m. Height coverage stays at 0–5 m.',
    'Grows splash radius from 1.25 m to 1.75 m, hitting more of a cluster.',
    'Splat slows hit balloons for 2 seconds. Unlocks Slab drop: 2.5 damage within 2.5 m of a nearby eligible target (34 s cooldown).',
    'Reinforced concrete deals full damage to armored balloons instead of half.',
    'Grows splash radius to 2.5 m. Each balloon is damaged once per blast.',
  ],
};
const SIGNATURES: Record<VehicleKind, string> = {
  baler: 'Triples bale damage, stacking with earlier Attack upgrades.',
  blower: 'Triples air-burst damage, stacking with earlier Attack upgrades.',
  harvester: 'Doubles cutting damage again, stacking with earlier Attack upgrades.',
  sprayer: 'Triples spray damage, stacking with earlier Attack upgrades.',
  excavator: 'Triples crushing damage, stacking with earlier Attack upgrades.',
  crane:
    'Adds a second hook: strikes two balloons per swing within boom range. Earlier damage bonuses still apply.',
  bulldozer: 'Triples blade damage, stacking with earlier Attack upgrades.',
  mixer: 'Triples concrete damage, stacking with earlier Attack upgrades.',
};
function detail(kind: VehicleKind, path: PathName, index: number) {
  if (path === 'unique') return UNIQUE_DETAILS[kind][index];
  if (path === 'attack')
    return [
      'Multiplies damage per hit by 1.25. Especially useful against durable targets.',
      'Cuts the time between attacks by 20%, for 25% more attacks per second.',
      kind === 'excavator'
        ? 'Deals 50% bonus damage to armored balloons. Keeps full damage against other balloons.'
        : 'Bypasses half of armor resistance. Tools that could not damage armor can now target it.',
      'Doubles damage per hit, stacking with the tier 1 damage bonus.',
      SIGNATURES[kind],
    ][index];
  if (path === 'speed')
    return [
      'Multiplies movement speed by 1.15 to reach the next target sooner.',
      'Runs the tool 15% faster. This stacks with Attack path improvements.',
      'Adds another 30% movement speed, stacking with tier 1.',
      'Each pop grants 5 seconds of double tool speed. Further pops refresh the timer.',
      'Keeps double tool speed active continuously and adds 15% movement speed. Faster pursuit still helps when every shot already pops a balloon and refreshes tier 4 overdrive.',
    ][index];
  return [
    'Adds 0.1 traction to reduce terrain slowdown and improve route choices. Strengthens hay pushing and speeds up clearing.',
    'Adds another 0.1 traction, up to a maximum grip rating of 1. Strengthens hay pushing and speeds up clearing.',
    'Improves mud and rough-ground grip by 0.2. Oil control stays at the tier 2 level until tier 5. Enables hay pushing on sprayers, cranes and blowers; improves pushing force and clearing speed on other chassis.',
    'Checks blocked routes and requests traffic clearance twice as often. Crushers also clear hay faster.',
    'Restores full control on oil, removes terrain slowdown and adds 20% movement speed. Stronger hay pushing and faster clearing still require contact and room; bales never become passable scenery.',
  ][index];
}

function effectTitle(kind: VehicleKind, path: PathName, index: number) {
  if (path === 'traction' && index === 2) return 'Mud/rough grip + hay handling';
  if (path === 'speed' && index === 3) return '5 s tool overdrive after a pop';
  if (path === 'speed' && index === 4) return 'Permanent overdrive + 15% drive speed';
  if (path === 'attack' && index === 2 && kind === 'excavator') return '50% bonus damage to armor';
  if (path === 'attack' && index === 4 && kind === 'crane') return 'Twin hooks';
  return path === 'unique' ? UNIQUE_EFFECTS[kind][index] : SHARED_EFFECTS[path][index];
}

function UpgradePath({
  run,
  vehicle,
  path,
  onUpgrade,
}: {
  run: Run;
  vehicle: OwnedVehicle;
  path: PathName;
  onUpgrade: (path: PathName) => void;
}) {
  const tier = vehicle.upgrades[path];
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);
  const [focusedTier, setFocusedTier] = useState<number | null>(null);
  const index = hoveredTier ?? focusedTier ?? Math.min(tier, 4);
  const info = PATH_INFO[path];
  const name = path === 'unique' ? VEHICLES[vehicle.kind].unique : info.name;
  const PathIcon = path === 'unique' ? UNIQUE_ICONS[vehicle.kind][0] : info.icon;
  const effectIcons = path === 'unique' ? UNIQUE_ICONS[vehicle.kind] : SHARED_ICONS[path];
  const cost = upgradePrice(run, vehicle, path, index + 1);
  const allowed = upgradeAllowed(vehicle, path);
  const used = PATHS.filter((p) => vehicle.upgrades[p] > 0);
  const purchased = index < tier;
  const next = index === tier && allowed;
  const reason = purchased
    ? 'Installed'
    : !allowed
      ? tier === 5
        ? 'Path complete'
        : !used.includes(path) && used.length >= 2
          ? 'Two paths already chosen'
          : 'Secondary path capped at tier 2'
      : index > tier
        ? `Requires tier ${index} first`
        : cost > run.cash
          ? `Need $${(cost - run.cash).toLocaleString()} more`
          : 'Ready to install';
  return (
    <section
      className={`upgrade-card path-${path} ${!allowed && tier < 5 ? 'path-locked' : ''}`}
      style={{ '--path-color': info.color } as CSSProperties}
      aria-label={`${name} upgrades`}
    >
      <div className="upgrade-card-heading">
        <span className="upgrade-path-emblem">
          <PathIcon size={24} />
        </span>
        <div>
          <h3>{name}</h3>
          <p>{UPGRADE_DIRECTIONS[vehicle.kind][path]}</p>
        </div>
        <span className="upgrade-progress">
          {tier}
          <small>/5</small>
        </span>
      </div>
      <div className="upgrade-tier-rail" aria-label={`${name} tiers`}>
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            className={`${i < tier ? 'installed' : ''} ${i === index ? 'inspected' : ''} ${i === tier && allowed ? 'next-tier' : ''}`}
            aria-label={`Inspect ${name} tier ${i + 1}${i < tier ? ', installed' : ''}`}
            aria-pressed={i === index}
            onMouseEnter={() => setHoveredTier(i)}
            onMouseLeave={() => setHoveredTier(null)}
            onFocus={(event) => {
              if (event.currentTarget.matches(':focus-visible')) setFocusedTier(i);
            }}
            onBlur={() => setFocusedTier(null)}
          >
            {i < tier ? (
              <Check size={15} />
            ) : i > tier || !allowed ? (
              <Lock size={12} />
            ) : (
              <PlusMark />
            )}
            <small>{i + 1}</small>
          </button>
        ))}
      </div>
      <div className="upgrade-effect-stack">
        {/* Overlapping previews reserve the tallest tier at the current width, so
            hover and keyboard inspection cannot resize the card or its neighbors. */}
        {effectIcons.map((EffectIcon, previewIndex) => (
          <div
            key={previewIndex}
            className={`upgrade-effect ${previewIndex === index ? 'is-inspected' : ''}`}
            aria-hidden={previewIndex !== index}
          >
            <div className="upgrade-effect-art" aria-hidden="true">
              <EffectIcon size={30} />
              <span>{String(previewIndex + 1).padStart(2, '0')}</span>
            </div>
            <div>
              <span className="upgrade-tier-label">
                TIER {previewIndex + 1}
                {path === 'unique' && previewIndex === 2 ? ' · ABILITY UNLOCK' : ''}
              </span>
              <h4>{effectTitle(vehicle.kind, path, previewIndex)}</h4>
              <p>{detail(vehicle.kind, path, previewIndex)}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        className={`upgrade-purchase ${purchased ? 'installed' : ''}`}
        disabled={!next || cost > run.cash}
        onClick={() => {
          onUpgrade(path);
          setHoveredTier(null);
          setFocusedTier(null);
        }}
        aria-label={
          next
            ? `Install ${name} tier ${index + 1} for $${cost}`
            : `${name} tier ${index + 1}: ${reason}`
        }
      >
        <span>
          {purchased ? <Check size={14} /> : next ? <Wrench size={14} /> : <Lock size={14} />}
          {next && cost <= run.cash ? 'Install upgrade' : reason}
        </span>
        {!purchased && <strong>${cost.toLocaleString()}</strong>}
      </button>
    </section>
  );
}
function PlusMark() {
  return <span aria-hidden="true">+</span>;
}

export function UpgradePanel({
  run,
  vehicle,
  onUpgrade,
}: {
  run: Run;
  vehicle: OwnedVehicle;
  onUpgrade: (path: PathName) => void;
}) {
  return (
    <>
      <div className="section-label upgrade-label">
        Build your specialist <span>Hover or focus a tier to inspect</span>
      </div>
      <p className="upgrade-rules">
        <Shield size={15} /> Choose two paths. The first to reach tier 3 can grow to tier 5; the
        other stops at tier 2.
      </p>
      <div className="upgrade-cards">
        {PATHS.map((path) => (
          <UpgradePath
            key={`${vehicle.id}-${path}`}
            run={run}
            vehicle={vehicle}
            path={path}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>
    </>
  );
}
