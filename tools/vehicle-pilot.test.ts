import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newRun,
  vehicleRadius,
  clearPosition,
  type OwnedVehicle,
  type VehicleKind,
  type BalloonKind,
} from '../src/sim/data';
import {
  Simulation,
  initPhysics,
  vehicleStats,
  type Balloon,
  type Command,
} from '../src/sim/engine';
import {
  driverEye,
  canSwitchDriverSide,
  driverAreaTargets,
  driverTarget,
  neutralDriverInput,
  sanitizeDriverInput,
  type DriverInput,
} from '../src/sim/vehicle-pilot';
import { angleDifference } from '../src/sim/vehicle-motion';

await initPhysics();
function vehicle(kind: VehicleKind, id = 1, x = 8, z = 16): OwnedVehicle {
  return {
    id,
    kind,
    x,
    z,
    rotation: 0,
    targeting: 'Nearest',
    placed: true,
    spent: 400,
    upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
  };
}
function makeSim(kind: VehicleKind = 'sprayer', balloonKind: BalloonKind = 'basic') {
  const run = newRun('easy', 'yard');
  run.fleet = [vehicle(kind)];
  const sim = new Simulation(run);
  sim.wave = [
    {
      tick: 0,
      kind: balloonKind,
      layer: 1,
      fleeing: false,
      regen: false,
      armor: false,
      gate: 0,
      lane: 0.5,
    },
  ];
  sim.enqueue({ ability: 'pilot', vehicleId: 1 });
  sim.step();
  return sim;
}
function control(sim: Simulation, change: Partial<DriverInput>, ticks = 1) {
  sim.enqueue({
    ability: 'drive',
    vehicleId: sim.driverId!,
    input: { ...neutralDriverInput(), ...change },
  });
  for (let i = 0; i < ticks && !sim.summary; i++) sim.step();
}
function aimAt(sim: Simulation, b: Balloon): DriverInput {
  const v = sim.vehicles[0];
  const [cx, cy, cz] = driverEye(v.kind);
  const dx = b.x - v.x - Math.sin(v.angle) * cz - Math.cos(v.angle) * cx;
  const dz = b.z - v.z - Math.cos(v.angle) * cz + Math.sin(v.angle) * cx;
  return {
    ...neutralDriverInput(),
    yaw: angleDifference(Math.atan2(dx, dz), v.angle),
    pitch: Math.atan2(b.y - cy, Math.hypot(dx, dz)),
  };
}

for (const kind of [
  'harvester',
  'sprayer',
  'excavator',
  'crane',
  'baler',
  'blower',
  'bulldozer',
  'mixer',
] as const) {
  test(`${kind}: manual control replaces pursuit and preserves acceleration, reverse and braking`, () => {
    const sim = makeSim(kind);
    try {
      const v = sim.vehicles[0];
      const initial = [v.x, v.z];
      for (let i = 0; i < 90; i++) sim.step();
      assert.deepEqual([v.x, v.z], initial, 'neutral driver must not chase balloons');
      assert.equal(v.pops, 0);
      control(sim, { throttle: 1 });
      assert.ok(v.speed > 0 && v.speed < 0.25, 'acceleration must be gradual');
      control(sim, { throttle: 1 }, 45);
      assert.ok(v.z > initial[1] + 0.4);
      control(sim, { brake: true }, 90);
      assert.equal(v.speed, 0);
      const stoppedZ = v.z;
      control(sim, { throttle: -1 }, 90);
      assert.ok(v.speed < 0 && v.z < stoppedZ - 0.4);
      assert.equal(sim.vehicleStatus(v), 'Player driving');
    } finally {
      sim.dispose();
    }
  });
}

test('crawler pivots on opposing tracks; wheels need motion to steer', () => {
  for (const kind of ['excavator', 'crane', 'bulldozer', 'sprayer'] as const) {
    const sim = makeSim(kind);
    try {
      const v = sim.vehicles[0],
        initial = [v.x, v.z];
      control(sim, { steer: 1 }, 60);
      assert.deepEqual([v.x, v.z], initial);
      if (kind === 'sprayer') assert.equal(v.angle, 0);
      else {
        assert.ok(v.angle > 0.5 && v.angle < 2.3);
        assert.ok(v.leftTravel > 0 && v.rightTravel < 0);
      }
    } finally {
      sim.dispose();
    }
  }
});

