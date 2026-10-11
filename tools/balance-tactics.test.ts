import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun } from '../src/sim/data';
import { canTargetBalloon } from '../src/sim/capabilities';
import { initPhysics, Simulation } from '../src/sim/engine';
import { stockVehicle } from '../src/ui/wave-forecast';
import { responsiveCommands } from './balance-tactics';

await initPhysics();

test('responsive Downburst lowers an armor-only crowd for a ground teammate', () => {
  const run = newRun();
  const blower = { ...stockVehicle('blower'), id: 1, x: 17, z: 8 };
  blower.upgrades = { attack: 2, speed: 0, traction: 0, unique: 5 };
  run.fleet = [blower, { ...stockVehicle('excavator'), id: 2, x: 20, z: 8 }];
  const sim = new Simulation(run, false, false);
  try {
    const spawn = {
      tick: 0,
      kind: 'high' as const,
      layer: 1,
      fleeing: false,
      regen: false,
      armor: true,
      gate: 0,
      lane: 0.5,
    };
    sim.wave = [spawn, { ...spawn, tick: 10801 }];
    for (const v of sim.vehicles) v.attackTick = Infinity;
    sim.step();
    const b = sim.balloons[0];
    sim.world.forEachRigidBody((body) => {
      const p = body.translation();
      if (Math.hypot(p.x - b.x, p.y - b.y, p.z - b.z) < 0.0001) {
        body.setTranslation({ x: 18, y: 7, z: 10 }, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    });
    Object.assign(b, {
      x: 18,
      px: 18,
      y: 7,
      py: 7,
      z: 10,
      pz: 10,
      float: 7,
      baseFloat: 7,
      dx: 0,
      dz: 0,
      nextTurn: Infinity,
      hp: 1,
      maxHp: 1,
    });
    assert.equal(canTargetBalloon(sim.vehicles[0], b.y, b.armor), false);
    assert.equal(canTargetBalloon(sim.vehicles[1], b.y, b.armor), false);
    const commands = responsiveCommands(sim);
    assert.deepEqual(
      commands.filter((c) => c.ability === 'vehicle'),
      [{ ability: 'vehicle', vehicleId: 1 }],
    );
    for (const command of commands) sim.enqueue(command);
    sim.step();
    assert.equal(b.float, 1.2);
    assert.equal(b.hp, 1, 'lowering is support, not free armor damage');
    assert(
      !responsiveCommands(sim).some((c) => c.ability === 'vehicle'),
      'normal cooldown prevents reuse',
    );
    sim.vehicles[1].attackTick = sim.tick;
    for (let i = 0; i < 300 && !sim.pops; i++) sim.step();
    assert.equal(
      sim.vehicles[1].pops,
      1,
      'the ground teammate finishes the lowered armored target',
    );
    assert.equal(sim.vehicles[0].pops, 0);
  } finally {
    sim.dispose();
  }
});
