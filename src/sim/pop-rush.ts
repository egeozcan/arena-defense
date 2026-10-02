// All rhythm uses simulation ticks, so pause, speed and replays stay in sync.
export const POP_RUSH = { charge: 10, chainTicks: 150, durationTicks: 300, move: 1.45, tool: 1.6 };

export class PopRhythm {
  streak = 0;
  bestStreak = 0;
  charge = 0;
  lastPop = -Infinity;
  rushUntil = 0;
  rushStarted = -Infinity;
  rushes = 0;

  active(tick: number) {
    return tick < this.rushUntil;
  }

  update(tick: number) {
    if (tick - this.lastPop > POP_RUSH.chainTicks) {
      this.streak = 0;
      this.charge = 0;
    }
  }

  pop(tick: number) {
    this.update(tick);
    this.lastPop = tick;
    this.bestStreak = Math.max(this.bestStreak, ++this.streak);
    if (this.active(tick)) return false;
    if (++this.charge < POP_RUSH.charge) return false;
    this.charge = 0;
    this.rushStarted = tick;
    this.rushUntil = tick + POP_RUSH.durationTicks;
    this.rushes++;
    return true;
  }
}