test('player respects swept collisions against boundaries, scenery and parked fleet', () => {
  const run = newRun('easy', 'yard');
  run.fleet = [vehicle('sprayer', 1, 7, 15), vehicle('harvester', 2, 7, 21)];
  const sim = new Simulation(run);
  try {
    sim.wave.forEach((s) => (s.tick += 9000));
    sim.enqueue({ ability: 'pilot', vehicleId: 1 });
    sim.step();
    control(sim, { throttle: 1 }, 240);
    const [v, parked] = sim.vehicles;
    assert.ok(
      Math.hypot(v.x - parked.x, v.z - parked.z) >= vehicleRadius(v) + vehicleRadius(parked),
    );
    assert.equal(v.speed, 0);
    assert.equal(v.state, 'stuck');
    // Reverse reaches the arena boundary and remains clear instead of tunnelling.
    control(sim, { throttle: -1 }, 900);
    assert.ok(clearPosition(sim.arena, v.x, v.z, vehicleRadius(v)));
    assert.ok(v.z >= vehicleRadius(v));
    assert.equal(v.speed, 0);
  } finally {
    sim.dispose();
  }
  const scenery = makeSim();
  try {
    const obstacle = scenery.arena.obstacles.find((o) => o.w > 3)!;
    const v = scenery.vehicles[0];
    v.x = obstacle.x;
    v.z = obstacle.z - obstacle.d / 2 - vehicleRadius(v) - 1;
    v.px = v.x;
    v.pz = v.z;
    v.angle = v.pangle = 0;
    control(scenery, { throttle: 1 }, 180);
    assert.ok(clearPosition(scenery.arena, v.x, v.z, vehicleRadius(v)));
    assert.equal(v.state, 'stuck');
  } finally {
    scenery.dispose();
  }
});

test('a manual tool only damages an aimed, eligible balloon in reach while held', () => {
  const sim = makeSim('sprayer');
  try {
    const v = sim.vehicles[0],
      b = sim.balloons[0];
    v.x = b.x + 2.5;
    v.z = b.z;
    v.px = v.x;
    v.pz = v.z;
    v.angle = v.pangle = -Math.PI / 2;
    const aim = aimAt(sim, b);
    control(sim, aim, 15);
    assert.equal(sim.pops, 0, 'aiming alone must not fire');
    control(sim, { ...aim, fire: true });
    assert.equal(sim.pops, 1);
    assert.equal(v.pops, 1);
  } finally {
    sim.dispose();
  }
});

for (const kind of ['sprayer', 'excavator', 'crane', 'baler', 'blower', 'mixer'] as const) {
  test(`${kind}: tool needs activation and its real attack damages an eligible target`, () => {
    const sim = makeSim(kind, kind === 'crane' ? 'high' : kind === 'blower' ? 'carrier' : 'basic');
    try {
      const v = sim.vehicles[0],
        b = sim.balloons[0];
      v.x = b.x + 2.5;
      v.z = b.z;
      v.px = v.x;
      v.pz = v.z;
      v.angle = v.pangle = -Math.PI / 2;
      const health = b.hp;
      control(sim, aimAt(sim, b), 15);
      assert.equal(b.hp, health, 'idle equipment must not damage the target');
      assert.equal(sim.pops, 0);
      control(sim, { ...aimAt(sim, b), fire: true }, 60);
      assert.ok(
        b.hp < health || !sim.balloons.includes(b),
        'activation must cause damage, not just an effect',
      );
    } finally {
      sim.dispose();
    }
  });
}

for (const kind of ['sprayer', 'blower'] as const) {
  test(`${kind}: holding fire damages its full cone when the reticle is between balloons`, () => {
    const sim = makeSim(kind, kind === 'blower' ? 'carrier' : 'basic');
    try {
      const v = sim.vehicles[0],
        b = sim.balloons[0];
      v.x = 12;
      v.z = 24;
      v.px = v.x;
      v.pz = v.z;
      v.angle = v.pangle = -Math.PI / 2;
      const reach = kind === 'blower' ? 5.8 : 4.8;
      b.x = v.x + Math.sin(v.angle + 0.33) * reach;
      b.z = v.z + Math.cos(v.angle + 0.33) * reach;
      const input = { ...neutralDriverInput(), pitch: -1.05 };
      assert.equal(
        driverTarget(v, input, [b]),
        undefined,
        'the reticle must miss for this regression',
      );
      const health = b.hp;
      control(sim, { ...input, fire: true });
      assert.ok(
        b.hp < health || !sim.balloons.includes(b),
        'the working spray/airflow cone must still hit',
      );
    } finally {
      sim.dispose();
    }
  });
}

