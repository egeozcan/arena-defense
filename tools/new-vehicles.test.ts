import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, type OwnedVehicle } from '../src/sim/data';
import { armorDamageFactor, canTargetBalloon, vehicleStats } from '../src/sim/capabilities';
import { Simulation, initPhysics, type Balloon } from '../src/sim/engine';
import { coverageFor, stockVehicle } from '../src/ui/wave-forecast';

await initPhysics();
function setup(kind: 'baler' | 'blower', unique = 0, count = 6) {
  const run = newRun();
  const vehicle: OwnedVehicle = { ...stockVehicle(kind), id: 1, x: 17, z: 8 };
  vehicle.upgrades.unique = unique;
  run.fleet = [vehicle];
  const sim = new Simulation(run);
  sim.wave = Array.from({ length: count }, () => ({
    tick: 0,
    kind: 'basic',
    layer: 1,
    fleeing: false,
    regen: false,
    armor: false,
    gate: 0,
    lane: 0.5,
  }));
  sim.vehicles[0].attackTick = Infinity;
  sim.step();
  for (const [i, b] of sim.balloons.entries()) moveBalloon(sim, b, 18, 2, 11 + i);
  return sim;
}
function moveBalloon(sim: Simulation, b: Balloon, x: number, y: number, z: number) {
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
function fireOnce(sim: Simulation) {
  sim.vehicles[0].attackTick = sim.tick;
  sim.step();
  sim.vehicles[0].attackTick = Infinity;
}

test('bales travel before damage, pierce in order, and never hit a balloon twice', () => {
  const sim = setup('baler');
  try {
    fireOnce(sim);
    assert.equal(sim.shots.length, 1);
    assert.ok(sim.balloons.every((b) => b.hp === 100));
    for (let i = 0; i < 35; i++) sim.step();
    assert.deepEqual(
      sim.balloons.map((b) => b.hp),
      [98, 98, 98, 98, 100, 100],
    );
    assert.equal(sim.shots.length, 0);
  } finally {
    sim.dispose();
  }
});

test('Bale Press adds pierce, width, and a damaging straw burst at the endpoint', () => {
  const sim = setup('baler', 5, 9);
  try {
    // The final target is beside the shot endpoint, outside even the upgraded bale width.
    moveBalloon(sim, sim.balloons[8], 19.5, 2, 18.5);
    fireOnce(sim);
    assert.equal(sim.shots[0].pierce, 12);
    assert.equal(sim.shots[0].radius, 0.65);
    for (let i = 0; i < 35; i++) sim.step();
    assert.ok(sim.balloons.slice(0, 8).every((b) => b.hp <= 98));
    assert.equal(sim.balloons[8].hp, 99, 'straw reaches the nearby off-line target');
  } finally {
    sim.dispose();
  }
});

test('bales stop at scenery rather than damaging targets behind it', () => {
  const sim = setup('baler');
  try {
    fireOnce(sim);
    assert.equal(sim.shots.length, 1);
    sim.arena.obstacles.push({ x: 18, z: 13, w: 2, d: 1, h: 3, kind: 'hay' });
    for (let i = 0; i < 35; i++) sim.step();
    assert.ok(sim.balloons.slice(3).every((b) => b.hp === 100));
    assert.equal(sim.shots.length, 0);
  } finally {
    sim.dispose();
  }
});

test('a baler repositions around scenery to fire rather than staying in obstructed range', () => {
  const sim = setup('baler', 0, 1);
  try {
    moveBalloon(sim, sim.balloons[0], 18, 2, 16);
    sim.balloons[0].hp = 1;
    sim.arena.obstacles.push({ x: 18, z: 13, w: 2, d: 1, h: 3, kind: 'hay' });
    sim.vehicles[0].attackTick = sim.tick;
    const startX = sim.vehicles[0].x,
      startZ = sim.vehicles[0].z;
    while (!sim.summary && sim.tick < 1200) sim.step();
    assert.equal(sim.summary?.cleared, true);
    assert.ok(Math.hypot(sim.vehicles[0].x - startX, sim.vehicles[0].z - startZ) > 1);
  } finally {
    sim.dispose();
  }
});

test('a baler can aim at a close mid-height balloon without shooting underneath it', () => {
  const sim = setup('baler', 0, 1);
  try {
    moveBalloon(sim, sim.balloons[0], 18, 4, 10.5);
    fireOnce(sim);
    for (let i = 0; i < 10; i++) sim.step();
    assert.equal(sim.balloons[0].hp, 98);
  } finally {
    sim.dispose();
  }
});

test('Bale Barrage launches three fan shots and respects unlock and cooldown', () => {
  const sim = setup('baler', 2, 1);
  try {
    sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
    sim.step();
    assert.equal(sim.shots.length, 0);
    sim.vehicles[0].upgrades.unique = 3;
    sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
    sim.step();
    assert.equal(sim.shots.length, 3);
    assert.equal(new Set(sim.shots.map((shot) => shot.dx)).size, 3);
    const cooldown = sim.vehicles[0].cooldown;
    sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
    sim.step();
    assert.equal(sim.shots.length, 3);
    assert.equal(sim.vehicles[0].cooldown, cooldown);
  } finally {
    sim.dispose();
  }
});

test('blower gusts push a surviving pack toward a baler and expire', () => {
  const sim = setup('blower', 3, 1);
  try {
    const partner: OwnedVehicle = { ...stockVehicle('baler'), id: 2, x: 21, z: 8.5 };
    // Use the actual constructor so both vehicles receive bodies and routing state.
    const run = { ...sim.run, fleet: [...sim.run.fleet, partner] };
    const combined = new Simulation(run);
    try {
      combined.wave = structuredClone(sim.wave);
      combined.vehicles.forEach((v) => (v.attackTick = Infinity));
      combined.step();
      moveBalloon(combined, combined.balloons[0], 18, 2, 14);
      combined.vehicles[1].aimAngle = 0;
      fireOnce(combined);
      assert.ok(combined.winds.length > 0);
      assert.equal(combined.balloons[0].hp, 99.5);
      const initialX = combined.balloons[0].x;
      for (let i = 0; i < 30; i++) combined.step();
      assert.ok(
        combined.balloons[0].x > initialX + 0.2,
        `x=${combined.balloons[0].x}, initial=${initialX}, wind=${JSON.stringify(combined.winds)}`,
      );
      assert.equal(combined.winds.length, 0);
    } finally {
      combined.dispose();
    }
  } finally {
    sim.dispose();
  }
});

test('Downburst lowers a group including armor, restores height, and respects cooldown', () => {
  const sim = setup('blower', 3, 2);
  try {
    moveBalloon(sim, sim.balloons[0], 18, 7, 11);
    moveBalloon(sim, sim.balloons[1], 18, 8, 13);
    sim.balloons[1].armor = true;
    sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
    sim.step();
    assert.deepEqual(
      sim.balloons.map((b) => b.float),
      [1.2, 1.2],
    );
    const until = sim.balloons[0].lowerUntil;
    sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
    sim.step();
    assert.equal(sim.balloons[0].lowerUntil, until);
    while (sim.tick <= until) sim.step();
    assert.deepEqual(
      sim.balloons.map((b) => b.float),
      [7, 8],
    );
  } finally {
    sim.dispose();
  }
});

test('new vehicle coverage and armor follow their documented limits and upgrades', () => {
  const baler = stockVehicle('baler'),
    blower = stockVehicle('blower');
  assert.equal(armorDamageFactor(baler), 0.25);
  assert.equal(armorDamageFactor(blower), 0);
  assert.equal(canTargetBalloon(blower, 0.7, false), false);
  assert.equal(coverageFor([baler, blower], 0.6, 11.8, false), 'covered');
  assert.equal(coverageFor([blower], 6, 11.8, true), 'uncovered');
  blower.upgrades.attack = 3;
  assert.equal(coverageFor([blower], 6, 11.8, true), 'covered');
  blower.upgrades.unique = 4;
  assert.equal(vehicleStats(blower).max, 14);
});

test('new tools and ticked abilities replay deterministically with a mixed fleet', () => {
  const run = { ...newRun(), round: 10 };
  run.fleet = ['baler', 'blower', 'excavator'].map((kind, i) => ({
    ...stockVehicle(kind as OwnedVehicle['kind']),
    id: i + 1,
    x: 10 + i * 4,
    z: 8,
    upgrades: { attack: 2, speed: 0, traction: 0, unique: 5 },
  }));
  const sims = [new Simulation(run), new Simulation(run)];
  try {
    for (const sim of sims)
      for (let tick = 0; tick < 2400; tick++) {
        if (tick === 180 || tick === 2000) {
          sim.enqueue({ ability: 'vehicle', vehicleId: 1 });
          sim.enqueue({ ability: 'vehicle', vehicleId: 2 });
        }
        sim.step();
      }
    assert.ok(sims[0].pops > 0);
    assert.deepEqual(sims[0].balloons, sims[1].balloons);
    assert.deepEqual(sims[0].shots, sims[1].shots);
    assert.deepEqual(sims[0].winds, sims[1].winds);
    assert.deepEqual(sims[0].summary, sims[1].summary);
    assert.deepEqual(sims[0].replay(), sims[1].replay());
  } finally {
    sims.forEach((sim) => sim.dispose());
  }
});
