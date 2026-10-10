export type VehicleKind =
  'harvester' | 'sprayer' | 'excavator' | 'crane' | 'baler' | 'blower' | 'bulldozer' | 'mixer';
export type BalloonKind = 'basic' | 'layered' | 'armored' | 'high' | 'carrier';
export type Mode = 'easy' | 'medium' | 'hard';
export type ArenaKind = 'barn' | 'yard';
export type TargetMode = 'Nearest' | 'Strongest' | 'Highest' | 'Oldest' | 'Most lives';
export type PathName = 'attack' | 'speed' | 'traction' | 'unique';
export type AbilityKind = 'gust' | 'boost' | 'pitchfork';
export const MODES = {
  easy: {
    lives: 150,
    rounds: 20,
    multiplier: 0.85,
    description: 'Forgiving waves',
    crowd: 1,
    packScale: 1,
    spawnScale: 1,
    drift: 1,
    toughGrowth: 0,
    flee: { start: 15, chance: 0.12 },
    regen: { start: 18, chance: 0.06 },
    armor: { start: 35, chance: 0.1 },
    clearBonus: 100,
  },
  medium: {
    lives: 100,
    rounds: 40,
    multiplier: 1,
    description: 'Build a balanced fleet',
    crowd: 1.15,
    packScale: 1.15,
    spawnScale: 0.9,
    drift: 1.1,
    toughGrowth: 0.01,
    flee: { start: 12, chance: 0.18 },
    regen: { start: 16, chance: 0.1 },
    armor: { start: 30, chance: 0.15 },
    clearBonus: 85,
  },
  hard: {
    lives: 50,
    rounds: 60,
    multiplier: 1.08,
    description: 'Upgrade and use abilities',
    crowd: 1.35,
    packScale: 1.35,
    spawnScale: 0.78,
    drift: 1.2,
    toughGrowth: 0.018,
    flee: { start: 10, chance: 0.24 },
    regen: { start: 14, chance: 0.16 },
    armor: { start: 22, chance: 0.22 },
    clearBonus: 70,
  },
};
export const VEHICLES = {
  harvester: {
    name: 'Combine harvester',
    short: 'Harvester',
    role: 'Ground-level swarm control',
    cost: 400,
    color: '#e84332',
    speed: 7.8,
    traction: 0.5,
    min: 0,
    max: 1.5,
    range: 2.2,
    damage: 1,
    interval: 0.17,
    footprint: [2, 3],
    unique: 'Header',
    tool: 'CUT',
    description: 'Cuts low balloons. Cannot damage armor without upgrades.',
  },
  sprayer: {
    name: 'Crop sprayer',
    short: 'Sprayer',
    role: 'Mid-height crowd control',
    cost: 450,
    color: '#65ae3a',
    speed: 8.8,
    traction: 0.3,
    min: 0,
    max: 4,
    range: 5,
    damage: 1,
    interval: 0.34,
    footprint: [2, 2],
    unique: 'Chemicals',
    tool: 'SPRAY',
    description: 'Hits balloons in a cone. Chemicals upgrades add slowing and armor damage.',
  },
  excavator: {
    name: 'Excavator',
    short: 'Excavator',
    role: 'Armor breaker',
    cost: 550,
    color: '#ffba20',
    speed: 5.2,
    traction: 0.8,
    min: 0,
    max: 5,
    range: 5,
    damage: 4,
    interval: 0.52,
    footprint: [2, 2],
    unique: 'Hydraulics',
    tool: 'CRUSH',
    description: 'Deals full damage to armor. Hydraulics upgrades add splash damage.',
  },
  crane: {
    name: 'Mobile crane',
    short: 'Crane',
    role: 'High-altitude specialist',
    cost: 700,
    color: '#ff852c',
    speed: 4.6,
    traction: 0.6,
    min: 3,
    max: 12,
    range: 6,
    damage: 3,
    interval: 0.46,
    footprint: [2, 3],
    unique: 'Boom',
    tool: 'PIERCE',
    description: 'Reaches high balloons; cannot hit below 3 m. Boom upgrades add splash damage.',
  },
  baler: {
    name: 'Hay baler',
    short: 'Baler',
    role: 'Piercing ranged damage',
    cost: 500,
    color: '#bb73dc',
    speed: 6.8,
    traction: 0.55,
    min: 0,
    max: 4,
    range: 7,
    damage: 2,
    interval: 0.75,
    footprint: [2, 3],
    unique: 'Bale Press',
    tool: 'BALE',
    description: 'Launches travelling bales through lined-up balloons. Weak against armor.',
  },
  blower: {
    name: 'Blower truck',
    short: 'Blower',
    role: 'Balloon herding & support',
    cost: 600,
    color: '#39b8c9',
    speed: 7.2,
    traction: 0.45,
    min: 1.5,
    max: 12,
    range: 6,
    damage: 0.5,
    interval: 0.4,
    footprint: [2, 2],
    unique: 'Airflow',
    tool: 'GUST',
    description: 'Air bursts herd packs toward teammates. Cannot damage armor without upgrades.',
  },
  bulldozer: {
    name: 'Bulldozer',
    short: 'Dozer',
    role: 'Armored ground swarms',
    cost: 575,
    color: '#edaa29',
    speed: 5.8,
    traction: 0.75,
    min: 0,
    max: 1.8,
    range: 2.8,
    damage: 1.5,
    interval: 0.35,
    footprint: [2, 3],
    unique: 'Blade',
    tool: 'PLOW',
    description:
      'Sweeps low packs with a broad blade. Deals 75% damage to armor, but has short reach.',
  },
  mixer: {
    name: 'Concrete mixer',
    short: 'Mixer',
    role: 'Mid-height area damage',
    cost: 675,
    color: '#f29a51',
    speed: 6.2,
    traction: 0.55,
    min: 0,
    max: 5,
    range: 7,
    damage: 2,
    interval: 0.9,
    footprint: [2, 3],
    unique: 'Drum',
    tool: 'SPLAT',
    description: 'Lobs concrete into a small area. Slow firing and half damage to armor.',
  },
} satisfies Record<
  VehicleKind,
  {
    name: string;
    short: string;
    role: string;
    cost: number;
    color: string;
    speed: number;
    traction: number;
    min: number;
    max: number;
    range: number;
    damage: number;
    interval: number;
    footprint: number[];
    unique: string;
    tool: string;
    description: string;
  }
