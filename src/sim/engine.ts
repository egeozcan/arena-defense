import RAPIER from '@dimforge/rapier3d-deterministic-compat';
import {
  ABILITIES,
  BALLOONS,
  MODES,
  VEHICLES,
  VEHICLE_ABILITIES,
  TARGETS,
  Random,
  arenaFor,
  footprint,
  grip,
  clearPosition,
  vehicleRadius,
  fitFleet,
  waveFor,
  balloonHeightRange,
  type AbilityKind,
  type Arena,
  type BalloonKind,
  type OwnedVehicle,
  type Obstacle,
  type VehicleKind,
  type Run,
  type Spawn,
  type TargetMode,
} from './data';
import { hayContacts, hayDriveSpeed, hayHandling, hayOnSweep, touchesHay } from './hay';
import { findPath, pathCosts } from './pathfinding';
import { canTravel, trafficCells, yieldPath, type TrafficBody } from './traffic';
import {
  angleDifference,
  beginMotionTick,
  driveVehicle,
  finishMotionTick,
  motionAt,
  stopAtCollision,
  type VehicleMotion,
  type DriveControl,
} from './vehicle-motion';
import {
  approachSpeed,
  chooseDriveControl,
  terrainTravelCost,
  DRIVE_PLAN_TICKS,
  HEADER_PLAN_TICKS,
} from './vehicle-driving';
import { chooseBalloonHeading } from './balloon-motion';
import { PopRhythm, POP_RUSH } from './pop-rush';
import {
  armorDamageFactor,
  canTargetBalloon,
  vehicleStats,
  vehicleTool,
  toolIntervalTicks,
  terrainSpeedFactor,
  terrainHandlingFactor,
} from './capabilities';
import {
  balePathClear,
  inWindCone,
  segmentDistance,
  toolFacing,
  toolVictims,
} from './vehicle-tools';
let initialization: Promise<void> | undefined;
export function initPhysics() {
  return (initialization ??= RAPIER.init());
}
export interface Balloon {
  id: number;
  kind: BalloonKind;
  layer: number;
  maxLayer: number;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  z: number;
  px: number;
  py: number;
  pz: number;
  float: number;
  baseFloat: number;
  spawned: number;
  hitTick: number;
  fleeing: boolean;
  regen: boolean;
  armor: boolean;
  acid: number;
  slowUntil: number;
  lowerUntil: number;
  dx: number;
  dz: number;
  nextTurn: number;
  dodgeUntil: number;
}
export interface SimVehicle extends OwnedVehicle, VehicleMotion {
  px: number;
  pz: number;
  aimAngle: number;
  toolAngle: number;
  ptoolAngle: number;
  target: number;
  attackTick: number;
  nextSelect: number;
  nextPath: number;
  path: [number, number][];
  pops: number;
  boostUntil: number;
  overdriveUntil: number;
  activeUntil: number;
  cooldown: number;
  state: 'idle' | 'moving' | 'turning' | 'yielding' | 'attacking' | 'stuck' | 'clearing';
  wait: number;
  blockedTicks: number;
  nextDrivePlan: number;
  driveControl: DriveControl | null;
  driveGoal: [number, number] | null;
  driveFacing: boolean;
  yieldUntil: number;
  blacklist: Record<number, number>;
}
export interface Bale extends Obstacle {
  id: number;
}
export interface PopEvent {
  id: number;
  x: number;
  y: number;
  z: number;
  color: string;
  kind: BalloonKind;
  tick: number;
}
export interface AttackEvent {
  kind: VehicleKind;
  vehicleId: number;
  tick: number;
  from: [number, number, number];
  to: [number, number, number];
}
export interface BaleShot {
  id: number;
  vehicleId: number;
  x: number;
  y: number;
  z: number;
  px: number;
  py: number;
  pz: number;
  dx: number;
  dz: number;
  targetY: number;
  rise: number;
  travelled: number;
  range: number;
  damage: number;
  radius: number;
  pierce: number;
  burst: boolean;
  hitIds: number[];
}
export interface AirBurst {
  x: number;
  z: number;
  angle: number;
  range: number;
  halfAngle: number;
  min: number;
  max: number;
  rallyX: number;
  rallyZ: number;
  strength: number;
  started: number;
  until: number;
  vortex: boolean;
}
export type Command = {
  ability: AbilityKind | 'vehicle' | 'finish' | 'targeting';
  targeting?: TargetMode;
  x?: number;
  z?: number;
  dx?: number;
  dz?: number;
  vehicleId?: number;
};
export interface Summary {
  cleared: boolean;
  reason: 'cleared' | 'timeout' | 'uncovered';
  pops: number;
  popCash: number;
  baseIncome: number;
  bonus: number;
  earned: number;
  livesLost: number;
  seconds: number;
  topVehicle: string;
  bestStreak: number;
  rushes: number;
}
export interface Replay {
  run: Run;
  commands: { tick: number; command: Command }[];
}
export function balloonLives(b: Pick<Balloon, 'kind' | 'layer'>) {
  return b.kind === 'layered' ? b.layer : BALLOONS[b.kind].lives;
}
export { vehicleStats } from './capabilities';
export class Simulation {
  world: RAPIER.World;
  arena: Arena;
  run: Run;
  tick = 0;
  balloons: Balloon[] = [];
  vehicles: SimVehicle[] = [];
  bales: Bale[] = [];
  hayCrushed = 0;
  hayPushed = 0;
  private pushedHay = new Set<number>();
  events: PopEvent[] = [];
  attacks: AttackEvent[] = [];
  shots: BaleShot[] = [];
  winds: AirBurst[] = [];
  summary: Summary | null = null;
  pops = 0;
  popCash = 0;
  rhythm = new PopRhythm();
  spawnIndex = 0;
  wave: Spawn[];
  rng: Random;
  nextId = 100;
  commands: { tick: number; command: Command }[] = [];
  queue: Command[] = [];
  abilityReady: Record<AbilityKind, number[]> = { gust: [], boost: [], pitchfork: [] };
  gust = { until: 0, dx: 0, dz: 0 };
  clouds: { x: number; z: number; until: number }[] = [];
  private deferred: { s: Spawn; at?: { x: number; y: number; z: number } }[] = [];
  private baleBodies = new Map<number, RAPIER.RigidBody>();
  private bodies = new Map<number, RAPIER.RigidBody>();
  private pool: RAPIER.RigidBody[] = [];
  private vbodies = new Map<number, RAPIER.RigidBody>();
  private yieldRequests = new Map<number, { requester: number; until: number }>();
  private movementProgress = new Map<number, { x: number; z: number; tick: number }>();
  constructor(
    run: Run,
    private readonly looseHay = true,
    surfaces = true,
  ) {
    const arena = arenaFor(run.arena, run.round, run.seed);
    if (!looseHay) arena.obstacles = arena.obstacles.filter((o) => !o.loose);
    if (!surfaces) arena.surfaces = [];
    run = {
      ...run,
      fleet: fitFleet(arena, run.fleet),
    };
    this.run = structuredClone(run);
    this.arena = arena;
    this.rng = new Random(run.seed + run.round * 331);
    this.wave = waveFor(run.round, run.seed, run.mode);
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = 1 / 60;
    const a = this.arena;
    const fixed = (x: number, y: number, z: number, w: number, h: number, d: number) => {
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(x, y, z),
      );
    };
    fixed(a.width / 2, -0.5, a.depth / 2, a.width, 1, a.depth);
    fixed(-0.5, a.ceiling / 2, a.depth / 2, 1, a.ceiling, a.depth);
    fixed(a.width + 0.5, a.ceiling / 2, a.depth / 2, 1, a.ceiling, a.depth);
    fixed(a.width / 2, a.ceiling / 2, -0.5, a.width, a.ceiling, 1);
    fixed(a.width / 2, a.ceiling / 2, a.depth + 0.5, a.width, a.ceiling, 1);
    fixed(a.width / 2, a.ceiling + 0.5, a.depth / 2, a.width, 1, a.depth);
    for (const o of a.obstacles) {
      if (o.loose) this.addHay(o as Bale);
      else fixed(o.x, o.h / 2, o.z, o.w, o.h, o.d);
    }
    for (const owned of run.fleet.filter((v) => v.placed)) {
      const [w, d] = footprint(owned);
      const v: SimVehicle = {
        ...structuredClone(owned),
        x: owned.x + w / 2,
        z: owned.z + d / 2,
        px: owned.x + w / 2,
        pz: owned.z + d / 2,
        ...motionAt(owned.rotation),
        aimAngle: owned.rotation,
        toolAngle: owned.rotation,
        ptoolAngle: owned.rotation,
        target: -1,
        attackTick: 0,
        nextSelect: 0,
        nextPath: 0,
        path: [],
        pops: 0,
        boostUntil: 0,
        overdriveUntil: 0,
        activeUntil: 0,
        cooldown: 0,
        state: 'idle',
        wait: 0,
        blockedTicks: 0,
        nextDrivePlan: 0,
        driveControl: null,
        driveGoal: null,
        driveFacing: false,
        yieldUntil: 0,
        blacklist: {},
      };
      this.vehicles.push(v);
      const body = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(v.x, 0.6, v.z),
      );
      this.world.createCollider(RAPIER.ColliderDesc.cylinder(0.5, vehicleRadius(v)), body);
      this.vbodies.set(v.id, body);
    }
    for (const key of Object.keys(run.abilities) as AbilityKind[])
      this.abilityReady[key] = Array(run.abilities[key] === 2 ? 2 : 1).fill(0);
  }
  dispose() {
    this.world.free();
  }
  enqueue(command: Command) {
    this.queue.push(command);
  }
  get secondsLeft() {
    return Math.max(0, 180 - this.tick / 60);
  }
  get pending() {
    return this.wave.length - this.spawnIndex + this.deferred.length;
  }
  private spawn(s: Spawn, at?: { x: number; y: number; z: number }) {
    if (this.balloons.length >= 300) {
      this.deferred.push({ s, at });
      return;
    }
    const a = this.arena;
    const gate = s.gate ?? (this.rng.next() < 0.5 ? 0 : 1);
    const x = at?.x ?? (gate === 0 ? 1.8 : a.width - 1.8);
    let z =
      at?.z ?? (s.lane === undefined ? 2 + this.rng.next() * (a.depth - 4) : s.lane * a.depth);
    if (!at) {
      // Dense packs must enter through an open aisle, with room for an attacking chassis.
      const entryX = gate === 0 ? 3 : a.width - 3;
      const clearEntry = (lane: number) =>
        clearPosition(a, entryX, lane, 1.4) &&
        clearPosition(a, x, lane, BALLOONS[s.kind].radius + 0.1);
      if (!clearEntry(z)) {
        const lanes = Array.from({ length: (a.depth - 4) * 2 + 1 }, (_, i) => 2 + i * 0.5);
        lanes.sort((left, right) => Math.abs(left - z) - Math.abs(right - z));
        z = lanes.find(clearEntry) ?? z;
      }
    }
    const [minHeight, maxHeight] = balloonHeightRange(s.kind, this.run.round, a);
    // Fixed-height armor consumes no random draw, preserving seeded replays.
    let height =
      minHeight === maxHeight ? minHeight : minHeight + this.rng.next() * (maxHeight - minHeight);
    height = at?.y ?? height;
    const hp =
      BALLOONS[s.kind].hp *
      (s.kind === 'basic' || s.kind === 'layered'
        ? 1
        : 1 + Math.max(0, this.run.round - 8) * MODES[this.run.mode].toughGrowth) *
      (this.run.freeplay
        ? 1 + Math.max(0, this.run.round - MODES[this.run.mode].rounds) * 0.02
        : 1);
    const direction = Math.atan2(a.depth / 2 - z + (this.rng.next() - 0.5) * 6, a.width / 2 - x);
    const b: Balloon = {
      id: this.nextId++,
      kind: s.kind,
      layer: s.layer,
      maxLayer: s.layer,
      hp,
      maxHp: hp,
      x,
      y: height,
      z,
      px: x,
      py: height,
      pz: z,
      float: height,
      baseFloat: height,
      spawned: this.tick,
      hitTick: this.tick,
      fleeing: s.fleeing,
      regen: s.regen,
      armor: s.armor || s.kind === 'armored',
      acid: 0,
      slowUntil: 0,
      lowerUntil: 0,
      dx: Math.cos(direction),
      dz: Math.sin(direction),
      nextTurn: this.tick + 180 + Math.floor(this.rng.next() * 121),
      dodgeUntil: 0,
    };
    this.balloons.push(b);
    let body = this.pool.pop();
    if (body) {
      body.setEnabled(true);
      body.setTranslation({ x, y: height, z }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      body.collider(0).setShape(new RAPIER.Ball(BALLOONS[b.kind].radius));
    } else {
      body = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(x, height, z)
          .setGravityScale(0)
          .setLinearDamping(0.4)
          .lockRotations(),
      );
      this.world.createCollider(
        RAPIER.ColliderDesc.ball(BALLOONS[b.kind].radius).setDensity(0.2).setRestitution(0.6),
        body,
      );
    }
    this.bodies.set(b.id, body);
  }
  private eligible(v: SimVehicle, b: Balloon, checkBlacklist = true) {
    return (
      canTargetBalloon(v, b.y, b.armor) && (!checkBlacklist || !(v.blacklist[b.id] > this.tick))
    );
  }
  private clearToolPosition(v: SimVehicle, b: Balloon, x = v.x, z = v.z) {
    return (
      v.kind !== 'baler' ||
      balePathClear(this.arena, x, z, b.x, b.y, b.z, v.upgrades.unique >= 4 ? 0.65 : 0.35)
    );
  }
  get canFinishEarly() {
    return (
      this.pending === 0 &&
      this.balloons.length > 0 &&
      this.tick > (this.wave.at(-1)?.tick ?? 0) + 180 &&
      !this.balloons.some((b) => this.vehicles.some((v) => this.eligible(v, b, false)))
    );
  }
  vehicleStatus(v: SimVehicle) {
    if (v.state === 'clearing') return 'Clearing hay';
    if (v.yieldUntil > this.tick || v.state === 'yielding') return 'Yielding to traffic';
    if (v.state === 'turning') return 'Turning into position';
    if (v.wait > 0) return 'Waiting for traffic';
    const target = this.balloons.find((b) => b.id === v.target);
    if (target && this.eligible(v, target)) {
      if (v.state === 'stuck') return 'Replanning route';
      if (v.speed < -0.1) return `Reversing toward ${BALLOONS[target.kind].name}`;
      return `${v.state === 'attacking' ? 'Attacking' : 'Moving to'} ${BALLOONS[target.kind].name}`;
    }
    if (!this.balloons.length) return this.pending ? 'Waiting for balloons' : 'Wave cleared';
    if (this.balloons.some((b) => this.eligible(v, b, false))) return 'Replanning route';
    const s = vehicleStats(v);
    if (!this.balloons.some((b) => b.y >= s.min - 0.15 && b.y <= s.max + 0.2))
      return `Out of reach · ${s.min}–${s.max} m`;
    return 'Armor needs upgrades';
  }
  private applyCommand(c: Command) {
    if (c.ability === 'finish') {
      if (this.canFinishEarly) this.finish('uncovered');
      return;
    }
    const v = this.vehicles.find((v) => v.id === c.vehicleId);
    if (c.ability === 'targeting') {
      if (!v || !c.targeting || !TARGETS.includes(c.targeting)) return;
      v.targeting = c.targeting;
      v.target = -1;
      v.nextSelect = 0;
      v.nextPath = 0;
      v.path = [];
      v.yieldUntil = 0;
      v.blacklist = {};
      // Keep the replay's initial configuration; this change is a timestamped command.
      return;
    }
    if (c.ability === 'vehicle') {
      if (!v || v.upgrades.unique < 3 || v.cooldown > this.tick) return;
      v.cooldown = this.tick + VEHICLE_ABILITIES[v.kind].cooldown * 60;
      if (v.kind === 'harvester') {
        v.activeUntil = this.tick + 180;
        const eligible = this.balloons.filter((b) => this.eligible(v, b));
        const target = eligible
          .map((b) => ({
            b,
            n: eligible.filter((o) => Math.hypot(o.x - b.x, o.z - b.z) < 3).length,
          }))
          .sort((a, b) => b.n - a.n || a.b.id - b.b.id)[0]?.b;
        if (target) {
          v.target = target.id;
          v.nextSelect = this.tick + 180;
          v.nextPath = 0;
        }
      }
      if (v.kind === 'sprayer') this.clouds.push({ x: v.x, z: v.z, until: this.tick + 360 });
      if (v.kind === 'excavator')
        for (const b of [...this.balloons])
          if (b.y < 2 && Math.hypot(b.x - v.x, b.z - v.z) < 4) this.hit(b, 3, v, true);
      if (v.kind === 'crane') {
        const b = this.balloons.find(
          (b) => Math.hypot(b.x - v.x, b.z - v.z) < vehicleStats(v).range && b.y > 2,
        );
        if (b) {
          b.lowerUntil = this.tick + 300;
          b.float = 2;
        }
      }
      if (v.kind === 'baler') {
        const target =
          this.balloons.find((b) => b.id === v.target) ??
          this.balloons
            .filter((b) => this.eligible(v, b, false))
            .sort(
              (a, b) =>
                Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z) || a.id - b.id,
            )[0];
        if (target) for (const offset of [-0.22, 0, 0.22]) this.launchBale(v, target, offset);
      }
      if (v.kind === 'blower') {
        const s = vehicleStats(v);
        for (const b of this.balloons)
          if (b.y >= s.min && b.y <= s.max && Math.hypot(b.x - v.x, b.z - v.z) <= s.range) {
            b.float = Math.min(b.float, 1.2);
            b.lowerUntil = this.tick + 300;
          }
        this.attacks.push({
          kind: v.kind,
          vehicleId: v.id,
          tick: this.tick,
          from: [v.x, s.max, v.z],
          to: [v.x, 1.2, v.z],
        });
      }
      if (v.kind === 'bulldozer') {
        const s = vehicleStats(v);
        const victims = this.balloons.filter(
          (b) =>
            this.eligible(v, b, false) &&
            inWindCone(b.x - v.x, b.z - v.z, v.angle, s.range + 0.5, vehicleTool(v).cone),
        );
        for (const b of victims) this.hit(b, 3, v);
        this.attacks.push({
          kind: v.kind,
          vehicleId: v.id,
          tick: this.tick,
          from: [v.x, 1, v.z],
          to: [v.x + Math.sin(v.angle) * s.range, 1, v.z + Math.cos(v.angle) * s.range],
        });
      }
      if (v.kind === 'mixer') {
        const s = vehicleStats(v);
        const target = this.balloons
          .filter((b) => this.eligible(v, b, false) && Math.hypot(b.x - v.x, b.z - v.z) <= s.range)
          .sort(
            (a, b) =>
              Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z) || a.id - b.id,
          )[0];
        if (target) {
          for (const b of [...this.balloons])
            if (this.eligible(v, b, false) && Math.hypot(b.x - target.x, b.z - target.z) < 2.5)
              this.hit(b, 2.5, v);
          this.attacks.push({
            kind: v.kind,
            vehicleId: v.id,
            tick: this.tick,
            from: [v.x, 2.4, v.z],
            to: [target.x, target.y, target.z],
          });
        }
      }
      return;
    }
    const charges = this.abilityReady[c.ability],
      i = charges.findIndex((t) => t <= this.tick);
    if (i < 0) return;
    if (c.ability === 'boost' && !v) return;
    charges[i] =
      this.tick +
      ABILITIES[c.ability].cooldown * 60 * (this.run.abilities[c.ability]! >= 1 ? 0.8 : 1);
    if (c.ability === 'gust') {
      let dx = c.dx ?? 1,
        dz = c.dz ?? 0;
      const len = Math.hypot(dx, dz) || 1;
      this.gust = { until: this.tick + 180, dx: dx / len, dz: dz / len };
      for (const b of this.balloons)
        if (b.kind === 'high') {
          b.float = Math.max(2, b.float - 3);
          b.lowerUntil = this.tick + 600;
        }
    }
    if (c.ability === 'boost' && v) {
      v.boostUntil = this.tick + 480;
      v.state = 'idle';
      v.path = [];
      v.yieldUntil = 0;
    }
    if (c.ability === 'pitchfork')
      for (const b of [...this.balloons])
        if (Math.hypot(b.x - (c.x ?? 0), b.z - (c.z ?? 0)) < 1.5) this.hit(b, 3, undefined, true);
  }
  private hit(b: Balloon, amount: number, v?: SimVehicle, bypass = false) {
    if (!this.bodies.has(b.id)) return;
    let factor = 1;
    if (b.armor && !bypass) {
      factor = v ? armorDamageFactor(v) : 0;
      if (v?.kind === 'sprayer' && v.upgrades.unique >= 4) {
        factor = 1;
        if (++b.acid >= 3) b.armor = false;
      }
    }
    b.hp -= amount * factor;
    b.hitTick = this.tick;
    if (v?.kind === 'sprayer' && v.upgrades.unique >= 3) b.slowUntil = this.tick + 180;
    if ((v?.kind === 'bulldozer' || v?.kind === 'mixer') && v.upgrades.unique >= 3)
      b.slowUntil = this.tick + 120;
    if (b.hp > 0) return;
    this.pops++;
    if (this.rhythm.pop(this.tick)) {
      // Let the whole fleet feel the ignition immediately, including heavy tools.
      for (const vehicle of this.vehicles)
        vehicle.attackTick = Math.min(vehicle.attackTick, this.tick + 6);
    }
    this.popCash += BALLOONS[b.kind].cash;
    if (v) {
      v.pops++;
      v.overdriveUntil = this.tick + 300;
    }
    this.events.push({
      id: b.id,
      x: b.x,
      y: b.y,
      z: b.z,
      color: BALLOONS[b.kind].color,
      kind: b.kind,
      tick: this.tick,
    });
    const body = this.bodies.get(b.id)!;
    body.setEnabled(false);
    this.pool.push(body);
    this.bodies.delete(b.id);
    this.balloons = this.balloons.filter((x) => x.id !== b.id);
    if (
      b.kind === 'layered' &&
      b.layer > 1 &&
      !(v?.kind === 'excavator' && v.upgrades.unique === 5)
    ) {
      for (let i = 0; i < 2; i++)
        this.spawn(
          {
            tick: this.tick,
            kind: 'layered',
            layer: b.layer - 1,
            fleeing: b.fleeing,
            regen: b.regen,
            armor: b.armor,
          },
          { x: b.x + (i ? 0.35 : -0.35), y: b.y, z: b.z },
        );
    }
    if (b.kind === 'carrier')
      for (let i = 0; i < 3; i++)
        this.spawn(
          { tick: this.tick, kind: 'basic', layer: 1, fleeing: false, regen: false, armor: false },
          { x: b.x + (i - 1) * 0.5, y: 0.8, z: b.z },
        );
  }
  private launchBale(v: SimVehicle, target: Balloon, offset = 0) {
    const s = vehicleStats(v);
    const angle = Math.atan2(target.x - v.x, target.z - v.z) + offset;
    this.shots.push({
      id: this.nextId++,
      vehicleId: v.id,
      x: v.x,
      y: 1.3,
      z: v.z,
      px: v.x,
      py: 1.3,
      pz: v.z,
      dx: Math.sin(angle),
      dz: Math.cos(angle),
      targetY: target.y,
      rise: Math.max(0.3, Math.min(2, Math.hypot(target.x - v.x, target.z - v.z))),
      travelled: 0,
      range: s.range,
      damage: s.damage,
      radius: vehicleTool(v).baleRadius,
      pierce: vehicleTool(v).pierce,
      burst: vehicleTool(v).burst > 0,
      hitIds: [],
    });
    this.attacks.push({
      kind: v.kind,
      vehicleId: v.id,
      tick: this.tick,
      from: [v.x, 1.3, v.z],
      to: [v.x + Math.sin(angle) * s.range, target.y, v.z + Math.cos(angle) * s.range],
    });
  }
  private burstBale(shot: BaleShot, v: SimVehicle) {
    if (!shot.burst) return;
    for (const b of [...this.balloons])
      if (
        canTargetBalloon(v, b.y, b.armor) &&
        Math.hypot(b.x - shot.x, b.y - shot.y, b.z - shot.z) <= 2
      )
        this.hit(b, shot.damage * 0.5, v);
    this.attacks.push({
      kind: 'baler',
      vehicleId: v.id,
      tick: this.tick,
      from: [shot.x, shot.y, shot.z],
      to: [shot.x, shot.y, shot.z],
    });
  }
  private advanceBales() {
    this.shots = this.shots.filter((shot) => {
      const v = this.vehicles.find((v) => v.id === shot.vehicleId);
      if (!v) return false;
      shot.px = shot.x;
      shot.py = shot.y;
      shot.pz = shot.z;
      const distance = Math.min(18 / 60, shot.range - shot.travelled);
      shot.x += shot.dx * distance;
      shot.z += shot.dz * distance;
      shot.travelled += distance;
      shot.y = 1.3 + (shot.targetY - 1.3) * Math.min(1, shot.travelled / shot.rise);
      if (
        shot.x < 0 ||
        shot.z < 0 ||
        shot.x > this.arena.width ||
        shot.z > this.arena.depth ||
        this.arena.obstacles.some(
          (o) =>
            shot.y < o.h + shot.radius &&
            Math.abs(shot.x - o.x) < o.w / 2 + shot.radius &&
            Math.abs(shot.z - o.z) < o.d / 2 + shot.radius,
        )
      ) {
        this.burstBale(shot, v);
        return false;
      }
      const victims = this.balloons
        .filter(
          (b) =>
            !shot.hitIds.includes(b.id) &&
            canTargetBalloon(v, b.y, b.armor) &&
            segmentDistance(b.x, b.y, b.z, [shot.px, shot.py, shot.pz], [shot.x, shot.y, shot.z]) <=
              shot.radius + BALLOONS[b.kind].radius,
        )
        .sort(
          (a, b) =>
            (a.x - shot.px) * shot.dx +
              (a.z - shot.pz) * shot.dz -
              ((b.x - shot.px) * shot.dx + (b.z - shot.pz) * shot.dz) || a.id - b.id,
        );
      for (const b of victims) {
        shot.hitIds.push(b.id);
        this.hit(b, shot.damage, v);
        if (--shot.pierce === 0) break;
      }
      const alive = shot.pierce > 0 && shot.travelled < shot.range - 0.0001;
      if (!alive) this.burstBale(shot, v);
      return alive;
    });
  }
  private blow(v: SimVehicle, target: Balloon) {
    const s = vehicleStats(v);
    const halfAngle = vehicleTool(v).cone;
    const partner = this.vehicles
      .filter((other) => other.id !== v.id && other.kind !== 'blower')
      .sort(
        (a, b) =>
          Number(b.kind === 'baler') - Number(a.kind === 'baler') ||
          Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z) ||
          a.id - b.id,
      )
      .find(
        (other) =>
          Math.hypot(other.x - target.x, other.z - target.z) <= vehicleStats(other).range + s.range,
      );
    const reach = partner ? vehicleStats(partner).range * 0.65 : s.range + 2;
    const angle = partner?.aimAngle ?? v.aimAngle;
    this.winds.push({
      x: v.x,
      z: v.z,
      angle: v.aimAngle,
      range: s.range,
      halfAngle,
      min: s.min,
      max: s.max,
      rallyX: (partner?.x ?? v.x) + Math.sin(angle) * reach,
      rallyZ: (partner?.z ?? v.z) + Math.cos(angle) * reach,
      strength: vehicleTool(v).wind,
      started: this.tick,
      until: this.tick + 24,
      vortex: vehicleTool(v).vortex,
    });
  }
  private attack(v: SimVehicle, target: Balloon) {
    const s = vehicleStats(v);
    const rearAttack =
      vehicleTool(v).rear && Math.cos(Math.atan2(target.x - v.x, target.z - v.z) - v.angle) < 0;
    const originAngle =
      v.kind === 'harvester' || v.kind === 'bulldozer'
        ? v.angle + (rearAttack ? Math.PI : 0)
        : v.aimAngle;
    const victims = toolVictims(
      v,
      target,
      this.balloons.filter((b) => this.eligible(v, b)),
      v.x,
      v.z,
      v.kind === 'harvester' || v.kind === 'bulldozer' ? v.angle : v.aimAngle,
    );
    if (v.kind === 'baler') this.launchBale(v, target);
    if (v.kind === 'blower') this.blow(v, target);
    if (victims.length)
      this.attacks.push({
        kind: v.kind,
        vehicleId: v.id,
        tick: this.tick,
        from: [
          v.x + Math.sin(originAngle) * 1.2,
          v.kind === 'crane' ? 5 : 1,
          v.z + Math.cos(originAngle) * 1.2,
        ],
        to: [target.x, target.y, target.z],
      });
    for (const b of victims.sort((a, b) => a.id - b.id))
      this.hit(b, s.damage * (v.activeUntil > this.tick ? 2 : 1), v);
    // Carry a sub-tick remainder across consecutive attacks. Rounding every
    // cooldown made fast tools lose entire upgrades (e.g. 4.4 vs 3.5 ticks).
    // After travelling or turning, start a fresh cooldown instead of banking shots.
    const start = v.attackTick > this.tick - 1 ? v.attackTick : this.tick;
    v.attackTick = start + toolIntervalTicks(v, this.boosted(v), this.rhythm.active(this.tick));
  }
  private boosted(v: SimVehicle) {
    return (
      v.boostUntil > this.tick ||
      v.activeUntil > this.tick ||
      v.upgrades.speed === 5 ||
      (v.upgrades.speed >= 4 && v.overdriveUntil > this.tick)
    );
  }
  step() {
    if (this.summary) return;
    this.rhythm.update(this.tick);
    for (const c of this.queue) {
      this.commands.push({ tick: this.tick, command: structuredClone(c) });
      this.applyCommand(c);
    }
    this.queue = [];
    if (this.summary) return;
    while (this.deferred.length && this.balloons.length < 300) {
      const entry = this.deferred.shift()!;
      this.spawn(entry.s, entry.at);
    }
    while (this.spawnIndex < this.wave.length && this.wave[this.spawnIndex].tick <= this.tick)
      this.spawn(this.wave[this.spawnIndex++]);
    for (const b of this.balloons) {
      b.px = b.x;
      b.py = b.y;
      b.pz = b.z;
      const body = this.bodies.get(b.id)!;
      if (this.tick >= b.nextTurn) {
        const heading = chooseBalloonHeading(this.arena, b, this.vehicles, this.rng);
        b.dx = heading.dx;
        b.dz = heading.dz;
        if (heading.dodge) b.dodgeUntil = this.tick + 120;
        b.nextTurn = this.tick + 180 + Math.floor(this.rng.next() * 121);
      }
      if (b.lowerUntil && this.tick === b.lowerUntil) {
        b.float = b.baseFloat;
        b.lowerUntil = 0;
      }
      const driftSpeed =
        BALLOONS[b.kind].speed *
        MODES[this.run.mode].drift *
        (b.fleeing && b.dodgeUntil > this.tick ? 1.35 : 1);
      let dx = b.dx * driftSpeed,
        dz = b.dz * driftSpeed;
      const slow =
        b.slowUntil > this.tick ||
        this.clouds.some((c) => c.until > this.tick && Math.hypot(b.x - c.x, b.z - c.z) < 5);
      if (slow) {
        dx *= 0.4;
        dz *= 0.4;
      }
      if (this.gust.until > this.tick) {
        dx += this.gust.dx * 2;
        dz += this.gust.dz * 2;
      }
      let windX = 0,
        windZ = 0;
      for (const wind of this.winds) {
        if (
          wind.until <= this.tick ||
          b.y < wind.min - 0.15 ||
          b.y > wind.max + 0.2 ||
          !inWindCone(b.x - wind.x, b.z - wind.z, wind.angle, wind.range, wind.halfAngle)
        )
          continue;
        const gathering = wind.vortex && this.tick - wind.started < 12;
        const rallyX = gathering ? wind.x + Math.sin(wind.angle) * wind.range * 0.65 : wind.rallyX;
        const rallyZ = gathering ? wind.z + Math.cos(wind.angle) * wind.range * 0.65 : wind.rallyZ;
        const gap = Math.max(1, Math.hypot(rallyX - b.x, rallyZ - b.z));
        windX += ((rallyX - b.x) / gap) * wind.strength;
        windZ += ((rallyZ - b.z) / gap) * wind.strength;
      }
      // Stacked blowers cannot pin a pack against a wall with unbounded wind speed.
      const windScale = Math.min(1, 6 / Math.max(0.01, Math.hypot(windX, windZ)));
      dx += windX * windScale;
      dz += windZ * windScale;
      for (const v of this.vehicles) {
        if (
          v.kind === 'harvester' &&
          v.upgrades.unique === 5 &&
          Math.hypot(b.x - v.x, b.z - v.z) < 4
        ) {
          dx += (v.x - b.x) * 0.5;
          dz += (v.z - b.z) * 0.5;
        }
        if (
          v.kind === 'crane' &&
          v.upgrades.unique >= 4 &&
          b.kind === 'carrier' &&
          Math.hypot(b.x - v.x, b.z - v.z) <= vehicleStats(v).range
        ) {
          b.slowUntil = Math.max(b.slowUntil, this.tick + 60);
          if (b.baseFloat > 3) {
            b.baseFloat = 3;
            if (b.lowerUntil <= this.tick) b.float = Math.min(b.float, b.baseFloat);
          }
        }
      }
      const vel = body.linvel();
      body.setLinvel(
        {
          x: vel.x * 0.92 + dx * 0.08,
          y: vel.y * 0.95 + (b.float - b.y) * 0.06,
          z: vel.z * 0.92 + dz * 0.08,
        },
        true,
      );
      if (b.regen && this.tick - b.hitTick >= 300 && this.tick % 300 === 0) {
        if (b.kind === 'layered' && b.layer < b.maxLayer) b.layer++;
        else b.hp = Math.min(b.maxHp, b.hp + 1);
      }
      if (
        this.looseHay &&
        b.kind === 'carrier' &&
        this.tick > b.spawned &&
        (this.tick - b.spawned) % 1200 === 0 &&
        this.bales.length < 20
      ) {
        const id = this.nextId++;
        const bale: Bale = {
          id,
          x: b.x,
          z: b.z,
          w: 1.4,
          d: 1,
          h: 0.9,
          kind: 'hay',
          loose: true,
          integrity: 1,
        };
        // A carrier cannot drop a bale inside scenery, traffic, or existing hay.
        if (
          clearPosition(this.arena, bale.x, bale.z, 0.9) &&
          !this.vehicles.some((v) => touchesHay(bale, v.x, v.z, vehicleRadius(v)))
        ) {
          this.arena.obstacles.push(bale);
          this.addHay(bale);
          this.invalidateHayRoutes();
        }
      }
    }
    const traffic = this.vehicles.map((v) => ({
      id: v.id,
      x: v.x,
      z: v.z,
      radius: vehicleRadius(v),
      vehicle: v,
    }));
    const claimed = new Set<number>();
    // Rotate right of way so insertion order cannot starve the same vehicle forever.
    const priority = Math.floor(this.tick / 90) % Math.max(1, this.vehicles.length);
    const ordered = [...this.vehicles.slice(priority), ...this.vehicles.slice(0, priority)];
    for (const v of ordered) {
      if (!this.movementProgress.has(v.id) || v.state === 'idle' || v.state === 'attacking')
        this.movementProgress.set(v.id, { x: v.x, z: v.z, tick: this.tick });
      v.px = v.x;
      v.pz = v.z;
      beginMotionTick(v);
      v.ptoolAngle = v.toolAngle;
      const s = vehicleStats(v);
      if (
        this.tick >= v.nextSelect ||
        !this.balloons.some((b) => b.id === v.target && this.eligible(v, b))
      ) {
        let candidates = this.balloons.filter((b) => this.eligible(v, b));
        const costs =
          v.targeting === 'Nearest'
            ? pathCosts(this.arena, v.x, v.z, s.traction, vehicleRadius(v), v)
            : null;
        const distances = new Map(candidates.map((b) => [b.id, Math.hypot(b.x - v.x, b.z - v.z)]));
        // Vehicles need a reachable firing position, not a path onto the balloon's cell.
        const approach = new Map(
          candidates.map((b) => {
            if (!costs || (distances.get(b.id)! <= s.range && this.clearToolPosition(v, b)))
              return [b.id, 0];
            let best = Infinity;
            for (
              let z = Math.max(1, Math.floor(b.z - s.range));
              z < Math.min(this.arena.depth - 1, Math.ceil(b.z + s.range));
              z++
            )
              for (
                let x = Math.max(1, Math.floor(b.x - s.range));
                x < Math.min(this.arena.width - 1, Math.ceil(b.x + s.range));
                x++
              )
                if (
                  costs[z * this.arena.width + x] < best &&
                  Math.hypot(x + 0.5 - b.x, z + 0.5 - b.z) <= s.range - 0.15 &&
                  this.clearToolPosition(v, b, x + 0.5, z + 0.5)
                )
                  best = Math.min(best, costs[z * this.arena.width + x]);
            return [b.id, best];
          }),
        );
        if (costs) candidates = candidates.filter((b) => Number.isFinite(approach.get(b.id)));
        candidates.sort((a, b) => {
          let priority = 0;
          switch (v.targeting) {
            case 'Strongest':
              priority =
                (b.kind === 'layered' ? b.layer : b.hp) - (a.kind === 'layered' ? a.layer : a.hp);
              break;
            case 'Highest':
              priority = b.y - a.y;
              break;
            case 'Oldest':
              priority = a.spawned - b.spawned;
              break;
            case 'Most lives':
              priority = balloonLives(b) - balloonLives(a);
              break;
            default:
              priority = approach.get(a.id)! - approach.get(b.id)!;
          }
          return (
            priority ||
            distances.get(a.id)! - distances.get(b.id)! ||
            Number(claimed.has(a.id)) - Number(claimed.has(b.id)) ||
            a.id - b.id
          );
        });
        const previous = v.target;
        v.target = candidates[0]?.id ?? -1;
        if (previous !== v.target && v.yieldUntil <= this.tick) {
          v.nextPath = 0;
          v.nextDrivePlan = 0;
          v.path = [];
        }
        v.nextSelect = this.tick + (v.upgrades.speed >= 3 ? 8 : 12);
      }
      const target = this.balloons.find((b) => b.id === v.target);
      const body = traffic.find((body) => body.id === v.id)!;
      const request = this.yieldRequests.get(v.id);
      if (request) {
        const requester = this.vehicles.find((other) => other.id === request.requester);
        if (request.until <= this.tick || !requester) {
          this.yieldRequests.delete(v.id);
        } else if (v.yieldUntil <= this.tick) {
          const destination = this.balloons.find((b) => b.id === requester.target);
          const angle = destination
            ? Math.atan2(destination.x - requester.x, destination.z - requester.z)
            : requester.angle;
          const path = yieldPath(this.arena, body, angle, traffic);
          if (path.length) {
            v.path = path;
            v.yieldUntil = this.tick + 150;
            v.nextPath = v.yieldUntil;
            v.wait = 0;
          }
        }
      }
      const yielding = v.yieldUntil > this.tick && v.path.length > 0;
      if (!target && !yielding) {
        v.state = 'idle';
        v.wait = 0;
        this.moveVehicle(
          v,
          body,
          traffic,
          null,
          0,
          terrainHandlingFactor(v, grip(this.arena, v.x, v.z)),
        );
        continue;
      }
      if (target) {
        claimed.add(target.id);
        v.aimAngle = Math.atan2(target.x - v.x, target.z - v.z);
      }
      // Once we have pulled aside, leave the exit free until the blocker is clear.
      const givingWay = [...this.yieldRequests].some(([id, request]) => {
        const other = this.vehicles.find((vehicle) => vehicle.id === id)!;
        return request.requester === v.id && other.yieldUntil > this.tick && other.path.length > 0;
      });
      if (givingWay && !yielding) {
        v.state = 'yielding';
        v.wait = 1;
        v.nextPath = 0;
        v.path = [];
        stopAtCollision(v);
        finishMotionTick(v, 0, 0);
        this.vbodies.get(v.id)!.setNextKinematicTranslation({ x: v.x, y: 0.6, z: v.z });
        continue;
      }
      const dist = target ? Math.hypot(target.x - v.x, target.z - v.z) : Infinity;
      const frontTool = v.kind === 'harvester' || v.kind === 'bulldozer';
      const headerFacing = toolFacing(v, v.aimAngle, v.angle);
      const clearShot = !target || this.clearToolPosition(v, target);
      if (
        target &&
        dist <= s.range &&
        this.eligible(v, target) &&
        headerFacing &&
        clearShot &&
        !yielding
      ) {
        v.state = 'attacking';
        v.nextDrivePlan = 0;
        v.driveControl = null;
        v.wait = 0;
        v.blockedTicks = 0;
        this.moveVehicle(
          v,
          body,
          traffic,
          null,
          0,
          terrainHandlingFactor(v, grip(this.arena, v.x, v.z)),
        );
        if (
          this.tick >= v.attackTick &&
          toolFacing(v, Math.atan2(target.x - v.x, target.z - v.z), v.angle)
        )
          this.attack(v, target);
      } else {
        v.state = 'moving';
        if (target && (this.tick >= v.nextPath || !v.path.length) && !yielding) {
          v.path = findPath(
            this.arena,
            v.x,
            v.z,
            target.x,
            target.z,
            s.traction,
            trafficCells(this.arena, body, traffic),
            s.range - 0.15,
            vehicleRadius(v),
            v.kind === 'baler' ? (x, z) => this.clearToolPosition(v, target, x, z) : undefined,
            v,
          );
          v.nextPath = this.tick + 45;
          const end = v.path.at(-1);
          if (!end || Math.hypot(end[0] - target.x, end[1] - target.z) > s.range)
            this.requestTraffic(v, body, traffic);
        }
        while (
          v.path.length &&
          Math.hypot(v.path[0][0] - v.x, v.path[0][1] - v.z) <
            (v.path.length === 1 ? 0.005 : 0.36) &&
          (v.path.length !== 1 || Math.abs(v.speed) < 0.05)
        )
          v.path.shift();
        // Look through visible waypoints so tires can follow curves instead of every grid corner.
        let point = v.path[0];
        const lookahead = Math.max(3, Math.abs(v.speed) * 0.55);
        let routeCost =
          point && this.arena.surfaces?.length
            ? terrainTravelCost(this.arena, v, v.x, v.z, point[0], point[1])
            : 0;
        for (let i = 1; i < v.path.length; i++) {
          const candidate = v.path[i];
          if (Math.hypot(candidate[0] - v.x, candidate[1] - v.z) > lookahead) break;
          if (!canTravel(this.arena, body, candidate[0], candidate[1], traffic)) break;
          if (this.arena.surfaces?.length) {
            const previous = v.path[i - 1];
            routeCost += terrainTravelCost(
              this.arena,
              v,
              previous[0],
              previous[1],
              candidate[0],
              candidate[1],
            );
            // Smoothing must preserve the cheap dry lane selected by A*.
            if (
              terrainTravelCost(this.arena, v, v.x, v.z, candidate[0], candidate[1]) >
              routeCost * 1.05
            )
              break;
          }
          point = candidate;
          v.path.splice(0, i);
          i = 0;
        }
        const aligningHeader = target && frontTool && !yielding && dist <= s.range + 1;
        if (aligningHeader) point = [target.x, target.z];
        if (point) {
          const terrain = grip(this.arena, v.x, v.z);
          const traction = terrainHandlingFactor(v, terrain);
          const speed = hayDriveSpeed(
            this.arena,
            body,
            s.speed *
              Math.min(
                2.5,
                (v.boostUntil > this.tick || v.activeUntil > this.tick ? 2 : 1) *
                  (this.rhythm.active(this.tick) ? POP_RUSH.move : 1),
              ) *
              terrainSpeedFactor(v, terrain),
          );
          const wheeled = v.kind !== 'excavator' && v.kind !== 'crane' && v.kind !== 'bulldozer';
          if (
            wheeled &&
            (v.driveFacing !== !!aligningHeader ||
              !v.driveGoal ||
              Math.hypot(point[0] - v.driveGoal[0], point[1] - v.driveGoal[1]) > 1)
          )
            v.nextDrivePlan = 0;
          if (wheeled && this.tick >= v.nextDrivePlan) {
            v.driveGoal = [...point];
            v.driveFacing = !!aligningHeader;
            v.driveControl = chooseDriveControl(
              v,
              v.kind,
              this.arena,
              body,
              traffic,
              {
                x: point[0],
                z: point[1],
                faceDirection:
                  target && v.kind === 'harvester' && !yielding
                    ? { x: target.x, z: target.z }
                    : undefined,
                faceTarget: aligningHeader
                  ? { x: target.x, z: target.z, range: s.range }
                  : undefined,
              },
              speed,
              traction,
              v.driveControl,
            );
            // Finish cruising arcs, but react sooner while lining up the front cutter.
            v.nextDrivePlan = this.tick + (aligningHeader ? HEADER_PLAN_TICKS : DRIVE_PLAN_TICKS);
          }
          const drivingSpeed = wheeled
            ? aligningHeader
              ? speed
              : approachSpeed(speed, Math.hypot(point[0] - v.x, point[1] - v.z), traction)
            : speed;
          if (
            this.moveVehicle(
              v,
              body,
              traffic,
              [point[0] - v.x, point[1] - v.z],
              drivingSpeed,
              traction,
              wheeled ? (v.driveControl ?? undefined) : undefined,
            )
          ) {
            v.wait = 0;
            const progress = this.movementProgress.get(v.id)!;
            if (Math.hypot(v.x - progress.x, v.z - progress.z) > 0.6)
              this.movementProgress.set(v.id, { x: v.x, z: v.z, tick: this.tick });
            else if (wheeled && this.tick - progress.tick >= 180) {
              // Small forward/reverse loops are blocked even when every individual sweep clears.
              this.movementProgress.set(v.id, { x: v.x, z: v.z, tick: this.tick });
              v.nextDrivePlan = 0;
              v.driveControl = null;
              this.requestTraffic(v, body, traffic);
              const escape = yieldPath(this.arena, body, v.angle, traffic);
              if (escape.length) {
                v.path = escape;
                v.yieldUntil = this.tick + 150;
                v.nextPath = v.yieldUntil;
              }
            }
            if (Math.abs(v.speed) < 0.05 && Math.abs(v.yawRate) > 0.1) v.state = 'turning';
            if (
              !aligningHeader &&
              v.path[0] === point &&
              Math.hypot(point[0] - v.x, point[1] - v.z) < (v.path.length === 1 ? 0.005 : 0.36) &&
              (v.path.length !== 1 || Math.abs(v.speed) < 0.05)
            )
              v.path.shift();
            if (!v.path.length && v.yieldUntil > this.tick) {
              v.yieldUntil = 0;
              v.nextPath = 0;
              this.yieldRequests.delete(v.id);
            }
          } else {
            this.recoverTraffic(v, body, traffic);
          }
        } else {
          this.moveVehicle(
            v,
            body,
            traffic,
            null,
            0,
            terrainHandlingFactor(v, grip(this.arena, v.x, v.z)),
          );
          if (yielding) {
            v.yieldUntil = 0;
            v.nextPath = 0;
            this.yieldRequests.delete(v.id);
          } else this.recoverTraffic(v, body, traffic);
        }
      }
      this.vbodies.get(v.id)!.setNextKinematicTranslation({ x: v.x, y: 0.6, z: v.z });
    }
    this.advanceBales();
    this.winds = this.winds.filter((wind) => wind.until > this.tick);
    this.world.step();
    for (const b of this.balloons) {
      const p = this.bodies.get(b.id)!.translation();
      b.x = p.x;
      b.y = p.y;
      b.z = p.z;
    }
    this.events = this.events.filter((e) => this.tick - e.tick < 72);
    this.attacks = this.attacks.filter((e) => this.tick - e.tick < 30);
    this.tick++;
    if (
      this.tick >= 10800 ||
      (this.spawnIndex === this.wave.length && !this.balloons.length && !this.deferred.length)
    ) {
      this.finish(this.balloons.length === 0 && this.pending === 0 ? 'cleared' : 'timeout');
    }
  }
  private addHay(bale: Bale) {
    this.bales.push(bale);
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(bale.x, bale.h / 2, bale.z),
    );
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(bale.w / 2, bale.h / 2, bale.d / 2), body);
    this.baleBodies.set(bale.id, body);
  }
  private removeHay(bale: Bale) {
    const body = this.baleBodies.get(bale.id);
    if (body) this.world.removeRigidBody(body);
    this.baleBodies.delete(bale.id);
    this.bales = this.bales.filter((b) => b.id !== bale.id);
    this.arena.obstacles = this.arena.obstacles.filter((o) => o !== bale);
    this.hayCrushed++;
    this.invalidateHayRoutes();
  }
  private invalidateHayRoutes() {
    for (const vehicle of this.vehicles) {
      vehicle.nextPath = vehicle.nextSelect = vehicle.nextDrivePlan = 0;
    }
  }
  private moveVehicle(
    v: SimVehicle,
    body: TrafficBody,
    traffic: TrafficBody[],
    goal: [number, number] | null,
    speed: number,
    traction: number,
    control?: DriveControl,
  ) {
    let [dx, dz] = driveVehicle(v, v.kind, goal, speed, traction, control);
    const handling = hayHandling(v);
    if (
      handling.mode === 'push' &&
      this.bales.some((b) => touchesHay(b, v.x + dx, v.z + dz, body.radius))
    ) {
      const scale = Math.min(1, handling.pushSpeed / 60 / Math.max(1e-9, Math.hypot(dx, dz)));
      dx *= scale;
      dz *= scale;
      v.speed *= scale;
      v.vx *= scale;
      v.vz *= scale;
    }
    let clear = canTravel(this.arena, body, v.x + dx, v.z + dz, traffic);
    const contacts = !clear
      ? null
      : hayOnSweep(this.arena, body, v.x + dx, v.z + dz)
        ? hayContacts(this.arena, body, v.x + dx, v.z + dz, traffic, Math.hypot(dx, dz))
        : [];
    if (contacts === null) clear = false;
    let clearing = false;
    if (contacts?.length) {
      for (const contact of contacts) {
        const bale = contact.bale as Bale;
        if (handling.mode === 'crush') {
          bale.integrity = Math.max(0, (bale.integrity ?? 1) - handling.crushRate / 60);
          if (bale.integrity <= 0) this.removeHay(bale);
          else clearing = true;
        } else {
          bale.x = contact.x;
          bale.z = contact.z;
          this.baleBodies
            .get(bale.id)
            ?.setTranslation({ x: bale.x, y: bale.h / 2, z: bale.z }, true);
          this.pushedHay.add(bale.id);
          this.hayPushed = this.pushedHay.size;
          // Moving obstacles invalidate other vehicles' route and firing decisions.
          if (this.tick % 15 === 0) this.invalidateHayRoutes();
        }
      }
    }
    if (clearing) {
      if (v.kind !== 'excavator' && v.kind !== 'crane' && v.kind !== 'bulldozer')
        v.angle = v.pangle;
      stopAtCollision(v);
      v.state = 'clearing';
    } else if (clear) {
      v.x += dx;
      v.z += dz;
      body.x = v.x;
      body.z = v.z;
    } else {
      // A sweep rejected the proposed movement: tires cannot turn through the obstruction.
      if (v.kind !== 'excavator' && v.kind !== 'crane' && v.kind !== 'bulldozer')
        v.angle = v.pangle;
      stopAtCollision(v);
      v.nextDrivePlan = 0;
    }
    finishMotionTick(v, v.x - v.px, v.z - v.pz);
    this.aimTool(v);
    this.vbodies.get(v.id)!.setNextKinematicTranslation({ x: v.x, y: 0.6, z: v.z });
    return clear;
  }
  private aimTool(v: SimVehicle) {
    const desired = v.state === 'attacking' ? v.aimAngle : v.angle;
    const step = (v.kind === 'crane' ? 1.8 : 2.6) / 60;
    const turn = angleDifference(desired, v.toolAngle);
    v.toolAngle = angleDifference(v.toolAngle + Math.max(-step, Math.min(step, turn)), 0);
  }
  private requestTraffic(v: SimVehicle, body: TrafficBody, traffic: TrafficBody[]) {
    const target = this.balloons.find((b) => b.id === v.target);
    if (target) {
      // Ask parked traffic on the unobstructed attack route to pull aside.
      // Keep the request alive while we make room for it to leave a narrow bay.
      const s = vehicleStats(v);
      const route = findPath(
        this.arena,
        v.x,
        v.z,
        target.x,
        target.z,
        s.traction,
        new Set(),
        s.range - 0.15,
        body.radius,
        undefined,
        v,
      );
      let from = body;
      for (const [x, z] of route) {
        let requested = false;
        for (const other of traffic) {
          if (
            other.id === v.id ||
            !canTravel(this.arena, from, x, z, [from]) ||
            canTravel(this.arena, from, x, z, [from, other])
          )
            continue;
          const blocker = this.vehicles.find((vehicle) => vehicle.id === other.id)!;
          if (blocker.state === 'idle' || blocker.state === 'attacking') {
            this.yieldRequests.set(other.id, { requester: v.id, until: this.tick + 300 });
            requested = true;
          }
        }
        if (requested) break;
        from = { ...body, x, z };
      }
    }
  }
  private recoverTraffic(v: SimVehicle, body: TrafficBody, traffic: TrafficBody[]) {
    v.wait++;
    v.blockedTicks++;
    v.state = Math.abs(angleDifference(v.angle, v.pangle)) > 0.001 ? 'turning' : 'stuck';
    v.nextDrivePlan = 0;
    if (v.wait > 0 && v.wait % (v.upgrades.traction >= 4 ? 10 : 20) === 0) {
      v.nextPath = 0;
      v.path = [];
      v.yieldUntil = 0;
    }
    if (v.wait >= (v.upgrades.traction >= 4 ? 30 : 60) || v.blockedTicks % 30 === 0) {
      this.requestTraffic(v, body, traffic);
      const path = yieldPath(this.arena, body, v.angle, traffic);
      if (path.length) {
        v.path = path;
        v.yieldUntil = this.tick + 150;
        v.nextPath = v.yieldUntil;
        v.wait = 0;
      } else if (v.wait >= 180) {
        v.blacklist[v.target] = this.tick + 180;
        v.target = -1;
        v.nextSelect = 0;
        v.wait = 0;
      }
    }
  }
  private finish(reason: Summary['reason']) {
    const cleared = reason === 'cleared',
      bonus = cleared
        ? Math.min(MODES[this.run.mode].clearBonus, Math.floor(this.secondsLeft * 0.65))
        : 0,
      base = 160 + this.run.round * 2;
    const best = [...this.vehicles].sort((a, b) => b.pops - a.pops)[0];
    this.summary = {
      reason,
      cleared,
      pops: this.pops,
      popCash: this.popCash,
      baseIncome: base,
      bonus,
      earned: this.popCash + base + bonus,
      livesLost:
        this.balloons.reduce((sum, b) => sum + balloonLives(b), 0) +
        this.deferred.reduce((sum, entry) => sum + balloonLives(entry.s), 0) +
        this.wave.slice(this.spawnIndex).reduce((sum, s) => sum + balloonLives(s), 0),
      seconds: this.tick / 60,
      topVehicle: best ? VEHICLES[best.kind].short : 'None',
      bestStreak: this.rhythm.bestStreak,
      rushes: this.rhythm.rushes,
    };
  }
  replay(): Replay {
    return { run: structuredClone(this.run), commands: structuredClone(this.commands) };
  }
}