test('a driven harvester cuts front contact without clicking or looking at the balloon', () => {
  const sim = makeSim('harvester');
  try {
    const v = sim.vehicles[0],
      b = sim.balloons[0];
    v.x = b.x + 1.8;
    v.z = b.z;
    v.px = v.x;
    v.pz = v.z;
    v.angle = v.pangle = -Math.PI / 2;
    control(sim, { yaw: 2.4, pitch: 1.1 });
    assert.equal(sim.driverInput.fire, false);
    assert.equal(
      sim.pops,
      1,
      'the powered header must cut on contact independently of mouse input',
    );
    assert.equal(v.pops, 1);
  } finally {
    sim.dispose();
  }
});

test('a bulldozer plows front contact without a fire button or camera aim', () => {
  const sim = makeSim('bulldozer');
  try {
    const v = sim.vehicles[0],
      b = sim.balloons[0];
    v.x = b.x + 1.8;
    v.z = b.z;
    v.px = v.x;
    v.pz = v.z;
    v.angle = v.pangle = -Math.PI / 2;
    control(sim, { yaw: 2.4, pitch: 1.1 });
    assert.equal(sim.driverInput.fire, false);
    assert.equal(sim.pops, 1, 'driving a blade into a balloon must plow it automatically');
  } finally {
    sim.dispose();
  }
});

test('a bulldozer blade cannot hit a balloon behind the chassis', () => {
  const sim = makeSim('bulldozer');
  try {
    const v = sim.vehicles[0],
      b = sim.balloons[0];
    v.x = b.x + 1.7;
    v.z = b.z;
    v.px = v.x;
    v.pz = v.z;
    v.angle = v.pangle = Math.PI / 2 - 0.9;
    control(sim, { ...aimAt(sim, b), fire: true }, 30);
    assert.equal(sim.pops, 0);
    assert.equal(
      sim.attacks.length,
      0,
      'clicking must not swing the passive blade behind the chassis',
    );
  } finally {
    sim.dispose();
  }
});

test('automatic bulldozer contact uses the upgraded blade width rather than reticle facing', () => {
  for (const unique of [0, 2]) {
    const sim = makeSim('bulldozer');
    try {
      const v = sim.vehicles[0],
        b = sim.balloons[0];
      v.upgrades.unique = unique;
      v.x = b.x + 2;
      v.z = b.z;
      v.px = v.x;
      v.pz = v.z;
      v.angle = v.pangle = -Math.PI / 2 + 1;
      control(sim, { yaw: 2.4, pitch: 1.1 });
      assert.equal(sim.pops, unique >= 2 ? 1 : 0);
    } finally {
      sim.dispose();
    }
  }
});

test('automatic bulldozer contact damages armor and leaves balloons above the blade alone', () => {
  for (const kind of ['armored', 'carrier'] as const) {
    const sim = makeSim('bulldozer', kind);
    try {
      const v = sim.vehicles[0],
        b = sim.balloons[0];
      v.x = b.x + 1.8;
      v.z = b.z;
      v.px = v.x;
      v.pz = v.z;
      v.angle = v.pangle = -Math.PI / 2;
      const health = b.hp;
      control(sim, { yaw: 2.4, pitch: 1.1 });
      assert.equal(b.hp, kind === 'armored' ? health - vehicleStats(v).damage * 0.75 : health);
    } finally {
      sim.dispose();
    }
  }
});