>;
export const BALLOONS = {
  basic: { name: 'Basic', hp: 1, radius: 0.4, color: '#fa3b46', lives: 1, cash: 1, speed: 0.95 },
  layered: { name: 'Layered', hp: 1, radius: 0.6, color: '#9753ed', lives: 2, cash: 1, speed: 0.8 },
  armored: {
    name: 'Armored',
    hp: 6,
    radius: 0.7,
    color: '#5d718d',
    lives: 3,
    cash: 4,
    speed: 0.32,
  },
  high: {
    name: 'High-flyer',
    hp: 2,
    radius: 0.4,
    color: '#20bdf2',
    lives: 2,
    cash: 3,
    speed: 0.75,
  },
  carrier: {
    name: 'Hay carrier',
    hp: 4,
    radius: 0.9,
    color: '#ffc52b',
    lives: 5,
    cash: 5,
    speed: 0.5,
  },
};
export const LAYER_COLORS = ['#ffd339', '#73cf44', '#3e99f5', '#9753ed'];
export const TARGETS: TargetMode[] = ['Nearest', 'Strongest', 'Highest', 'Oldest', 'Most lives'];
export const PATHS: PathName[] = ['attack', 'speed', 'traction', 'unique'];
// Mobility and terrain upgrades compete with buying another tool. Price them
// for their utility, rather than charging a damage-capstone price for grip.
export const PATH_COSTS: Record<PathName, number[]> = {
  attack: [0.3, 0.5, 0.9, 2, 4],
  speed: [0.2, 0.35, 0.7, 1.4, 2.5],
  traction: [0.15, 0.25, 0.5, 0.9, 1.6],
  unique: [0.3, 0.5, 1.2, 2.4, 4.5],
};
export function upgradePrice(
  run: Run,
  v: OwnedVehicle,
  path: PathName,
  tier = v.upgrades[path] + 1,
) {
  return price(run, VEHICLES[v.kind].cost * PATH_COSTS[path][tier - 1]);
}
export const SHARED_EFFECTS = {
  attack: [
    '25% more damage',
    '20% faster attacks',
    'Ignores half of armor',
    'Double damage',
    'Signature tool transformation',
  ],
  speed: [
    '15% faster movement',
    '15% faster tool',
    '30% faster movement',
    '5 s overdrive after a pop',
    'Permanent overdrive + 15% drive speed',
  ],
  traction: [
    '+0.1 traction',
    '+0.1 traction',
    '+0.2 mud/rough grip; pushes hay',
    'Faster traffic recovery',
    'Full grip + 20% drive speed',
  ],
};
export const UNIQUE_EFFECTS: Record<VehicleKind, string[]> = {
  baler: [
    'Shots reach 9 m',
    'Pierces 8 balloons',
    'Faster press + Bale Barrage',
    'Wide bales pierce 12 balloons',
    'Straw-burst mega bales',
  ],
  blower: [
    'Air reaches 7 m',
    'Wider gust cone',
    'Stronger push + Downburst',
    '9 m air range + 14 m height',
    'Gathering vortex',
  ],
  harvester: [
    'Wider header',
    'Reaches 2 m',
    'Rear header + Full throttle',
    'Raised header reaches 3 m',
    'Thresher pulls balloons in',
  ],
  sprayer: [
    'Spray reaches 6 m',
    '60° spray cone',
    'Sticky spray + Sticky cloud',
    'Acid strips armor',
    '360° fog cannon',
  ],
  excavator: [
    'Arm reaches 6 m',
    'Splash damage within 1 m',
    'Arm reaches 7 m + Ground slam',
    'Ground shockwave',
    'Demolisher removes every layer',
  ],
  crane: [
    '+2 m boom reach',
    'Faster hook swing',
    'Wrecking ball + Hook yank',
    'Magnet slows and lowers carriers',
    'Mobile tower: 2 splash hooks',
  ],
  bulldozer: [
    'Blade reaches 3.3 m',
    'Wider blade sweep',
    'Sticky rubble + Blade sweep; crushes hay',
    'Raised blade reaches 2.8 m high',
    'Wide 4 m demolition blade',
  ],
  mixer: [
    'Concrete reaches 8 m',
    'Splash grows to 1.75 m',
    'Wet concrete + Slab drop',
    'Reinforced mix damages armor fully',
    'Splash grows to 2.5 m',
  ],
};
export const VEHICLE_ABILITIES: Record<VehicleKind, { name: string; cooldown: number }> = {
  harvester: { name: 'Full throttle', cooldown: 24 },
  sprayer: { name: 'Sticky cloud', cooldown: 30 },
  excavator: { name: 'Ground slam', cooldown: 36 },
  crane: { name: 'Hook yank', cooldown: 28 },
  baler: { name: 'Bale Barrage', cooldown: 26 },
  blower: { name: 'Downburst', cooldown: 30 },
  bulldozer: { name: 'Blade sweep', cooldown: 30 },
  mixer: { name: 'Slab drop', cooldown: 34 },
};
export const ABILITIES = {
  gust: {
    name: 'Gust of wind',
    price: 200,
    cooldown: 30,
    description: 'Drag across the arena to push balloons. Pulls high-flyers down 3 m.',
  },
  boost: {
    name: 'Emergency boost',
    price: 300,
    cooldown: 40,
    description: 'Click a vehicle to double its movement and tool speed for 8 s.',
  },
  pitchfork: {
    name: 'Pitchfork',
    price: 450,
    cooldown: 45,
    description: 'Click the arena to deal 3 damage in a 1.5 m radius.',
  },
};
export interface OwnedVehicle {
  id: number;
  kind: VehicleKind;
  upgrades: Record<PathName, number>;
  spent: number;
  placed: boolean;
  x: number;
  z: number;
  rotation: number;
  targeting: TargetMode;
}
export interface Run {
  version: 1;
  mode: Mode;
  arena: ArenaKind;
  round: number;
  cash: number;
  lives: number;
  seed: number;
  fleet: OwnedVehicle[];
  abilities: Partial<Record<AbilityKind, number>>;
  freeplay: boolean;
  nextId: number;
}
export function newRun(mode: Mode = 'easy', arena: ArenaKind = 'barn'): Run {
  return {
    version: 1,
    mode,
    arena,
    round: 1,
    cash: 650,
    lives: MODES[mode].lives,
    seed: 73429,
    fleet: [],
    abilities: {},
    freeplay: false,
    nextId: 1,
  };
}
export function price(run: Run, value: number) {
  return Math.round(value * MODES[run.mode].multiplier);
}
export function upgradeAllowed(v: OwnedVehicle, path: PathName) {
  const used = PATHS.filter((p) => v.upgrades[p] > 0);
  return (
    v.upgrades[path] < 5 &&
    !(used.length >= 2 && !used.includes(path)) &&
    !(PATHS.some((p) => p !== path && v.upgrades[p] >= 3) && v.upgrades[path] >= 2)
  );
}
export interface Obstacle {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  kind: 'hay' | 'stall' | 'pile' | 'platform';
  // Loose bales are round terrain; stacked scenery remains fixed.
  loose?: boolean;
  id?: number;
  integrity?: number;
}
export interface Arena {
  kind: ArenaKind;
  width: number;
  depth: number;
  ceiling: number;
  obstacles: Obstacle[];
  // Optional for older fixtures/saves; surfaces are regenerated from the round seed.
  surfaces?: SurfacePatch[];
}
export interface SurfacePatch {
  kind: 'oil' | 'rough';
  x: number;
  z: number;
  w: number;
  d: number;
}
export const SURFACE_GRIP = { oil: 0.18, rough: 0.32 } as const;
export function arenaFor(kind: ArenaKind, round = 1, seed = 73429): Arena {
  const arena: Arena =
    kind === 'barn'
      ? {
          kind,
          width: 48,
          depth: 36,
          ceiling: 9,
          obstacles: [
            { x: 3, z: 4, w: 3, d: 2, h: 1.5, kind: 'hay' },
            { x: 3, z: 11, w: 3, d: 2, h: 2, kind: 'hay' },
            { x: 3, z: 21, w: 3, d: 2, h: 2, kind: 'hay' },
            { x: 3, z: 29, w: 3, d: 2, h: 2, kind: 'hay' },
            { x: 45, z: 6, w: 3, d: 3, h: 1.5, kind: 'hay' },
            { x: 45, z: 29, w: 3, d: 3, h: 2, kind: 'hay' },
            { x: 16, z: 31, w: 5, d: 2, h: 2, kind: 'stall' },
            { x: 34, z: 31, w: 4, d: 2, h: 1.5, kind: 'hay' },
          ],
        }
      : {
          kind,
          width: 64,
          depth: 48,
          ceiling: 14,
          obstacles: [
            { x: 5, z: 6, w: 4, d: 3, h: 1.4, kind: 'pile' },
            { x: 58, z: 7, w: 4, d: 3, h: 2, kind: 'pile' },
            { x: 58, z: 39, w: 4, d: 4, h: 2, kind: 'platform' },
            { x: 6, z: 40, w: 3, d: 3, h: 1.5, kind: 'pile' },
            { x: 33, z: 7, w: 4, d: 3, h: 1.2, kind: 'platform' },
            { x: 38, z: 40, w: 5, d: 2, h: 1.5, kind: 'pile' },
          ],
        };
  // A clear opening, then alternating clear and hay rounds. Keep both gates open.
  if (round >= 4 && (round - 4) % 3 === 0) {
    const rng = new Random(seed + round * 271 + (kind === 'yard' ? 811 : 0));
    const count = Math.min(8, 4 + Math.floor(round / 12));
    for (let i = 0; i < count; i++) {
      const x = arena.width * (0.22 + (i % 3) * 0.26) + (rng.next() - 0.5) * 2;
      const z = arena.depth * (0.4 + Math.floor(i / 3) * 0.18) + (rng.next() - 0.5) * 2;
      arena.obstacles.push({
        x,
        z,
        w: 1.4,
        d: 1,
        h: 0.9,
        kind: 'hay',
        loose: true,
        id: -i - 1,
        integrity: 1,
      });
    }
  }
  // Teach rough ground before oil. Rounds ending in 1, 4, 6, and 9 stay surface-free;
  // later mixed rounds ask players to balance routing, handling, and firepower.
  const rough = round >= 5 && round % 5 === 0;
  const oil = round >= 7 && round % 5 === 2;
  const mixed = round >= 12 && round % 5 === 3;
  arena.surfaces = [];
  if (rough || oil || mixed) {
    const rng = new Random(seed + round * 547 + (kind === 'yard' ? 1297 : 0));
    const count = mixed ? 4 : 3;
    for (let i = 0; i < count; i++) {
      arena.surfaces.push({
        kind: mixed ? (i % 2 ? 'oil' : 'rough') : oil ? 'oil' : 'rough',
        x: arena.width * (0.27 + (i % 2) * 0.43) + (rng.next() - 0.5) * 2,
        z: arena.depth * (0.36 + Math.floor(i / 2) * 0.27) + (rng.next() - 0.5) * 2,
        w: 6 + rng.next() * 2,
        d: 4 + rng.next() * 2,
      });
    }
  }
  return arena;
}
export function blocked(a: Arena, x: number, z: number) {
  return (
    x < 1 ||
    z < 1 ||
    x >= a.width - 1 ||
    z >= a.depth - 1 ||
    a.obstacles.some(
      (o) => Math.abs(x + 0.5 - o.x) < o.w / 2 + 0.45 && Math.abs(z + 0.5 - o.z) < o.d / 2 + 0.45,
    )
  );
}
export function grip(a: Arena, x: number, z: number) {
  let surface = 1;
  for (const p of a.surfaces ?? [])
    if (Math.abs(x - p.x) <= p.w / 2 && Math.abs(z - p.z) <= p.d / 2)
      surface = Math.min(surface, SURFACE_GRIP[p.kind]);
  if (surface < 1) return surface;
  if (a.kind === 'barn')
    return z > a.depth - 6 ? 0.6 : x > a.width * 0.34 && x < a.width * 0.57 && z < 5 ? 0.4 : 0.9;
  return x > a.width * 0.38 && x < a.width * 0.62 && z > a.depth * 0.58 ? 0.4 : z < 9 ? 1 : 0.75;
}
export function vehicleRadius(v: Pick<OwnedVehicle, 'kind'>) {
  return v.kind === 'harvester' ||
    v.kind === 'crane' ||
    v.kind === 'baler' ||
    v.kind === 'bulldozer' ||
    v.kind === 'mixer'
    ? 1.12
    : 0.95;
}
export function clearPosition(a: Arena, x: number, z: number, radius: number) {
  if (
    x < radius + 0.1 ||
    z < radius + 0.1 ||
    x > a.width - radius - 0.1 ||
    z > a.depth - radius - 0.1
  )
    return false;
  return !a.obstacles.some((o) => {
    const dx = Math.max(0, Math.abs(x - o.x) - o.w / 2);
    const dz = Math.max(0, Math.abs(z - o.z) - o.d / 2);
    return Math.hypot(dx, dz) < radius + 0.08;
  });
}
export function footprint(v: OwnedVehicle) {
  const [w, d] = VEHICLES[v.kind].footprint;
  return Math.round(v.rotation / (Math.PI / 2)) % 2 ? [d, w] : [w, d];
}
export function canPlace(
  a: Arena,
  fleet: OwnedVehicle[],
  vehicle: OwnedVehicle,
  x: number,
  z: number,
) {
  const [w, d] = footprint(vehicle);
  const cx = x + w / 2,
    cz = z + d / 2;
  if (!clearPosition(a, cx, cz, vehicleRadius(vehicle))) return false;
  if (
    fleet.some((v) => {
      if (!v.placed || v.id === vehicle.id) return false;
      const [vw, vd] = footprint(v);
      return (
        Math.hypot(cx - v.x - vw / 2, cz - v.z - vd / 2) <
        vehicleRadius(v) + vehicleRadius(vehicle) + 0.04
      );
    })
  )
    return false;
  for (let xx = x; xx < x + w; xx++)
    for (let zz = z; zz < z + d; zz++) {
      if (blocked(a, xx, zz)) return false;
      if (
        fleet.some((v) => {
          if (v.id === vehicle.id || !v.placed) return false;
          const [vw, vd] = footprint(v);
          return xx >= v.x && xx < v.x + vw && zz >= v.z && zz < v.z + vd;
        })
      )
        return false;
    }
  return true;
}
// Keep existing deployments where possible when loading an older arena layout.
export function fitFleet(a: Arena, fleet: OwnedVehicle[]) {
  const fitted: OwnedVehicle[] = [];
  for (const owned of fleet) {
    const v = { ...owned };
    if (v.placed && !canPlace(a, fitted, v, v.x, v.z)) {
      const cells: [number, number][] = [];
      for (let z = 1; z < a.depth - 1; z++)
        for (let x = 1; x < a.width - 1; x++) cells.push([x, z]);
      cells.sort((p, q) => Math.hypot(p[0] - v.x, p[1] - v.z) - Math.hypot(q[0] - v.x, q[1] - v.z));
      const next = cells.find(([x, z]) => canPlace(a, fitted, v, x, z));
      if (next) [v.x, v.z] = next;
      else v.placed = false;
    }
    fitted.push(v);
  }
  return fitted;
}
export class Random {
  constructor(public state: number) {}
  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
const SCRIPTS: [BalloonKind, number][][] = [
  [['basic', 14]],
  [['basic', 22]],
  [['basic', 30]],
  [
    ['basic', 22],
    ['layered', 6],
  ],
  [
    ['basic', 26],
    ['layered', 10],
  ],
  [
    ['basic', 25],
    ['armored', 5],
  ],
  [
    ['layered', 14],
    ['armored', 8],
  ],
  [
    ['basic', 30],
    ['high', 8],
  ],
  [
    ['layered', 18],
    ['high', 12],
  ],
  [
    ['basic', 24],
    ['armored', 10],
    ['carrier', 4],
  ],
  [
    ['layered', 20],
    ['high', 10],
    ['carrier', 6],
  ],
  [
    ['basic', 36],
    ['layered', 16],
    ['armored', 12],
  ],
  [
    ['layered', 25],
    ['armored', 12],
    ['high', 15],
  ],
  [
    ['basic', 30],
    ['layered', 20],
    ['carrier', 8],
  ],
  [
    ['layered', 30],
    ['high', 18],
    ['armored', 12],
  ],
  [
    ['basic', 40],
    ['layered', 26],
    ['carrier', 10],
  ],
  [
    ['armored', 20],
    ['high', 22],
    ['layered', 30],
  ],
  [
    ['basic', 45],
    ['layered', 32],
    ['carrier', 12],
  ],
  [
    ['layered', 36],
    ['armored', 22],
    ['high', 24],
  ],
  [
    ['basic', 40],
    ['layered', 36],
    ['armored', 20],
    ['high', 22],
    ['carrier', 12],
  ],
];
export interface Spawn {
  tick: number;
  gate?: 0 | 1;
  lane?: number;
  kind: BalloonKind;
  layer: number;
  fleeing: boolean;
  regen: boolean;
  armor: boolean;
}
export function waveFor(round: number, seed: number, mode: Mode = 'easy'): Spawn[] {
  const rng = new Random(seed + round * 919);
  const difficulty = MODES[mode];
  const entries =
    round <= 20
      ? SCRIPTS[round - 1]
      : (['basic', 'layered', 'armored', 'high', 'carrier'] as BalloonKind[]).map(
          (k, i) =>
            [k, Math.floor((18 + round * 1.5) * [1.2, 0.8, 0.45, 0.45, 0.18][i])] as [
              BalloonKind,
              number,
            ],
        );
  const kinds = entries.flatMap(([k, n]) =>
    Array<BalloonKind>(Math.ceil((round === 1 ? 30 : Math.ceil(n * 1.8)) * difficulty.crowd)).fill(
      k,
    ),
  );
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  // Packs create bursts of combat with a short breathing space between entrances.
  const packSize = Math.round((round < 6 ? 10 : round < 15 ? 13 : 16) * difficulty.packScale);
  const packs = Math.ceil(kinds.length / packSize);
  const duration = Math.min(11, 4.2 + round * 0.17) * difficulty.spawnScale;
  const lanes = Array.from({ length: packs }, () =>
    round === 1 ? 0.18 + rng.next() * 0.08 : 0.35 + rng.next() * 0.3,
  );
  return kinds
    .map((kind, i) => {
      const pack = Math.floor(i / packSize),
        slot = i % packSize;
      return {
        tick: Math.floor(((pack / Math.max(1, packs - 1)) * duration + slot * 0.04) * 60),
        gate: (round === 1 ? 0 : pack % 2) as 0 | 1,
        lane: lanes[pack] + (slot - (packSize - 1) / 2) * 0.02,
        kind,
        layer: kind === 'layered' ? Math.min(4, 2 + Math.floor(round / 10)) : 1,
        fleeing: round >= difficulty.flee.start && rng.next() < difficulty.flee.chance,
        regen: round >= difficulty.regen.start && rng.next() < difficulty.regen.chance,
        armor:
          round >= difficulty.armor.start &&
          kind !== 'armored' &&
          rng.next() < difficulty.armor.chance,
      };
    })
    .sort((a, b) => a.tick - b.tick);
}
export function waveTypes(round: number, seed: number, mode: Mode = 'easy') {
  return [...new Set(waveFor(round, seed, mode).map((s) => s.kind))];
}

// Initial flight bands, shared by spawning and the player's wave forecast.
export function balloonHeightRange(
  kind: BalloonKind,
  round: number,
  arena: Arena,
): [number, number] {
  if (kind === 'high') return [6, Math.min(arena.ceiling - 0.6, VEHICLES.crane.max - 0.2)];
  if (kind === 'armored') return [0.7, 0.7];
  if (kind === 'carrier') return [2.5, 3.5];
  return [0.6, round <= 3 ? 1.2 : 2.8];
}
