import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidElement, type ReactNode } from 'react';
import { PATHS, VEHICLES, type VehicleKind } from '../src/sim/data';
import {
  STOCK_UPGRADES,
  vehicleAppearance,
  type VehicleUpgrades,
} from '../src/render/vehicle-appearance';
import { ChassisUpgrades, ToolUpgrades, TractionUpgrades } from '../src/render/vehicle-upgrades';

function mounts(kind: VehicleKind, upgrades: VehicleUpgrades) {
  const names = new Set<string>();
  function walk(node: ReactNode): void {
    if (Array.isArray(node)) node.forEach(walk);
    else if (isValidElement<{ name?: string; children?: ReactNode }>(node)) {
      if (node.props.name) names.add(node.props.name);
      walk(node.props.children);
    }
  }
  walk(ChassisUpgrades({ kind, upgrades }));
  walk(ToolUpgrades({ kind, upgrades }));
  walk(TractionUpgrades({ kind, tier: upgrades.traction }));
  return names;
}

for (const kind of Object.keys(VEHICLES) as VehicleKind[]) {
  test(`${kind}: every tier adds hardware and changes paint without removing earlier upgrades`, () => {
    assert.equal(vehicleAppearance(kind).paint, VEHICLES[kind].color);
    assert.equal(mounts(kind, STOCK_UPGRADES).size, 0);
    for (const path of PATHS) {
      let previous = mounts(kind, STOCK_UPGRADES);
      let paint = vehicleAppearance(kind).paint;
      for (let tier = 1; tier <= 5; tier++) {
        const upgrades = { ...STOCK_UPGRADES, [path]: tier };
        const installed = mounts(kind, upgrades);
        assert.ok(
          installed.size > previous.size,
          `${path} tier ${tier} must add physical hardware`,
        );
        for (const name of previous)
          assert.ok(installed.has(name), `${name} must survive tier ${tier}`);
        const nextPaint = vehicleAppearance(kind, upgrades).paint;
        assert.notEqual(nextPaint, paint, `${path} tier ${tier} must change the finish`);
        previous = installed;
        paint = nextPaint;
      }
    }
  });

  test(`${kind}: all legal two-path builds preserve both sets of hardware`, () => {
    for (const primary of PATHS) {
      for (const secondary of PATHS.filter((p) => p !== primary)) {
        for (let tier = 1; tier <= 5; tier++) {
          for (let otherTier = 1; otherTier <= 2; otherTier++) {
            const first = { ...STOCK_UPGRADES, [primary]: tier };
            const second = { ...STOCK_UPGRADES, [secondary]: otherTier };
            const combined = { ...first, [secondary]: otherTier };
            const installed = mounts(kind, combined);
            const expected = new Set([...mounts(kind, first), ...mounts(kind, second)]);
            assert.deepEqual(installed, expected);
            assert.notEqual(
              vehicleAppearance(kind, combined).paint,
              vehicleAppearance(kind, first).paint,
            );
            assert.deepEqual(
              vehicleAppearance(kind, combined),
              vehicleAppearance(kind, { ...second, [primary]: tier }),
            );
          }
        }
      }
    }
  });
}
