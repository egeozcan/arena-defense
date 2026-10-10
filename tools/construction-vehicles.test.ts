import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, VEHICLES, type OwnedVehicle, type VehicleKind } from '../src/sim/data';
import { armorDamageFactor, vehicleStats, vehicleTool } from '../src/sim/capabilities';
import { Simulation, initPhysics, type Balloon } from '../src/sim/engine';
import { toolVictims } from '../src/sim/vehicle-tools';
import { stockVehicle } from '../src/ui/wave-forecast';

await initPhysics();

function setup(kind: VehicleKind, unique = 0) {
  const run = newRun();
  const vehicle: OwnedVehicle = { ...stockVehicle(kind), id: 1, x: 17, z: 8 };
  vehicle.upgrades.unique = unique;
  run.fleet = [vehicle];
  const sim = new Simulation(run);
  sim.wave = Array.from({ length: 2 }, () => ({
    tick: 0,
    kind: 'basic' as const,
    layer: 1,
    fleeing: false,
    regen: false,
    armor: false,
    gate: 0,
    lane: 0.5,
  }));
  sim.vehicles[0].attackTick = Infinity;
  sim.step();
  return sim;
}

function move(sim: Simulation, b: Balloon, x: number, y: number, z: number) {
  sim.world.forEachRigidBody((body) => {
    const p = body.translation();
    if (Math.hypot(p.x - b.x, p.y - b.y, p.z - b.z) < 0.0001) {
      body.setTranslation({ x, y, z }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });
  b.x = b.px = x;
  b.y = b.py = b.float = b.baseFloat = y;
  b.z = b.pz = z;
  b.dx = b.dz = 0;
  b.nextTurn = Infinity;
  b.hp = b.maxHp = 100;
}

test('construction chassis occupy separate price, height, and armor roles', () => {
  const dozer = stockVehicle('bulldozer'),
    mixer = stockVehicle('mixer');
  assert.ok(VEHICLES.bulldozer.cost > VEHICLES.harvester.cost);
  assert.ok(VEHICLES.mixer.cost > VEHICLES.baler.cost);
  assert.equal(armorDamageFactor(dozer), 0.75);
  assert.equal(armorDamageFactor(mixer), 0.5);
  dozer.upgrades.unique = 4;
  mixer.upgrades.unique = 4;
  assert.equal(vehicleStats(dozer).max, 2.8);
  assert.equal(armorDamageFactor(mixer), 1);
  dozer.upgrades.unique = 5;
  mixer.upgrades.unique = 5;
  assert.equal(vehicleStats(dozer).range, 4);
  assert.equal(vehicleTool(mixer).splash, 2.5);
});

test('blade widens to catch side targets while concrete splash grows through upgrades', () => {
  const dozer = stockVehicle('bulldozer'),
    mixer = stockVehicle('mixer');
  const target = { id: 1, x: 0, y: 1, z: 2 };
  const side = { id: 2, x: 2, y: 1, z: 1.7 };
  assert.deepEqual(
    toolVictims(dozer, target, [target, side], 0, 0, 0).map((b) => b.id),
    [1],
  );
  dozer.upgrades.unique = 2;
  assert.deepEqual(
    toolVictims(dozer, target, [target, side], 0, 0, 0).map((b) => b.id),
    [1, 2],
  );
  const splash = { id: 3, x: 1.5, y: 1, z: 2 };
  assert.deepEqual(
    toolVictims(mixer, target, [target, splash], 0, 0, 0).map((b) => b.id),
    [1],
  );
  mixer.upgrades.unique = 2;
  assert.deepEqual(
    toolVictims(mixer, target, [target, splash], 0, 0, 0).map((b) => b.id),
    [1, 3],
  );
});

test('stock construction tools attack real nearby packs at their advertised armor factors', () => {
  for (const kind of ['bulldozer', 'mixer'] as const) {
    const sim = setup(kind);
    try {
      const v = sim.vehicles[0];
      move(sim, sim.balloons[0], v.x, 1, v.z + 2);
      move(sim, sim.balloons[1], v.x + 0.6, 1, v.z + 2);
      sim.balloons[0].armor = true;
      v.angle = 0;
      v.attackTick = sim.tick;
      sim.step();
      assert.equal(
        sim.balloons[0].hp,
        100 - VEHICLES[kind].damage * armorDamageFactor(sim.vehicles[0]),
      );
      assert.equal(sim.balloons[1].hp, 100 - VEHICLES[kind].damage);
    } finally {
      sim.dispose();
    }
  }
});

test('bulldozer blade sweep and mixer slab drop hit groups and honor cooldowns', () => {
  for (const kind of ['bulldozer', 'mixer'] as const) {
    const sim = setup(kind, 3);
    try {
      move(sim, sim.balloons[0], 17, 1, 10);
      move(sim, sim.balloons[1], 18, 1, 10);
      sim.balloons[0].armor = true;
      sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
      sim.step();
      assert.ok(
        sim.balloons.every((b) => b.hp < 100),
        `${kind} should hit the group`,
      );
      const hp = sim.balloons.map((b) => b.hp);
      const cooldown = sim.vehicles[0].cooldown;
      sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
      sim.step();
      assert.equal(sim.vehicles[0].cooldown, cooldown);
      assert.deepEqual(
        sim.balloons.map((b) => b.hp),
        hp,
      );
    } finally {
      sim.dispose();
    }
  }
});

test('an upgraded construction pair replays the same wave and ability commands', () => {
  const run = { ...newRun(), round: 8 };
  run.fleet = (['bulldozer', 'mixer'] as const).map((kind, i) => ({
    ...stockVehicle(kind),
    id: i + 1,
    x: 17 + i * 5,
    z: 8,
    upgrades: { attack: 2, speed: 0, traction: 0, unique: 3 },
  }));
  const sims = [new Simulation(run), new Simulation(run)];
  try {
    for (const sim of sims)
      for (let tick = 0; tick < 1200; tick++) {
        if (tick === 180 || tick === 1000) {
          sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
          sim.enqueue({ ability: 'vehicle', vehicleId: 2 });
        }
        sim.step();
      }
    assert.ok(sims[0].pops > 0);
    assert.deepEqual(sims[0].balloons, sims[1].balloons);
    assert.deepEqual(sims[0].events, sims[1].events);
    assert.equal(sims[0].pops, sims[1].pops);
  } finally {
    sims.forEach((sim) => sim.dispose());
  }
});
