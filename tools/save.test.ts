import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arenaFor, canPlace, newRun, type OwnedVehicle, type Run } from '../src/sim/data';
import { parseSavedRun } from '../src/ui/save';

function vehicle(): OwnedVehicle {
  return {
    id: 1,
    kind: 'harvester',
    placed: false,
    x: 0,
    z: 0,
    rotation: 0,
    targeting: 'Nearest',
    spent: 400,
    upgrades: { attack: 2, speed: 0, traction: 0, unique: 5 },
  };
}

function savedRun(): Run {
  return {
    ...newRun('hard', 'yard'),
    round: 60,
    cash: 12340,
    lives: 17,
    nextId: 2,
    fleet: [vehicle()],
  };
}

test('saved payloads that previously crashed startup recover as a fresh run', () => {
  const fresh = newRun();
  for (const malformed of [
    { ...fresh, round: 1.5 },
    { ...fresh, mode: 'toString' },
    { ...fresh, fleet: [null] },
    {
      ...fresh,
      fleet: [
        {
          id: 1,
          kind: 'unknown',
          placed: false,
          x: 0,
          z: 0,
          rotation: 0,
          targeting: 'Nearest',
          spent: 1,
          upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
        },
      ],
    },
  ]) {
    assert.deepEqual(parseSavedRun(JSON.stringify(malformed)), fresh);
  }
});

test('missing, nonnumeric and out-of-domain run fields cannot poison saved progress', () => {
  const run = savedRun();
  const invalid: Record<string, unknown[]> = {
    version: [undefined, 2],
    mode: ['unknown', '__proto__', 'constructor'],
    arena: ['unknown', 'toString'],
    round: [undefined, null, '60', 0, -1, 60.5, Number.MAX_SAFE_INTEGER + 1],
    cash: [undefined, null, '12340', -1, 1.5, Number.MAX_SAFE_INTEGER + 1],
    lives: [undefined, null, '17', 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1],
    seed: [undefined, null, '73429', 1.5, Number.MAX_SAFE_INTEGER + 1],
    nextId: [undefined, null, '2', 0, -1, 1, 2.5, Number.MAX_SAFE_INTEGER + 1],
    freeplay: [undefined, null, 0, 'false'],
    fleet: [undefined, null, {}],
  };
  for (const [key, values] of Object.entries(invalid))
    for (const value of values)
      assert.deepEqual(
        parseSavedRun(JSON.stringify({ ...run, [key]: value })),
        newRun(),
        `${key}: ${String(value)}`,
      );
});

test('vehicle identities and motion fields are validated even before deployment', () => {
  const run = savedRun();
  const invalid: Record<string, unknown[]> = {
    id: [undefined, null, '1', 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1],
    kind: [undefined, 'unknown', 'constructor'],
    placed: [undefined, null, 0, 'false'],
    x: [undefined, null, '0'],
    z: [undefined, null, '0'],
    rotation: [undefined, null, '0'],
    targeting: [undefined, null, 'unknown', 'constructor'],
    spent: [undefined, null, '400', -1, 1.5, Number.MAX_SAFE_INTEGER + 1],
  };
  for (const [key, values] of Object.entries(invalid))
    for (const value of values)
      assert.deepEqual(
        parseSavedRun(JSON.stringify({ ...run, fleet: [{ ...vehicle(), [key]: value }] })),
        newRun(),
        `${key}: ${String(value)}`,
      );
  assert.deepEqual(
    parseSavedRun(JSON.stringify({ ...run, fleet: [vehicle(), vehicle()] })),
    newRun(),
    'duplicate vehicle IDs would alias selection and physics bodies',
  );
});