test('a powered header retains height, armor and range limits', () => {
  for (const failure of ['height', 'armor', 'range'] as const) {
    const sim = makeSim('harvester');
    try {
      const v = sim.vehicles[0],
        b = sim.balloons[0];
      v.x = b.x + (failure === 'range' ? 7 : 1.8);
      v.z = b.z;
      v.px = v.x;
      v.pz = v.z;
      v.angle = v.pangle = -Math.PI / 2;
      if (failure === 'height') b.y = b.float = b.baseFloat = 5;
      if (failure === 'armor') b.armor = true;
      control(sim, neutralDriverInput());
      assert.equal(sim.pops, 0, failure);
      assert.equal(v.attackTick, 0, 'an ineligible balloon must not trigger the header');
    } finally {
      sim.dispose();
    }
  }
});

test('driving into a balloon engages the header without firing', () => {
  const sim = makeSim('harvester');
  try {
    const v = sim.vehicles[0],
      b = sim.balloons[0];
    v.x = b.x + 3.2;
    v.z = b.z;
    v.px = v.x;
    v.pz = v.z;
    v.angle = v.pangle = -Math.PI / 2;
    sim.step();
    assert.equal(sim.pops, 0, 'the header must not cut beyond its reach');
    control(sim, { throttle: 1, yaw: 2.4, pitch: 1.1 }, 90);
    assert.equal(sim.driverInput.fire, false);
    assert.equal(sim.pops, 1);
  } finally {
    sim.dispose();
  }
});

test('a stock header leaves balloons behind the chassis alone; a rear header cuts automatically', () => {
  for (const unique of [0, 3]) {
    const sim = makeSim('harvester');
    try {
      const v = sim.vehicles[0],
        b = sim.balloons[0];
      v.upgrades.unique = unique;
      v.x = b.x + 1.8;
      v.z = b.z;
      v.px = v.x;
      v.pz = v.z;
      v.angle = v.pangle = Math.PI / 2;
      control(sim, neutralDriverInput());
      assert.equal(sim.pops, unique >= 3 ? 1 : 0);
    } finally {
      sim.dispose();
    }
  }
});

test('automatic header contacts respect upgraded damage and tool cooldown', () => {
  const sim = makeSim('harvester');
  try {
    const v = sim.vehicles[0],
      b = sim.balloons[0];
    v.upgrades.attack = 3;
    b.armor = true;
    b.hp = b.maxHp = 20;
    v.x = b.x + 1.8;
    v.z = b.z;
    v.px = v.x;
    v.pz = v.z;
    v.angle = v.pangle = -Math.PI / 2;
    control(sim, neutralDriverInput());
    const health = b.hp,
      recovery = v.attackTick;
    assert.equal(health, 20 - vehicleStats(v).damage * 0.5);
    assert.ok(recovery > sim.tick);
    for (let i = 0; i < 3; i++) sim.step();
    assert.equal(b.hp, health, 'persistent contact must respect the tool interval');
    while (sim.tick <= Math.ceil(recovery)) sim.step();
    assert.ok(b.hp < health, 'the header must cut again after recovering');
  } finally {
    sim.dispose();
  }
});

test('automatic header pops are deterministic in a driver replay with no fire commands', () => {
  const run = newRun('easy', 'yard');
  run.fleet = [vehicle('harvester', 1, 3, 9)];
  run.fleet[0].rotation = -Math.PI / 2;
  const original = new Simulation(run),
    playback = new Simulation(run);
  try {
    original.enqueue({ ability: 'pilot', vehicleId: 1 });
    original.enqueue({
      ability: 'drive',
      vehicleId: 1,
      input: { ...neutralDriverInput(), throttle: 0.5, yaw: 2.4, pitch: 1.1 },
    });
    for (let i = 0; i < 120; i++) original.step();
    assert.ok(original.pops > 0, 'driving through the pack must pop balloons automatically');
    const replay = original.replay();
    assert.ok(replay.commands.every((entry) => !entry.command.input?.fire));
    while (playback.tick < original.tick) {
      for (const entry of replay.commands)
        if (entry.tick === playback.tick) playback.enqueue(entry.command);
      playback.step();
    }
    assert.deepEqual(playback.vehicles, original.vehicles);
    assert.deepEqual(playback.balloons, original.balloons);
    assert.deepEqual(playback.rhythm, original.rhythm);
    assert.equal(playback.pops, original.pops);
  } finally {
    original.dispose();
    playback.dispose();
  }
});

