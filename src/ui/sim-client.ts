import { arenaFor, type Run } from '../sim/data';
import type {
  AirBurst,
  AttackEvent,
  Bale,
  BaleShot,
  Balloon,
  Command,
  PopEvent,
  Replay,
  SimVehicle,
  Summary,
} from '../sim/engine';
import type { HostRequest, HostResponse, SimSnapshot } from '../sim/host';
import { PopRhythm } from '../sim/pop-rush';
import type { DriverInput } from '../sim/vehicle-pilot';

// Keep object identity per id: renderers hold a vehicle or balloon reference
// across frames and read its latest fields.
function syncById<T extends { id: number }>(list: T[], incoming: T[]) {
  const previous = new Map(list.map((item) => [item.id, item]));
  list.length = 0;
  for (const item of incoming) {
    const existing = previous.get(item.id);
    list.push(existing ? Object.assign(existing, item) : item);
  }
}

// Main-thread mirror of a round running in the simulation worker. It exposes the
// fields and methods the UI reads from Simulation, updated from each snapshot.
export class SimView {
  run: Run;
  arena: SimSnapshot['arena'];
  tick = 0;
  balloons: Balloon[] = [];
  vehicles: SimVehicle[] = [];
  bales: Bale[] = [];
  events: PopEvent[] = [];
  attacks: AttackEvent[] = [];
  shots: BaleShot[] = [];
  winds: AirBurst[] = [];
  clouds: SimSnapshot['clouds'] = [];
  gust: SimSnapshot['gust'] = { until: 0, dx: 0, dz: 0 };
  summary: Summary | null = null;
  pops = 0;
  popCash = 0;
  rhythm = new PopRhythm();
  driverId: number | null = null;
  abilityReady: SimSnapshot['abilityReady'] = { gust: [], boost: [], pitchfork: [] };
  secondsLeft = 180;
  pending = 0;
  canFinishEarly = false;
  // Interpolation between the previous and latest tick for the shown snapshot.
  interpolation = 1;
  private interpolationTime = 0;
  private statuses: Record<number, string> = {};

  constructor(
    private readonly client: SimClient,
    readonly session: number,
    run: Run,
  ) {
    this.run = run;
    this.arena = arenaFor(run.arena, run.round, run.seed);
  }

  apply(s: SimSnapshot, interpolation = 1, receivedAt = performance.now()) {
    this.interpolation = interpolation;
    this.interpolationTime = receivedAt;
    this.tick = s.tick;
    this.arena = s.arena;
    syncById(this.balloons, s.balloons);
    syncById(this.vehicles, s.vehicles);
    syncById(this.bales, s.bales);
    this.events = s.events;
    this.attacks = s.attacks;
    this.shots = s.shots;
    this.winds = s.winds;
    this.clouds = s.clouds;
    this.gust = s.gust;
    this.summary = s.summary;
    this.pops = s.pops;
    this.popCash = s.popCash;
    Object.assign(this.rhythm, s.rhythm);
    this.driverId = s.driverId;
    this.abilityReady = s.abilityReady;
    this.secondsLeft = s.secondsLeft;
    this.pending = s.pending;
    this.canFinishEarly = s.canFinishEarly;
    this.statuses = s.statuses;
  }

  // Keep rendering between snapshots, without extrapolating past the known tick.
  interpolate(now: number, speed: number, paused: boolean) {
    const elapsed = Math.max(0, now - this.interpolationTime) / 1000;
    this.interpolationTime = now;
    this.interpolation = paused ? 1 : Math.min(1, this.interpolation + elapsed * speed * 60);
    return this.interpolation;
  }

  vehicleStatus(v: Pick<SimVehicle, 'id'>) {
    return this.statuses[v.id] ?? '';
  }

  enqueue(command: Command) {
    this.client.post({ type: 'enqueue', session: this.session, command });
  }

  // Returns false while the previous request is still running in the worker.
  advance(ticks: number, interpolation: number, drive?: { vehicleId: number; input: DriverInput }) {
    return this.client.advance(this, ticks, interpolation, drive);
  }

  replay() {
    return this.client.replay(this);
  }

  dispose() {
    this.client.dispose(this);
  }
}

export class SimClient {
  readonly ready: Promise<void>;
  private readonly worker: Worker;
  private session = 0;
  private view: SimView | null = null;
  private inFlight = false;
  private requestedInterpolation = 1;
  private replays: ((replay: Replay) => void)[] = [];
  private failed: (message: string) => void = () => {};

  constructor(onError: (message: string) => void) {
    this.worker = new Worker(new URL('../sim/sim.worker.ts', import.meta.url), {
      type: 'module',
    });
    let resolveReady!: () => void;
    this.ready = new Promise((resolve, reject) => {
      resolveReady = resolve;
      this.failed = (message) => {
        reject(new Error(message));
        onError(message);
      };
    });
    this.ready.catch(() => {});
    this.worker.onerror = (e) => this.failed(e.message || 'Simulation worker failed to load');
    this.worker.onmessage = (event: MessageEvent<HostResponse>) => {
      const message = event.data;
      if (message.type === 'ready') return resolveReady();
      if (message.type === 'error') return this.failed(message.message);
      const view = this.view;
      if (message.type === 'started') {
        if (view?.session !== message.session) return;
        view.run = message.run;
        view.apply(message.snapshot);
      } else if (message.type === 'snapshot') {
        if (view?.session !== message.snapshot.session) return;
        view.apply(message.snapshot, this.requestedInterpolation);
        this.inFlight = false;
      } else if (message.type === 'replay') {
        if (view?.session === message.session) this.replays.shift()?.(message.replay);
      }
    };
  }

  start(run: Run) {
    this.view?.dispose();
    const view = new SimView(this, ++this.session, run);
    this.view = view;
    this.inFlight = false;
    this.replays = [];
    this.post({ type: 'start', session: view.session, run });
    return view;
  }

  post(request: HostRequest) {
    this.worker.postMessage(request);
  }

  advance(
    view: SimView,
    ticks: number,
    interpolation: number,
    drive?: { vehicleId: number; input: DriverInput },
  ) {
    if (view !== this.view || this.inFlight) return false;
    this.inFlight = true;
    this.requestedInterpolation = interpolation;
    this.post({ type: 'advance', session: view.session, ticks, drive });
    return true;
  }

  replay(view: SimView) {
    return new Promise<Replay>((resolve) => {
      if (view !== this.view) return;
      this.replays.push(resolve);
      this.post({ type: 'replay', session: view.session });
    });
  }

  dispose(view: SimView) {
    if (view !== this.view) return;
    this.post({ type: 'dispose', session: view.session });
    this.view = null;
    this.inFlight = false;
  }

  terminate() {
    this.worker.terminate();
  }
}