test('saved upgrades retain the legal two-path and primary-secondary tier caps', () => {
  const run = savedRun();
  for (const upgrades of [
    undefined,
    null,
    [],
    {},
    { attack: 0, speed: 0, traction: 0 },
    { attack: '2', speed: 0, traction: 0, unique: 5 },
    { attack: -1, speed: 0, traction: 0, unique: 0 },
    { attack: 1.5, speed: 0, traction: 0, unique: 0 },
    { attack: 6, speed: 0, traction: 0, unique: 0 },
    { attack: 1, speed: 1, traction: 1, unique: 0 },
    { attack: 3, speed: 0, traction: 0, unique: 3 },
    { attack: 0, speed: 0, traction: 0, unique: 0, unknown: 1 },
  ])
    assert.deepEqual(
      parseSavedRun(JSON.stringify({ ...run, fleet: [{ ...vehicle(), upgrades }] })),
      newRun(),
    );
});

test('unknown or invalid ability tiers cannot enter the simulation constructor', () => {
  const run = savedRun();
  for (const abilities of [
    undefined,
    null,
    [],
    { unknown: 0 },
    { constructor: 0 },
    { boost: -1 },
    { gust: 0.5 },
    { pitchfork: 3 },
    { boost: '0' },
    { gust: null },
  ])
    assert.deepEqual(parseSavedRun(JSON.stringify({ ...run, abilities })), newRun());
});

test('campaign bounds and eager freeplay wave allocation are checked before startup', () => {
  const run = savedRun();
  for (const malformed of [
    { ...run, round: 61 },
    { ...newRun('easy'), round: 21 },
    { ...newRun('medium'), round: 41 },
    { ...run, freeplay: true, round: 10001 },
    { ...run, freeplay: true, round: 1e12 },
  ])
    assert.deepEqual(parseSavedRun(JSON.stringify(malformed)), newRun());
  const freeplay = { ...run, freeplay: true, round: 1000 };
  assert.deepEqual(parseSavedRun(JSON.stringify(freeplay)), freeplay);
});

test('valid version-one saves preserve fleets, money, modes, late rounds and partial upgrades', () => {
  for (const mode of ['easy', 'medium', 'hard'] as const)
    for (const arena of ['barn', 'yard'] as const)
      assert.deepEqual(parseSavedRun(JSON.stringify(newRun(mode, arena))), newRun(mode, arena));
  const run = {
    ...savedRun(),
    seed: -12345,
    abilities: { gust: 0, boost: 1, pitchfork: 2 },
    nextId: 9,
    fleet: [
      vehicle(),
      {
        ...vehicle(),
        id: 8,
        kind: 'crane' as const,
        upgrades: { attack: 0, speed: 2, traction: 2, unique: 0 },
        targeting: 'Highest' as const,
        spent: 1937,
        x: -4,
        z: 80,
        rotation: Math.PI / 2,
      },
    ],
  };
  assert.deepEqual(parseSavedRun(JSON.stringify(run)), run);
});

test('older touching placements are repaired after validation without resetting progress', () => {
  const run = {
    ...newRun(),
    nextId: 3,
    fleet: [
      { ...vehicle(), x: 9, z: 5, placed: true },
      { ...vehicle(), id: 2, x: 11, z: 5, placed: true },
    ],
  };
  const parsed = parseSavedRun(JSON.stringify(run));
  assert.equal(parsed.fleet.length, 2);
  assert.deepEqual(parsed.fleet[0], run.fleet[0]);
  assert.notDeepEqual(parsed.fleet[1], run.fleet[1]);
  assert.ok(
    canPlace(
      arenaFor('barn'),
      [parsed.fleet[0]],
      parsed.fleet[1],
      parsed.fleet[1].x,
      parsed.fleet[1].z,
    ),
  );
  assert.equal(parsed.cash, run.cash);
  assert.equal(parsed.nextId, run.nextId);
});

test('missing, invalid JSON and nonobject saves consistently start a fresh run', () => {
  for (const serialized of [null, '', '{', 'null', '[]', 'true', '42', '"saved"'])
    assert.deepEqual(parseSavedRun(serialized), newRun());
});