test('baler can fire a travelling projectile into empty space', () => {
  const sim = makeSim('baler');
  try {
    control(sim, { fire: true });
    assert.equal(sim.shots.length, 1);
    assert.ok(sim.shots[0].z > sim.vehicles[0].z);
    assert.equal(sim.pops, 0);
  } finally {
    sim.dispose();
  }
});

test('aim assist selects the visible balloon before armor eligibility and excludes behind-camera targets', () => {
  const v = { kind: 'sprayer' as const, x: 10, z: 10, angle: 0 };
  const input = { ...neutralDriverInput(), pitch: 0 };
  const balloons = [
    { id: 10, kind: 'basic' as const, x: 10, y: 2.05, z: 14 },
    { id: 11, kind: 'basic' as const, x: 10, y: 2.05, z: 20 },
    { id: 12, kind: 'basic' as const, x: 10, y: 2.05, z: 5 },
  ];
  assert.equal(driverTarget(v, input, balloons)?.id, 10);
  assert.equal(
    driverTarget(v, input, [{ ...balloons[0], x: 10.3 }, balloons[1]])?.id,
    10,
    'a nearer silhouette on the ray must occlude a centered balloon farther away',
  );
  assert.equal(driverTarget(v, input, [balloons[2]]), undefined);
});

test('switching driver seats returns the previous vehicle to AI; invalid/stale inputs are ignored', () => {
  const run = newRun();
  run.fleet = [vehicle('sprayer', 1), vehicle('excavator', 2, 14, 16)];
  const sim = new Simulation(run);
  try {
    sim.enqueue({ ability: 'pilot', vehicleId: 1 });
    sim.step();
    sim.enqueue({ ability: 'pilot', vehicleId: 999 });
    sim.step();
    assert.equal(sim.driverId, 1);
    sim.enqueue({ ability: 'pilot', vehicleId: 2 });
    sim.enqueue({
      ability: 'drive',
      vehicleId: 1,
      input: { ...neutralDriverInput(), throttle: 1 },
    });
    sim.step();
    assert.equal(sim.driverId, 2);
    assert.equal(sim.driverInput.throttle, 0);
    assert.notEqual(sim.vehicles[0].target, -1, 'previous driver must retarget automatically');
    sim.enqueue({ ability: 'pilot' });
    sim.step();
    assert.equal(sim.driverId, null);
    assert.notEqual(sim.vehicles[1].target, -1);
  } finally {
    sim.dispose();
  }
});

test('driver input sanitization prevents nonfinite motion and out-of-bounds look angles', () => {
  const input = sanitizeDriverInput({
    throttle: Infinity,
    steer: 100,
    yaw: NaN,
    pitch: -20,
    fire: true,
    brake: false,
  });
  assert.deepEqual(input, {
    side: 'front',
    throttle: 0,
    steer: 1,
    yaw: 0,
    pitch: -1.15,
    fire: true,
    brake: false,
  });
});

test('side switching follows installed rear tools across every chassis and upgrade tier', () => {
  const kinds: VehicleKind[] = [
    'harvester',
    'sprayer',
    'excavator',
    'crane',
    'baler',
    'blower',
    'bulldozer',
    'mixer',
  ];
  for (const kind of kinds) {
    for (let tier = 0; tier <= 5; tier++) {
      const v = vehicle(kind);
      v.upgrades.unique = tier;
      const available = kind === 'harvester' && tier >= 3;
      assert.equal(canSwitchDriverSide(v), available, `${kind} Specialist ${tier}`);
      assert.equal(
        sanitizeDriverInput({ ...neutralDriverInput(), side: 'rear' }, v).side,
        available ? 'rear' : 'front',
      );
    }
  }
});

test('rear-seat W/S and left/right steering follow the selected view', () => {
  for (const throttle of [-1, 1]) {
    for (const steer of [-1, 0, 1]) {
      const sim = makeSim('harvester');
      try {
        const v = sim.vehicles[0];
        v.upgrades.unique = 3;
        const x = v.x,
          z = v.z;
        control(sim, { side: 'rear', throttle, steer }, 45);
        assert.equal(sim.driverInput.side, 'rear');
        assert.ok((v.z - z) * throttle < -0.1, 'W moves backward; S moves forward');
        assert.ok(v.speed * throttle < 0, 'gear reflects the actual chassis direction');
        if (steer) {
          assert.ok((v.x - x) * steer < 0, 'A bends left and D bends right from the rear seat');
          assert.ok(v.angle * throttle * steer > 0, 'steering reverses normally when backing away');
        }
      } finally {
        sim.dispose();
      }
    }
  }
});

