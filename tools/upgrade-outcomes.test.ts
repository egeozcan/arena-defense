import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newRun,
  VEHICLES,
  SURFACE_GRIP,
  type OwnedVehicle,
  type VehicleKind,
  type Spawn,
} from '../src/sim/data';
import { terrainHandlingFactor, terrainSpeedFactor, vehicleStats } from '../src/sim/capabilities';
import { Simulation, initPhysics, type Balloon } from '../src/sim/engine';
import { driveVehicle, motionAt } from '../src/sim/vehicle-motion';
import { hayHandling } from '../src/sim/hay';
import { stockVehicle } from '../src/ui/wave-forecast';
import { upgradeChanges, upgradeCommitment } from '../src/ui/upgrade-preview';

await initPhysics();
const kinds = Object.keys(VEHICLES) as VehicleKind[];
const spawn: Spawn = {
  tick: 0,
  kind: 'basic',
  layer: 1,
  fleeing: false,
  regen: false,
  armor: false,
  gate: 0,
  lane: 0.5,
};
type Point = [number, number, number];

function pin(sim: Simulation, b: Balloon, [x, y, z]: Point) {
  sim.world.forEachRigidBody((body) => {
    const p = body.translation();
    if (Math.hypot(p.x - b.x, p.y - b.y, p.z - b.z) < 0.0001) {
      body.setTranslation({ x, y, z }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });
  Object.assign(b, {
    x,
    px: x,
    y,
    py: y,
    z,
    pz: z,
    float: y,
    baseFloat: y,
    dx: 0,
    dz: 0,
    nextTurn: Infinity,
  });
}
function setup(kind: VehicleKind, upgrades: Partial<OwnedVehicle['upgrades']>, points: Point[]) {
  const run = newRun();
  const v = { ...stockVehicle(kind), id: 1, x: 17, z: 8, targeting: 'Strongest' as const };
  Object.assign(v.upgrades, upgrades);
  run.fleet = [v];
  const sim = new Simulation(run, false, false);
  sim.wave = [...points.map(() => ({ ...spawn })), { ...spawn, tick: 10801 }];
  sim.vehicles[0].attackTick = Infinity;
  sim.step();
  points.forEach((point, i) => pin(sim, sim.balloons[i], point));
  sim.vehicles[0].path = [];
  sim.vehicles[0].nextPath = Infinity;
  return sim;
}
function fire(sim: Simulation, ticks = 1) {
  sim.vehicles[0].attackTick = sim.tick;
  sim.step();
  sim.vehicles[0].attackTick = Infinity;
  for (let i = 1; i < ticks; i++) sim.step();
}
function height(kind: VehicleKind) {
  return kind === 'crane' ? 6 : kind === 'blower' ? 2 : 0.8;
}

// A stream of one-hit targets exposes reload gains that raw DPS against an
// infinite-health dummy misses. Armor trials use stock 6-HP armor instead.
function clearStream(
  kind: VehicleKind,
  path: 'attack' | 'speed' | 'unique',
  tier: number,
  armor = false,
) {
  const points: Point[] =
    path === 'attack' && tier >= 4 && kind === 'crane'
      ? [
          [18, 6, 11.5],
          [21, 6, 11.5],
        ]
      : [[18, height(kind), 11.5]];
  const sim = setup(kind, { [path]: tier }, []);
  const locations = new Map<number, Point>();
  try {
    const targetPops = armor ? 4 : 24;
    while (sim.tick < 2400 && sim.pops < targetPops) {
      if (!sim.balloons.length) {
        const cooldown = sim.vehicles[0].attackTick;
        sim.vehicles[0].attackTick = Infinity;
        sim.wave.splice(
          sim.spawnIndex,
          0,
          ...points.map(() => ({ ...spawn, tick: sim.tick, armor })),
        );
        sim.step();
        locations.clear();
        sim.balloons.forEach((b, i) => {
          b.hp = b.maxHp = armor ? 6 : 1;
          locations.set(b.id, points[i]);
          pin(sim, b, points[i]);
        });
        sim.vehicles[0].attackTick = Number.isFinite(cooldown) ? cooldown : sim.tick;
      }
      for (const b of sim.balloons) pin(sim, b, locations.get(b.id)!);
      sim.step();
    }
    return sim.pops >= targetPops ? sim.tick : Infinity;
  } finally {
    sim.dispose();
  }
}

for (const kind of kinds) {
  for (const tier of [1, 2, 3, 4, 5])
    test(`${kind} Attack ${tier} changes actual clear time${tier === 3 ? ' against armor' : ' on one-hit targets'}`, () => {
      const before = clearStream(kind, 'attack', tier - 1, tier === 3);
      const after = clearStream(kind, 'attack', tier, tier === 3);
      assert.ok(after < before * 0.96, `${before} → ${after} ticks`);
    });
  for (const tier of [2, 4])
    test(`${kind} Speed ${tier} changes actual clear time`, () => {
      const before = clearStream(kind, 'speed', tier - 1);
      const after = clearStream(kind, 'speed', tier);
      assert.ok(after < before * 0.9, `${before} → ${after} ticks`);
    });
  for (const tier of [1, 3, 5])
    test(`${kind} Speed ${tier} reaches a distant target sooner`, () => {
      function travel(speed: number) {
        const v = stockVehicle(kind);
        v.upgrades.speed = speed;
        const s = vehicleStats(v),
          motion = motionAt(0);
        let distance = 0;
        for (let i = 0; i < 120; i++)
          distance += driveVehicle(motion, kind, [0, 100 - distance], s.speed, 1)[1];
        return distance;
      }
      assert.ok(travel(tier) > travel(tier - 1) * 1.1);
    });
  for (const tier of [1, 2, 3, 4, 5])
    test(`${kind} Traction ${tier} changes real braking or rough-lane travel`, () => {
      function outcome(traction: number) {
        const v = stockVehicle(kind);
        v.upgrades.traction = traction;
        const motion = motionAt(0);
        if (tier === 3) {
          const s = vehicleStats(v);
          let distance = 0;
          for (let i = 0; i < 120; i++)
            distance += driveVehicle(
              motion,
              kind,
              [0, 100],
              s.speed * terrainSpeedFactor(v, SURFACE_GRIP.rough),
              terrainHandlingFactor(v, SURFACE_GRIP.rough),
            )[1];
          return distance;
        }
        motion.speed = motion.vz = 6;
        let distance = 0;
        for (let i = 0; i < 600 && motion.speed; i++)
          distance += driveVehicle(
            motion,
            kind,
            null,
            0,
            terrainHandlingFactor(v, SURFACE_GRIP.oil),
          )[1];
        return -distance;
      }
      const before = outcome(tier - 1),
        after = outcome(tier);
      assert.ok(after - before > Math.abs(before) * 0.04, `${before} → ${after} m`);
      if (tier === 4) {
        const a = stockVehicle(kind),
          b = stockVehicle(kind);
        a.upgrades.traction = 3;
        b.upgrades.traction = 4;
        assert.ok(hayHandling(b).pushSpeed > hayHandling(a).pushSpeed);
      }
    });
  test(`${kind} Specialist 1 can hit beyond the stock tool's reach`, () => {
    const range =
      VEHICLES[kind].range + (kind === 'harvester' || kind === 'bulldozer' ? 0.25 : 0.75);
    for (const unique of [0, 1]) {
      const sim = setup(kind, { unique }, [
        [18, height(kind), 8 + VEHICLES[kind].footprint[1] / 2 + range],
      ]);
      try {
        sim.balloons[0].hp = kind === 'blower' ? 0.5 : 1;
        fire(sim, kind === 'baler' ? 40 : 1);
        assert.equal(sim.pops, unique);
      } finally {
        sim.dispose();
      }
    }
  });
}

test('Specialist 2 increases crowd coverage or height for every chassis', () => {
  const cases: Partial<Record<VehicleKind, Point[]>> = {
    harvester: [[18, 1.95, 11.5]],
    sprayer: [
      [18, 0.8, 12.5],
      [19.9, 0.8, 13.5],
    ],
    blower: [
      [18, 2, 12.5],
      [20.1, 2, 13.5],
    ],
    bulldozer: [
      [18, 0.8, 11.5],
      [20.3, 0.8, 10.8],
    ],
    excavator: [
      [18, 0.8, 12.5],
      [18.7, 0.8, 13],
    ],
    mixer: [
      [18, 0.8, 12.5],
      [19.5, 0.8, 12.5],
    ],
    baler: Array.from({ length: 8 }, (_, i) => [18, 0.8, 11 + i * 0.9] as Point),
  };
  for (const kind of kinds) {
    if (kind === 'crane') {
      assert.ok(clearStream(kind, 'unique', 2) < clearStream(kind, 'unique', 1) * 0.85);
      continue;
    }
    const outcomes = [1, 2].map((unique) => {
      const sim = setup(kind, { unique }, cases[kind]!);
      try {
        sim.balloons.forEach((b) => {
          b.hp = kind === 'blower' ? 0.5 : 1;
        });
        fire(sim, kind === 'baler' ? 40 : 1);
        return sim.pops;
      } finally {
        sim.dispose();
      }
    });
    assert.ok(outcomes[1] > outcomes[0], `${kind}: ${outcomes.join(' → ')} pops`);
  }
});

test('Specialist 3 unlocks an effective active tool on every chassis', () => {
  for (const kind of kinds) {
    for (const unique of [2, 3]) {
      const y = height(kind);
      const sim = setup(kind, { unique }, [[18, y, 11.5]]);
      try {
        sim.balloons[0].hp = 1;
        sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
        sim.step();
        assert.equal(sim.vehicles[0].cooldown > sim.tick, unique === 3);
        if (unique === 2) assert.equal(sim.pops, 0);
        else if (kind === 'sprayer') assert.equal(sim.clouds.length, 1);
        else if (kind === 'harvester') assert.ok(sim.vehicles[0].activeUntil > sim.tick);
        else if (kind === 'crane' || kind === 'blower') assert.ok(sim.balloons[0].float < y);
        else {
          for (let i = 0; i < 30; i++) sim.step();
          assert.ok(sim.pops > 0, `${kind}: ability did not pop a target`);
        }
      } finally {
        sim.dispose();
      }
    }
  }
});

test('Specialist 4 adds new reachable hits, control, or armor efficiency', () => {
  const cases: Record<VehicleKind, Point[]> = {
    harvester: [[18, 2.8, 11.5]],
    bulldozer: [[18, 2.6, 11.5]],
    excavator: [
      [18, 0.8, 14],
      [18, 0.8, 7],
    ],
    sprayer: [[18, 0.8, 11.5]],
    mixer: [[18, 0.8, 11.5]],
    crane: [[18, 3.5, 11.5]],
    blower: [[18, 7, 17.5]],
    baler: [
      [18, 0.8, 12.5],
      [19.05, 0.8, 14],
    ],
  };
  for (const kind of kinds) {
    const outcomes = [3, 4].map((unique) => {
      const sim = setup(kind, { unique }, cases[kind]);
      try {
        const first = sim.balloons[0];
        sim.balloons.forEach((b) => {
          b.hp = b.maxHp = 6;
        });
        if (kind === 'sprayer' || kind === 'mixer') first.armor = true;
        if (kind === 'crane') {
          first.kind = 'carrier';
          sim.step();
          return Number(first.slowUntil > sim.tick) + Number(first.baseFloat === 3);
        }
        if (kind === 'blower') {
          sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
          sim.step();
          return Number(first.float === 1.2);
        }
        fire(sim, kind === 'baler' ? 35 : 1);
        return sim.balloons.reduce((sum, b) => sum + 6 - b.hp, 0) + sim.pops * 6;
      } finally {
        sim.dispose();
      }
    });
    assert.ok(outcomes[1] > outcomes[0], `${kind}: ${outcomes.join(' → ')}`);
  }
});

test('Specialist 5 transforms actual crowd outcomes for every chassis', () => {
  const cases: Record<VehicleKind, Point[]> = {
    harvester: [[18, 0.8, 13]],
    sprayer: [
      [18, 0.8, 12.5],
      [18, 0.8, 5.5],
    ],
    excavator: [[18, 0.8, 12.5]],
    crane: [
      [18, 6, 12.5],
      [25, 6, 12.5],
    ],
    baler: [
      [18, 0.8, 12.5],
      [19.5, 0.8, 18.5],
    ],
    blower: [[18, 6, 17]],
    bulldozer: [[18, 0.8, 13.2]],
    mixer: [
      [18, 0.8, 12.5],
      [20.2, 0.8, 12.5],
    ],
  };
  for (const kind of kinds) {
    const outcomes = [4, 5].map((unique) => {
      const sim = setup(kind, { unique }, cases[kind]);
      try {
        const first = sim.balloons[0];
        if (kind === 'harvester') {
          const start = first.z;
          for (let i = 0; i < 30; i++) sim.step();
          return start - first.z;
        }
        if (kind === 'excavator') {
          first.kind = 'layered';
          first.layer = first.maxLayer = 4;
        }
        if (kind === 'blower') {
          first.hp = 10;
          fire(sim);
          const start = first.z;
          for (let i = 0; i < 10; i++) sim.step();
          return start - first.z;
        }
        sim.balloons.forEach((b) => {
          b.hp = kind === 'baler' ? 0.5 : 1;
        });
        fire(sim, kind === 'baler' ? 35 : 1);
        return kind === 'excavator' ? -sim.balloons.length : sim.pops;
      } finally {
        sim.dispose();
      }
    });
    assert.ok(outcomes[1] > outcomes[0], `${kind}: ${outcomes.join(' → ')}`);
  }
});

test('garage previews show actual stat gains and the exact path commitment', () => {
  const v = stockVehicle('harvester');
  assert.match(upgradeChanges(v, 'attack', 1), /Damage 1 → 1.25/);
  assert.match(upgradeChanges(v, 'attack', 1), /Attacks/);
  assert.match(upgradeChanges(stockVehicle('sprayer'), 'unique', 2), /Sweep 40 → 60°/);
  assert.match(upgradeChanges(stockVehicle('sprayer'), 'traction', 3), /Rough control.*Hay push/);
  v.upgrades.speed = 1;
  assert.match(upgradeCommitment(v, 'unique', 1), /Locks Attack and Traction/);
  v.upgrades.unique = 2;
  assert.match(upgradeCommitment(v, 'unique', 3), /Header becomes primary.*Speed stops at tier 2/);
  v.upgrades.unique = 3;
  assert.match(upgradeCommitment(v, 'speed', 3), /Header is primary.*Speed stops at tier 2/);
});

test('Speed wins one-hit streams while Attack wins durable armor', () => {
  const swarmAttack = clearStream('excavator', 'attack', 5);
  const swarmSpeed = clearStream('excavator', 'speed', 5);
  assert.ok(swarmSpeed < swarmAttack * 0.85, `${swarmSpeed} vs ${swarmAttack}`);
  const armorAttack = clearStream('excavator', 'attack', 5, true);
  const armorSpeed = clearStream('excavator', 'speed', 5, true);
  assert.ok(armorAttack < armorSpeed * 0.85, `${armorAttack} vs ${armorSpeed}`);
});

test('Traction wins oily/rough routes while Speed wins clear-floor pursuit', () => {
  function travel(path: 'speed' | 'traction', terrain: number) {
    const v = stockVehicle('sprayer');
    v.upgrades[path] = 5;
    const stats = vehicleStats(v),
      motion = motionAt(0);
    let distance = 0;
    for (let i = 0; i < 180; i++)
      distance += driveVehicle(
        motion,
        'sprayer',
        [0, 100],
        stats.speed * terrainSpeedFactor(v, terrain),
        terrainHandlingFactor(v, terrain),
      )[1];
    return distance;
  }
  assert.ok(travel('speed', 1) > travel('traction', 1) * 1.2);
  assert.ok(travel('traction', SURFACE_GRIP.rough) > travel('speed', SURFACE_GRIP.rough) * 1.5);
});

test('Attack and Specialist sprayers win different crowd/armor matchups', () => {
  const outcomes = [false, true].map((specialist) => {
    const sim = setup('sprayer', specialist ? { unique: 5, attack: 2 } : { attack: 5, unique: 2 }, [
      [18, 0.8, 12],
      [18, 0.8, 6],
    ]);
    try {
      fire(sim);
      return sim.pops;
    } finally {
      sim.dispose();
    }
  });
  assert.deepEqual(
    outcomes,
    [1, 2],
    'fog clears behind the vehicle; Attack retains a directional cone',
  );
  assert.ok(
    clearStream('sprayer', 'attack', 5, true) < clearStream('sprayer', 'unique', 5, true) * 0.7,
  );
});
