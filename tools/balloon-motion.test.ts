import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arenaFor, newRun, Random, type BalloonKind } from '../src/sim/data';
import { initPhysics, Simulation } from '../src/sim/engine';
import { chooseBalloonHeading } from '../src/sim/balloon-motion';
await initPhysics();

function solitary(kind: BalloonKind, fleeing = false) {
  const sim = new Simulation(newRun('easy', 'yard'));
  sim.wave = [
    {
      tick: 0,
      gate: 0,
      lane: 0.5,
      kind,
      layer: 1,
      fleeing,
      regen: false,
      armor: kind === 'armored',
    },
  ];
  sim.step();
  return sim;
}

test('every balloon visibly drifts, with armored balloons and carriers moving more slowly', () => {
  const distances = new Map<BalloonKind, number>();
  for (const kind of ['basic', 'layered', 'armored', 'high', 'carrier'] as BalloonKind[]) {
    const sim = solitary(kind);
    const b = sim.balloons[0],
      start = { x: b.x, z: b.z };
    for (let tick = 0; tick < 150; tick++) sim.step();
    const distance = Math.hypot(b.x - start.x, b.z - start.z);
    assert.ok(distance > 0.5, `${kind} only moved ${distance}m in 2.5s`);
    distances.set(kind, distance);
    sim.dispose();
  }
  assert.ok(distances.get('basic')! > 1.8);
  assert.ok(distances.get('basic')! > distances.get('armored')! * 2);
  assert.ok(distances.get('high')! > distances.get('carrier')!);
});

test('a heading is held between steering decisions spaced three to five seconds apart', () => {
  const sim = solitary('basic', true);
  try {
    const b = sim.balloons[0];
    let lastTurn = 0,
      decisions = 0;
    for (let tick = 0; tick < 1200; tick++) {
      const before = { dx: b.dx, dz: b.dz, due: b.nextTurn };
      sim.step();
      if (b.nextTurn === before.due) {
        assert.equal(b.dx, before.dx);
        assert.equal(b.dz, before.dz);
      } else {
        const at = sim.tick - 1;
        assert.equal(at, before.due);
        assert.ok(at - lastTurn >= 180 && at - lastTurn <= 300);
        assert.ok(b.nextTurn - at >= 180 && b.nextTurn - at <= 300);
        decisions++;
        lastTurn = at;
      }
    }
    assert.ok(decisions >= 4);
  } finally {
    sim.dispose();
  }
});

test('fleeing balloons choose an evasive heading without steering through walls or low scenery', () => {
  const arena = arenaFor('yard');
  arena.obstacles = [];
  const b = { kind: 'basic' as const, x: 16, y: 1, z: 16, dx: 1, dz: 0, fleeing: true };
  const away = chooseBalloonHeading(arena, b, [{ x: 17, z: 16 }], new Random(3));
  assert.equal(away.dodge, true);
  assert.ok(away.dx < 0, 'a threat ahead should provoke an evasive turn');
  const edge = chooseBalloonHeading(arena, { ...b, x: arena.width - 1 }, [], new Random(3));
  assert.ok(edge.dx < 0, 'a balloon should turn back from the wall');
  arena.obstacles = [{ x: 7, z: 16, w: 2, d: 4, h: 2, kind: 'pile' }];
  const low = chooseBalloonHeading(arena, { ...b, x: 4, fleeing: false }, [], new Random(3));
  const high = chooseBalloonHeading(
    arena,
    { ...b, x: 4, y: 7, kind: 'high', fleeing: false },
    [],
    new Random(3),
  );
  assert.ok(low.dx < 0.85, 'low balloon should find an open path beside the pile');
  assert.ok(high.dx > 0.85, 'high balloon should be allowed to drift above the pile');
});