test('switching ends under throttle brakes through zero before reversing', () => {
  const sim = makeSim('harvester');
  try {
    const v = sim.vehicles[0];
    v.upgrades.unique = 3;
    control(sim, { throttle: 1 }, 20);
    const forwardSpeed = v.speed;
    assert.ok(forwardSpeed > 0.5);
    control(sim, { side: 'rear', throttle: 1 });
    assert.ok(v.speed > 0 && v.speed < forwardSpeed, 'switching must preserve physical momentum');
    for (let i = 0; i < 45; i++) sim.step();
    assert.ok(v.speed < -0.5, 'continued W accelerates toward the rear header');
  } finally {
    sim.dispose();
  }
});

test('rear view aims behind the cab, while HUD contacts follow only the viewed header', () => {
  const v = { ...vehicle('harvester', 1, 10, 10), angle: 0 };
  v.upgrades.unique = 3;
  const balloons = [
    { id: 1, kind: 'basic' as const, x: 10, y: 2.05, z: 15, armor: false },
    { id: 2, kind: 'basic' as const, x: 10, y: 2.05, z: 5, armor: false },
  ];
  assert.equal(driverTarget(v, { ...neutralDriverInput(), pitch: 0 }, balloons)?.id, 1);
  assert.equal(
    driverTarget(v, { ...neutralDriverInput(), side: 'rear', pitch: 0 }, balloons)?.id,
    2,
  );
  const contacts = balloons.map((b) => ({ ...b, y: 1, z: b.id === 1 ? 11.8 : 8.2 }));
  assert.deepEqual(
    driverAreaTargets(v, contacts, 0, 'front').map((b) => b.id),
    [1],
  );
  assert.deepEqual(
    driverAreaTargets(v, contacts, 0, 'rear').map((b) => b.id),
    [2],
  );
  assert.deepEqual(
    driverAreaTargets(v, contacts, 0).map((b) => b.id),
    [1, 2],
  );
  v.upgrades.unique = 0;
  assert.equal(
    driverTarget(v, { ...neutralDriverInput(), side: 'rear', pitch: 0 }, balloons)?.id,
    1,
  );
});

test('looking rearward keeps both headers cutting without a trigger', () => {
  const sim = makeSim('harvester');
  try {
    sim.wave.push({ ...sim.wave[0], tick: sim.tick });
    sim.step();
    const v = sim.vehicles[0],
      b = sim.balloons[0];
    v.upgrades.unique = 3;
    v.x = v.px = 8;
    v.z = v.pz = 16;
    v.angle = v.pangle = 0;
    b.x = 8;
    b.z = 17.8;
    b.y = b.float = b.baseFloat = 1;
    b.hp = b.maxHp = 20;
    const rear = sim.balloons[1];
    Object.assign(rear, { x: 8, z: 14.2, y: 1, float: 1, baseFloat: 1, hp: 20, maxHp: 20 });
    control(sim, { side: 'rear', yaw: 1.4, pitch: 1.1 });
    assert.equal(sim.driverInput.fire, false);
    assert.equal(b.hp, 20 - vehicleStats(v).damage);
    assert.equal(rear.hp, b.hp, 'viewing either end must keep the opposite cutter powered');
  } finally {
    sim.dispose();
  }
});

test('changing vehicles resets the side and rejects rear inputs on stock equipment', () => {
  const run = newRun('easy', 'yard');
  run.fleet = [vehicle('harvester', 1), vehicle('harvester', 2, 14, 16)];
  run.fleet[0].upgrades.unique = 3;
  const sim = new Simulation(run);
  try {
    sim.enqueue({ ability: 'pilot', vehicleId: 1 });
    sim.step();
    control(sim, { side: 'rear' });
    assert.equal(sim.driverInput.side, 'rear');
    sim.enqueue({ ability: 'pilot', vehicleId: 2 });
    sim.step();
    assert.equal(sim.driverInput.side, 'front');
    control(sim, { side: 'rear', throttle: 1 }, 10);
    assert.equal(sim.driverInput.side, 'front');
    assert.ok(sim.vehicles[1].speed > 0, 'invalid rear commands must retain normal front controls');
    sim.enqueue({ ability: 'pilot', vehicleId: 1 });
    sim.step();
    assert.equal(sim.driverInput.side, 'front');
  } finally {
    sim.dispose();
  }
});

