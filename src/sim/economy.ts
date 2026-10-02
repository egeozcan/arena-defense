import { ABILITIES, VEHICLES, price, type AbilityKind, type Run } from './data';

function replacementCost(run: Run) {
  return Math.min(...Object.values(VEHICLES).map((v) => price(run, v.cost)));
}

export function abilityCost(run: Run, kind: AbilityKind) {
  const tier = run.abilities[kind];
  return price(run, ABILITIES[kind].price * (tier === 0 ? 0.5 : 1));
}

export function canBuyAbility(run: Run, kind: AbilityKind) {
  const remaining = run.cash - abilityCost(run, kind);
  return (
    run.abilities[kind] !== 2 &&
    remaining >= 0 &&
    (run.fleet.length > 0 || remaining >= replacementCost(run))
  );
}

export function purchaseAbility(run: Run, kind: AbilityKind): Run {
  if (!canBuyAbility(run, kind)) return run;
  const tier = run.abilities[kind];
  return {
    ...run,
    cash: run.cash - abilityCost(run, kind),
    abilities: { ...run.abilities, [kind]: tier === undefined ? 0 : tier + 1 },
  };
}

export function canSellVehicle(run: Run, id: number) {
  const vehicle = run.fleet.find((v) => v.id === id);
  return (
    !!vehicle &&
    (run.fleet.length > 1 || run.cash + Math.floor(vehicle.spent * 0.7) >= replacementCost(run))
  );
}

export function sellVehicle(run: Run, id: number): Run {
  if (!canSellVehicle(run, id)) return run;
  const vehicle = run.fleet.find((v) => v.id === id)!;
  return {
    ...run,
    cash: run.cash + Math.floor(vehicle.spent * 0.7),
    fleet: run.fleet.filter((v) => v.id !== id),
  };
}
