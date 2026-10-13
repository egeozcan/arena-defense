import type { Run } from './data';
import {
  Simulation,
  type AirBurst,
  type AttackEvent,
  type Bale,
  type BaleShot,
  type Balloon,
  type Command,
  type PopEvent,
  type Replay,
  type SimVehicle,
  type Summary,
} from './engine';
import type { PopRhythm } from './pop-rush';
import type { DriverInput } from './vehicle-pilot';

// Everything the UI reads from a running round, as structured-cloneable data.
// Derived getters are evaluated here so the main thread never needs the engine.
export interface SimSnapshot {
  session: number;
  tick: number;
  arena: Simulation['arena'];
  balloons: Balloon[];
  vehicles: SimVehicle[];
  bales: Bale[];
  events: PopEvent[];
  attacks: AttackEvent[];
  shots: BaleShot[];
  winds: AirBurst[];
  clouds: Simulation['clouds'];
  gust: Simulation['gust'];
  summary: Summary | null;
  pops: number;
  popCash: number;
  rhythm: Omit<PopRhythm, 'active' | 'update' | 'pop'>;
  driverId: number | null;
  abilityReady: Simulation['abilityReady'];
  secondsLeft: number;
  pending: number;
  canFinishEarly: boolean;
  statuses: Record<number, string>;
}

export type HostRequest =
  | { type: 'start'; session: number; run: Run }
  | {
      type: 'advance';
      session: number;
      ticks: number;
      drive?: { vehicleId: number; input: DriverInput };
    }
  | { type: 'enqueue'; session: number; command: Command }
  | { type: 'replay'; session: number }
  | { type: 'dispose'; session: number };

export type HostResponse =
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'started'; session: number; run: Run; snapshot: SimSnapshot }
  | { type: 'snapshot'; snapshot: SimSnapshot }
  | { type: 'replay'; session: number; replay: Replay };

// Owns one Simulation at a time. Responses for an older session are ignored by
// the client, so a late snapshot cannot leak into the next round.
export class SimHost {
  private sim: Simulation | null = null;
  private session = -1;

  handle(request: HostRequest): HostResponse | null {
    if (request.type === 'start') {
      this.sim?.dispose();
      this.sim = new Simulation(request.run);
      this.session = request.session;
      return {
        type: 'started',
        session: this.session,
        run: this.sim.run,
        snapshot: this.snapshot(),
      };
    }
    const sim = this.sim;
    if (!sim || request.session !== this.session) return null;
    switch (request.type) {
      case 'advance':
        // Driver input is applied before the first step, as the in-page loop did.
        if (request.drive) sim.enqueue({ ability: 'drive', ...request.drive });
        for (let i = 0; i < request.ticks && !sim.summary; i++) sim.step();
        return { type: 'snapshot', snapshot: this.snapshot() };
      case 'enqueue':
        sim.enqueue(request.command);
        return null;
      case 'replay':
        return { type: 'replay', session: this.session, replay: sim.replay() };
      case 'dispose':
        sim.dispose();
        this.sim = null;
        return null;
    }
  }

  private snapshot(): SimSnapshot {
    const sim = this.sim!;
    const { streak, bestStreak, charge, lastPop, rushUntil, rushStarted, rushes } = sim.rhythm;
    return {
      session: this.session,
      tick: sim.tick,
      arena: sim.arena,
      balloons: sim.balloons,
      vehicles: sim.vehicles,
      bales: sim.bales,
      events: sim.events,
      attacks: sim.attacks,
      shots: sim.shots,
      winds: sim.winds,
      clouds: sim.clouds,
      gust: sim.gust,
      summary: sim.summary,
      pops: sim.pops,
      popCash: sim.popCash,
      rhythm: { streak, bestStreak, charge, lastPop, rushUntil, rushStarted, rushes },
      driverId: sim.driverId,
      abilityReady: sim.abilityReady,
      secondsLeft: sim.secondsLeft,
      pending: sim.pending,
      canFinishEarly: sim.canFinishEarly,
      statuses: Object.fromEntries(sim.vehicles.map((v) => [v.id, sim.vehicleStatus(v)])),
    };
  }
}