test('front/rear switches and driving reproduce from replay commands', () => {
  const run = newRun('easy', 'yard');
  run.fleet = [vehicle('harvester')];
  run.fleet[0].upgrades.unique = 3;
  const original = new Simulation(run),
    playback = new Simulation(run);
  try {
    original.enqueue({ ability: 'pilot', vehicleId: 1 });
    for (let i = 0; i < 360 && !original.summary; i++) {
      if (i % 60 === 1) {
        const side = i % 120 < 60 ? 'rear' : 'front';
        original.enqueue({
          ability: 'drive',
          vehicleId: 1,
          input: { ...neutralDriverInput(), side, throttle: 1, steer: 0.3 },
        });
      }
      original.step();
    }
    const replay = original.replay();
    assert.ok(replay.commands.some((entry) => entry.command.input?.side === 'rear'));
    while (playback.tick < original.tick) {
      for (const entry of replay.commands)
        if (entry.tick === playback.tick) playback.enqueue(entry.command);
      playback.step();
    }
    assert.deepEqual(playback.driverInput, original.driverInput);
    assert.deepEqual(playback.vehicles, original.vehicles);
    assert.deepEqual(playback.balloons, original.balloons);
    assert.deepEqual(playback.summary, original.summary);
    assert.equal(playback.popCash, original.popCash);
  } finally {
    original.dispose();
    playback.dispose();
  }
});

test('manual driving, tools, boosts and AI handoffs reproduce from timestamped replay commands', () => {
  const run = newRun('easy', 'yard');
  run.fleet = [vehicle('sprayer', 1, 6, 18), vehicle('excavator', 2, 13, 20)];
  run.abilities.boost = 0;
  run.fleet[0].upgrades.unique = 3;
  const schedule: { tick: number; command: Command }[] = [
    { tick: 0, command: { ability: 'pilot', vehicleId: 1 } },
    {
      tick: 1,
      command: {
        ability: 'drive',
        vehicleId: 1,
        input: { ...neutralDriverInput(), throttle: 1, steer: 0.2, fire: true },
      },
    },
    { tick: 90, command: { ability: 'boost', vehicleId: 1 } },
    { tick: 110, command: { ability: 'vehicle', vehicleId: 1 } },
    {
      tick: 160,
      command: {
        ability: 'drive',
        vehicleId: 1,
        input: { ...neutralDriverInput(), throttle: -1, yaw: 0.6, pitch: -0.3, fire: true },
      },
    },
    { tick: 240, command: { ability: 'pilot', vehicleId: 2 } },
    {
      tick: 241,
      command: { ability: 'drive', vehicleId: 2, input: { ...neutralDriverInput(), steer: -1 } },
    },
    { tick: 320, command: { ability: 'pilot' } },
  ];
  const original = new Simulation(run);
  const playback = new Simulation(run);
  try {
    for (let i = 0; i < 600 && !original.summary; i++) {
      for (const entry of schedule)
        if (entry.tick === original.tick) original.enqueue(entry.command);
      original.step();
    }
    const replay = original.replay();
    while (playback.tick < original.tick) {
      for (const entry of replay.commands)
        if (entry.tick === playback.tick) playback.enqueue(entry.command);
      playback.step();
    }
    assert.ok(replay.commands.some((entry) => entry.command.ability === 'drive'));
    assert.deepEqual(playback.vehicles, original.vehicles);
    assert.deepEqual(playback.balloons, original.balloons);
    assert.deepEqual(playback.summary, original.summary);
    assert.deepEqual(playback.rhythm, original.rhythm);
    assert.equal(playback.popCash, original.popCash);
    assert.ok(original.vehicles[1].pops > 0, 'the unpiloted fleet must keep fighting');
    assert.ok(vehicleStats(original.vehicles[0]).range > 0);
  } finally {
    original.dispose();
    playback.dispose();
  }
});
