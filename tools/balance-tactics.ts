import { canTargetBalloon, vehicleStats } from '../src/sim/capabilities';
import { balloonLives, type Command, type Simulation } from '../src/sim/engine';
import type { AbilityKind } from '../src/sim/data';

// A reproducible player policy: react once a second, pay for every ability,
// and let the simulation enforce charge counts, cooldowns and tool eligibility.
export function responsiveCommands(sim: Simulation): Command[] {
  const commands: Command[] = [];
  if (!sim.balloons.length) return commands;
  const ready = (ability: AbilityKind) =>
    sim.abilityReady[ability].some((tick) => tick <= sim.tick);
  const coverage = new Map(
    sim.balloons.map((b) => [
      b.id,
      sim.vehicles.filter((v) => canTargetBalloon(v, b.y, b.armor)).length,
    ]),
  );

  for (const v of sim.vehicles) {
    if (v.upgrades.unique < 3 || v.cooldown > sim.tick) continue;
    const s = vehicleStats(v);
    const useful = sim.balloons.some((b) => {
      const distance = Math.hypot(b.x - v.x, b.z - v.z);
      if (v.kind === 'harvester') return canTargetBalloon(v, b.y, b.armor);
      if (v.kind === 'excavator') return b.y < 2 && distance < 4;
      if (v.kind === 'crane') return b.y > 2 && distance < s.range;
      if (v.kind === 'sprayer') return distance < 3;
      return canTargetBalloon(v, b.y, b.armor) && distance <= s.range;
    });
    if (useful) commands.push({ ability: 'vehicle', vehicleId: v.id });
  }

  if (ready('gust') && sim.balloons.filter((b) => b.kind === 'high' && b.y > 5.2).length >= 3)
    commands.push({ ability: 'gust', dx: 0, dz: 0 });

  if (ready('boost')) {
    const scored = sim.vehicles.map((v) => {
      const s = vehicleStats(v);
      let score = 0;
      for (const b of sim.balloons) {
        if (!canTargetBalloon(v, b.y, b.armor)) continue;
        const distance = Math.hypot(b.x - v.x, b.z - v.z);
        const urgency = balloonLives(b) / Math.max(1, coverage.get(b.id)!);
        score += urgency * (distance <= s.range ? 1 : 0.35 / (1 + (distance - s.range) / s.speed));
      }
      return { v, score };
    });
    scored.sort((a, b) => b.score - a.score || a.v.id - b.v.id);
    if (scored[0]?.score > 0) commands.push({ ability: 'boost', vehicleId: scored[0].v.id });
  }

  if (ready('pitchfork')) {
    const scored = sim.balloons.map((target) => ({
      target,
      score: sim.balloons.reduce(
        (sum, b) =>
          sum +
          (Math.hypot(b.x - target.x, b.z - target.z) < 1.5
            ? Math.min(3, b.hp) * (b.kind === 'high' ? 2 : 1)
            : 0),
        0,
      ),
    }));
    scored.sort((a, b) => b.score - a.score || a.target.id - b.target.id);
    const target = scored[0].target;
    commands.push({ ability: 'pitchfork', x: target.x, z: target.z });
  }
  return commands;
}
