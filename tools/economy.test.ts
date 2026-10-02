import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, price, VEHICLES, type OwnedVehicle } from '../src/sim/data';
import { canBuyAbility, purchaseAbility, canSellVehicle, sellVehicle } from '../src/sim/economy';

function buyStarter(run: ReturnType<typeof newRun>) {
  const cost = price(run, VEHICLES.harvester.cost);
  const v: OwnedVehicle = {
    id: 1,
    kind: 'harvester',
    x: 9,
    z: 6,
    rotation: 0,
    placed: true,
    targeting: 'Nearest',
    spent: cost,
    upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
  };
  return { ...run, cash: run.cash - cost, fleet: [v] };
}

test('early ability purchases preserve a path to buying the first vehicle in every mode', () => {
  for (const mode of ['easy', 'medium', 'hard'] as const) {
    const original = newRun(mode);
    assert.equal(canBuyAbility(original, 'pitchfork'), false);
    assert.equal(purchaseAbility(original, 'pitchfork'), original);
    let run = purchaseAbility(original, 'gust');
    for (const kind of ['gust', 'boost', 'pitchfork'] as const) {
      for (let i = 0; i < 3; i++) run = purchaseAbility(run, kind);
    }
    assert.ok(run.cash >= price(run, VEHICLES.harvester.cost));
    assert.equal(original.cash, 650);
  }
});

test('selling the final vehicle cannot strand a fleet with too little replacement cash', () => {
  let run = buyStarter(newRun());
  run = purchaseAbility(run, 'boost');
  assert.equal(run.cash, 55);
  assert.equal(canSellVehicle(run, 1), false);
  assert.equal(sellVehicle(run, 1), run);
  run = { ...run, cash: run.cash + 100 };
  assert.equal(canSellVehicle(run, 1), true);
  const sold = sellVehicle(run, 1);
  assert.equal(sold.fleet.length, 0);
  assert.ok(sold.cash >= price(sold, VEHICLES.harvester.cost));
  assert.equal(canBuyAbility(sold, 'gust'), false);
});

test('a funded fleet can purchase and upgrade abilities without reserving another vehicle', () => {
  const original = { ...buyStarter(newRun()), cash: 2000 };
  let run = original;
  for (let i = 0; i < 3; i++) run = purchaseAbility(run, 'pitchfork');
  assert.equal(run.abilities.pitchfork, 2);
  assert.equal(purchaseAbility(run, 'pitchfork'), run);
  assert.deepEqual(original.abilities, {});
  assert.equal(run.fleet, original.fleet);
});
