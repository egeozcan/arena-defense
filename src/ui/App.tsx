import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Check,
  Coins,
  Flag,
  Grid2X2,
  Heart,
  HelpCircle,
  Home,
  Leaf,
  Lock,
  Maximize,
  Minus,
  MousePointer2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Settings2,
  Shield,
  ShieldAlert,
  Sparkles,
  Sprout,
  Target,
  Tractor,
  Trash2,
  Volume2,
  VolumeX,
  Wind,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  ABILITIES,
  BALLOONS,
  MODES,
  TARGETS,
  upgradePrice,
  VEHICLES,
  VEHICLE_ABILITIES,
  arenaFor,
  canPlace,
  fitFleet,
  newRun,
  price,
  upgradeAllowed,
  waveTypes,
  type AbilityKind,
  type ArenaKind,
  type Mode,
  type OwnedVehicle,
  type PathName,
  type Run,
  type VehicleKind,
  type TargetMode,
} from '../sim/data';
import { Simulation, initPhysics, vehicleStats, type Summary } from '../sim/engine';
import {
  abilityCost,
  canBuyAbility,
  purchaseAbility,
  canSellVehicle,
  sellVehicle,
} from '../sim/economy';
import { ArenaScene } from '../render/ArenaScene';
import { VehicleThumb } from './VehicleThumb';
import { UpgradePanel } from './UpgradePanel';
import { VehicleProfile } from './VehicleProfile';
import { WaveBriefing, VehicleMatchup } from './WaveBriefing';
import { forecast, heightLabel, threatName } from './wave-forecast';
import { armorLabel, canTargetBalloon } from '../sim/capabilities';
import { useVehicleTooltip, VehicleTooltip } from './VehicleTooltip';
import { VEHICLE_GUIDES } from './vehicle-guide';
import { ArcadeFeedback } from './ArcadeFeedback';
import { playClear, playPop, playRush } from './audio';
const SAVE_KEY = 'balloon-arena-defense-v1';
type Phase = 'garage' | 'setup' | 'countdown' | 'round' | 'summary' | 'victory' | 'over';
function loadRun(): Run {
  try {
    const r = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (
      r?.version === 1 &&
      r.round >= 1 &&
      MODES[r.mode as Mode] &&
      ['barn', 'yard'].includes(r.arena) &&
      Array.isArray(r.fleet) &&
      r.lives > 0
    )
      return { ...r, fleet: fitFleet(arenaFor(r.arena), r.fleet) };
  } catch {}
  return newRun();
}
function BalloonLogo() {
  return (
    <svg width="38" height="42" viewBox="0 0 38 42" aria-hidden="true">
      <path d="M12 23q4 9 8 15M27 20q-4 10-7 18" stroke="#a9b899" fill="none" />
      <ellipse cx="11" cy="13" rx="9" ry="11" fill="#ea8b61" transform="rotate(-20 11 13)" />
      <ellipse cx="27" cy="11" rx="9" ry="11" fill="#b5c28c" transform="rotate(17 27 11)" />
      <path d="m12 23-3 4 5-1m12-4-1 4 4-2" fill="#cbb888" />
      <path
        d="M6 7q-3 2-2 6M24 5q-3 1-3 5"
        stroke="#f8e6cc"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
function money(n: number) {
  return n.toLocaleString();
}
function time(n: number) {
  const s = Math.ceil(n);
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
export default function App() {
  const [run, setRun] = useState<Run>(loadRun);
  const vehicleTooltip = useVehicleTooltip();
  const [phase, setPhase] = useState<Phase>('setup');
  const [tab, setTab] = useState<'shop' | 'fleet' | 'abilities'>('shop');
  const [shopKind, setShopKind] = useState<VehicleKind>('harvester');
  const [selected, setSelected] = useState<number | null>(null);
  const [sim, setSim] = useState<Simulation | null>(null);
  const simRef = useRef<Simulation | null>(null);
  const [ready, setReady] = useState(false);
  const [engineError, setEngineError] = useState('');
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [frame, setFrame] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [grid, setGrid] = useState(false);
  const [placing, setPlacing] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(2);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [armed, setArmed] = useState<AbilityKind | null>(null);
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState<'new' | 'help' | 'launch' | null>(null);
  const [lastRound, setLastRound] = useState<number | null>(null);
  const [newMode, setNewMode] = useState<Mode>('easy');
  const [newArena, setNewArena] = useState<ArenaKind>('barn');
  const [sound, setSound] = useState(true);
  const contentPanel = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const latest = useRef({ phase, speed, paused, sound });
  latest.current = { phase, speed, paused, sound };
  const notifiedPops = useRef(0);
  const notifiedRushes = useRef(0);
  const settled = useRef<Simulation | null>(null);
  const interpolation = useRef(1);
  const owned = run.fleet.find((v) => v.id === selected);
  const liveVehicle = sim?.vehicles.find((v) => v.id === selected);
  const arena = arenaFor(run.arena);
  const placed = run.fleet.filter((v) => v.placed).length;
  const types = useMemo(
    () => waveTypes(run.round, run.seed, run.mode),
    [run.round, run.seed, run.mode],
  );
  const briefing = useMemo(() => forecast(run), [run]);
  const unplacedCount = run.fleet.filter((v) => !v.placed).length;
  const liveUncovered = activeThreats();
  function activeThreats() {
    if (phase !== 'round' || !sim) return [];
    return sim.balloons.filter(
      (b) =>
        !sim.vehicles.some(
          (v) => canTargetBalloon(v, b.y, b.armor) || canTargetBalloon(v, b.float, b.armor),
        ),
    );
  }
  const active = phase === 'round';
  const finished = phase === 'summary' || phase === 'over' || phase === 'victory';
  useEffect(() => {
    vehicleTooltip.hide();
  }, [phase, tab, modal, vehicleTooltip.hide]);
  useEffect(() => {
    initPhysics()
      .then(() => setReady(true))
      .catch((e) => setEngineError(String(e)));
    return () => {
      simRef.current?.dispose();
      simRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (phase === 'garage' || phase === 'setup')
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(run));
      } catch {
        setNotice('This browser cannot save your run. Keep this tab open to continue.');
      }
  }, [run, phase]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    let id = 0,
      last = 0,
      acc = 0,
      lastUI = 0;
    function loop(now: number) {
      const dt = last ? Math.min((now - last) / 1000, 0.12) : 0;
      last = now;
      const current = simRef.current;
      if (current && latest.current.phase === 'round' && !latest.current.paused) {
        acc += dt * latest.current.speed;
        let ticks = 0;
        while (acc >= 1 / 60 && ticks < 8 && !current.summary) {
          current.step();
          acc -= 1 / 60;
          ticks++;
        }
        if (ticks === 8) acc = Math.min(acc, 1 / 60);
        if (current.pops > notifiedPops.current) {
          const amount = current.pops - notifiedPops.current;
          notifiedPops.current = current.pops;
          const ctx = audio.current;
          if (ctx && latest.current.sound) playPop(ctx, amount, current.rhythm.streak);
        }
        if (current.rhythm.rushes > notifiedRushes.current) {
          notifiedRushes.current = current.rhythm.rushes;
          if (audio.current && latest.current.sound) playRush(audio.current);
        }
        if (current.summary && settled.current !== current) {
          settled.current = current;
          latest.current.phase = 'summary';
          const s = current.summary;
          if (s.cleared && audio.current && latest.current.sound) playClear(audio.current);
          const terminal =
            current.run.lives - s.livesLost <= 0 ||
            (current.run.round >= MODES[current.run.mode].rounds && !current.run.freeplay);
          setSummary(s);
          setLastRound(current.run.round);
          setRun((r) => ({
            ...r,
            cash: r.cash + s.earned,
            lives: Math.max(0, r.lives - s.livesLost),
            round: terminal ? r.round : r.round + 1,
          }));
          setPhase(terminal ? 'summary' : 'garage');
          latest.current.phase = terminal ? 'summary' : 'garage';
          if (!terminal) {
            setTab('fleet');
            setSelected(current.run.fleet[0]?.id ?? null);
            setPlacing(null);
            setGrid(false);
            setSim(null);
          }
          setArmed(null);
          acc = 0;
        }
      }
      interpolation.current =
        latest.current.phase === 'round' && !latest.current.paused ? Math.min(1, acc * 60) : 1;
      if (now - lastUI > 100) {
        setFrame((f) => f + 1);
        lastUI = now;
      }
      id = requestAnimationFrame(loop);
    }
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  function toast(text: string) {
    setNotice(text);
  }
  function buy(kind: VehicleKind, deploy = false) {
    const cost = price(run, VEHICLES[kind].cost);
    if (run.cash < cost) return toast('Not enough cash. Clear a round to grow your fleet.');
    const v: OwnedVehicle = {
      id: run.nextId,
      kind,
      upgrades: { attack: 0, speed: 0, traction: 0, unique: 0 },
      spent: cost,
      placed: false,
      x: 0,
      z: 0,
      rotation: 0,
      targeting: 'Nearest',
    };
    setRun((r) => ({ ...r, cash: r.cash - cost, fleet: [...r.fleet, v], nextId: r.nextId + 1 }));
    setSelected(v.id);
    setShopKind(kind);
    playCue(440);
    if (deploy) {
      setPhase('setup');
      setPlacing(v.id);
      setGrid(true);
    } else toast(`${VEHICLES[kind].short} purchased.`);
  }
  function upgrade(path: PathName) {
    if (!owned || phase !== 'garage' || !upgradeAllowed(owned, path)) return;
    const cost = upgradePrice(run, owned, path);
    if (run.cash < cost) return;
    setRun((r) => ({
      ...r,
      cash: r.cash - cost,
      fleet: r.fleet.map((v) =>
        v.id === owned.id
          ? {
              ...v,
              spent: v.spent + cost,
              upgrades: { ...v.upgrades, [path]: v.upgrades[path] + 1 },
            }
          : v,
      ),
    }));
  }
  function sell() {
    if (!owned || phase !== 'garage') return;
    if (!canSellVehicle(run, owned.id))
      return toast('Keep enough cash to replace your last vehicle.');
    const refund = Math.floor(owned.spent * 0.7);
    setRun((r) => sellVehicle(r, owned.id));
    setSelected(null);
    toast(`Vehicle sold for $${refund}.`);
  }
  const place = useCallback(
    (x: number, z: number) => {
      const vehicle = run.fleet.find((v) => v.id === placing);
      if (phase !== 'setup' || !vehicle) return;
      if (!canPlace(arena, run.fleet, vehicle, x, z))
        return toast('Choose a clear area with room for the vehicle’s footprint.');
      setRun((r) => ({
        ...r,
        fleet: r.fleet.map((v) => (v.id === vehicle.id ? { ...v, placed: true, x, z } : v)),
      }));
      const next = run.fleet.find((v) => !v.placed && v.id !== vehicle.id);
      setPlacing(next?.id ?? null);
      setGrid(!!next);
      if (next) setSelected(next.id);
      playCue(650);
    },
    [phase, placing, arena, run.fleet, sound],
  );
  function deployVehicle(id: number) {
    setPhase('setup');
    setSelected(id);
    setPlacing(id);
    setGrid(true);
  }
  function exportReplay() {
    const current = simRef.current;
    if (!current) return;
    const blob = new Blob([JSON.stringify(current.replay(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `balloon-round-${current.run.round}-replay.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  function rotateVehicle() {
    if (phase !== 'setup' || !owned) return;
    const changed = { ...owned, rotation: (owned.rotation + Math.PI / 2) % (Math.PI * 2) };
    if (changed.placed && !canPlace(arena, run.fleet, changed, changed.x, changed.z))
      return toast('There isn’t enough room to rotate here. Move the vehicle first.');
    setRun((r) => ({ ...r, fleet: r.fleet.map((v) => (v.id === owned.id ? changed : v)) }));
  }
  function setup() {
    setPhase('setup');
    const next = run.fleet.find((v) => !v.placed);
    setPlacing(next?.id ?? null);
    setGrid(!!next);
    if (next) setSelected(next.id);
  }
  function openGarage(nextTab: 'shop' | 'fleet' | 'abilities' = 'shop') {
    vehicleTooltip.hide();
    if (nextTab === 'fleet' && !owned && run.fleet.length) setSelected(run.fleet[0].id);
    if (active || phase === 'countdown' || finished) return;
    setPlacing(null);
    setPhase('garage');
    setTab(nextTab);
  }
  function unplaceVehicle() {
    if (!owned || phase !== 'setup') return;
    setRun((r) => ({
      ...r,
      fleet: r.fleet.map((v) => (v.id === owned.id ? { ...v, placed: false } : v)),
    }));
    setPlacing(owned.id);
    setGrid(true);
  }
  function openModal(next: 'new' | 'help') {
    if (active) {
      latest.current.paused = true;
      setPaused(true);
    }
    setModal(next);
  }
  function toggleFullscreen() {
    const action = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    void action.catch(() => toast('Fullscreen is unavailable in this browser.'));
  }
  function playCue(frequency: number) {
    if (!sound) return;
    audio.current ??= new AudioContext();
    const ctx = audio.current;
    void ctx.resume();
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.4, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }
  function start(acceptRisk = false) {
    if (!placed || !ready || phase !== 'setup') return;
    if (!acceptRisk && (briefing.gaps.length || unplacedCount)) {
      setModal('launch');
      return;
    }
    setModal(null);
    setLastRound(null);
    simRef.current?.dispose();
    const s = new Simulation(run);
    simRef.current = s;
    setSim(s);
    setSummary(null);
    setPaused(false);
    setPhase('countdown');
    setCountdown(2);
    setSelected(null);
    setPlacing(null);
    setArmed(null);
    playCue(330);
    notifiedPops.current = 0;
    notifiedRushes.current = 0;
  }
  function useAbility(kind: AbilityKind) {
    if (!sim || !active || paused) return;
    const charges = sim.abilityReady[kind];
    if (!charges.some((t) => t <= sim.tick)) return;
    setArmed(armed === kind ? null : kind);
  }
  function vehicleClick(id: number) {
    setSelected(id);
    if (active && armed === 'boost') {
      sim?.enqueue({ ability: 'boost', vehicleId: id });
      setArmed(null);
    } else if (phase === 'setup') setPlacing(null);
  }
  function setTargeting(targeting: TargetMode) {
    if (!owned) return;
    if (active) sim?.enqueue({ ability: 'targeting', vehicleId: owned.id, targeting });
    setRun((r) => ({
      ...r,
      fleet: r.fleet.map((v) => (v.id === owned.id ? { ...v, targeting } : v)),
    }));
  }
  function point(x: number, z: number) {
    if (!active || paused || !armed) return;
    if (armed === 'pitchfork') {
      sim?.enqueue({ ability: armed, x: x + 0.5, z: z + 0.5 });
      setArmed(null);
    }
  }
  function gust(dx: number, dz: number) {
    if (active && !paused && armed === 'gust') {
      sim?.enqueue({ ability: 'gust', dx, dz });
      setArmed(null);
    }
  }
  function nextRound() {
    if (run.lives <= 0) {
      setPhase('over');
      return;
    }
    if (run.round >= MODES[run.mode].rounds && !run.freeplay) {
      setPhase('victory');
      return;
    }
    simRef.current?.dispose();
    simRef.current = null;
    setSim(null);
    setRun((r) => ({ ...r, round: r.round + 1 }));
    setPhase('garage');
    setSelected(run.fleet[0]?.id ?? null);
    setPlacing(null);
    setGrid(false);
    setTab('fleet');
    setArmed(null);
  }
  function restart() {
    simRef.current?.dispose();
    simRef.current = null;
    setSim(null);
    const fresh = newRun(newMode, newArena);
    setRun(fresh);
    setPhase('setup');
    setSpeed(1);
    setPlacing(null);
    setGrid(false);
    setSummary(null);
    setLastRound(null);
    setSelected(null);
    setTab('shop');
    setRotation(0);
    setZoom(1);
    setModal(null);
    setPaused(false);
    setArmed(null);
  }
  function buyAbility(kind: AbilityKind) {
    if (phase !== 'garage' || !canBuyAbility(run, kind)) return;
    setRun((r) => purchaseAbility(r, kind));
  }
  function toggleSound() {
    if (!sound) {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    }
    setSound(!sound);
  }
  useEffect(() => {
    if (phase !== 'countdown' || modal) return;
    if (countdown === 0) {
      setPhase('round');
      playCue(880);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((n) => n - 1);
      playCue(330);
    }, 350);
    return () => clearTimeout(timer);
  }, [phase, countdown, modal]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) ||
        e.repeat
      )
        return;
      const letter = e.key.toLowerCase();
      if (e.key === 'Escape') {
        e.preventDefault();
        if (modal) {
          setModal(null);
          return;
        }
        if (phase === 'garage') {
          setup();
          return;
        }
        if (placing !== null) {
          setPlacing(null);
          setGrid(false);
          return;
        }
        if (armed) {
          setArmed(null);
          return;
        }
        if (active) setPaused((p) => !p);
        else setSelected(null);
        return;
      }
      // Let focused controls use their native activation instead of game shortcuts.
      if (
        (e.key === 'Enter' || e.code === 'Space') &&
        e.target instanceof Element &&
        e.target.closest('button, a[href], [role="button"]')
      )
        return;
      if (modal || phase === 'countdown') return;
      if (finished) {
        if (e.key === 'Enter' && phase === 'summary') {
          e.preventDefault();
          nextRound();
        }
        return;
      }
      if (e.code === 'Space' && active) {
        e.preventDefault();
        setPaused((p) => !p);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (phase === 'garage') setup();
        else if (phase === 'setup') start();
        else if (active && !paused && sim?.canFinishEarly) sim.enqueue({ ability: 'finish' });
      }
      if (letter === 'r') rotateVehicle();
      if (letter === 'g' && !active) {
        e.preventDefault();
        phase === 'garage' ? setup() : openGarage();
      }
      if (letter === 'v') setRotation((r) => r - 1);
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(1.6, z + 0.15));
      if (e.key === '-') setZoom((z) => Math.max(0.65, z - 0.15));
      if ((e.key === 'Delete' || e.key === 'Backspace') && phase === 'setup') {
        e.preventDefault();
        unplaceVehicle();
      }
      if (active) {
        if (['1', '2', '3'].includes(e.key)) setSpeed(Number(e.key));
        const i = ['q', 'w', 'e'].indexOf(letter);
        if (i >= 0) useAbility((['gust', 'boost', 'pitchfork'] as AbilityKind[])[i]);
      } else if (phase === 'setup' && ['1', '2', '3', '4', '5', '6'].includes(e.key))
        buy((Object.keys(VEHICLES) as VehicleKind[])[Number(e.key) - 1], true);
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  useEffect(() => {
    if (contentPanel.current) contentPanel.current.scrollTop = 0;
  }, [phase, tab]);
  void frame;
  return (
    <div
      className={`game-shell ${phase === 'round' ? 'in-round' : ''} ${placing !== null || armed ? 'targeting' : ''}`}
    >
      <VehicleTooltip hint={vehicleTooltip.hint} />
      <div className="game-world">
        <ArenaScene
          run={run}
          interpolation={interpolation}
          sim={sim}
          phase={phase}
          selected={selected}
          placementId={placing}
          shopKind={shopKind}
          grid={grid}
          rotation={rotation}
          zoom={zoom}
          onPlace={place}
          onVehicle={vehicleClick}
          onVehicleHover={(kind, x = 0, y = 0) => {
            if (kind && !armed && !modal && (phase === 'setup' || phase === 'round'))
              vehicleTooltip.showAt(kind, { left: x, right: x, top: y, bottom: y });
            else vehicleTooltip.hide();
          }}
          onPoint={point}
          onGust={gust}
          armed={armed}
        />
      </div>
      <div className="world-vignette" />
      {active && sim && <ArcadeFeedback sim={sim} paused={paused} />}
      <header className="game-hud">
        <div className="hud-resources">
          <div className="hud-stat hearts" title="Lives">
            <Heart fill="currentColor" size={25} />
            <strong>{run.lives}</strong>
          </div>
          <div className="hud-stat coins" title="Cash">
            <Coins size={25} />
            <strong>${money(run.cash + (active ? (sim?.popCash ?? 0) : 0))}</strong>
          </div>
        </div>
        <div className="wave-hud">
          <div className="wave-heading">
            <span>ROUND</span>
            <strong>{String(run.round).padStart(2, '0')}</strong>
            <span className="round-total">/ {MODES[run.mode].rounds}</span>
          </div>
          <span className="wave-state">
            {active
              ? paused
                ? 'PAUSED'
                : time(sim?.secondsLeft ?? 180)
              : phase === 'countdown'
                ? 'GET READY'
                : phase === 'summary'
                  ? 'COMPLETE'
                  : 'PREPARE'}
          </span>
          {active && (
            <div className="wave-time">
              <i style={{ width: `${((sim?.secondsLeft ?? 180) / 180) * 100}%` }} />
            </div>
          )}
        </div>
        <div className="hud-menu">
          <button
            className="game-icon"
            title="Fullscreen"
            aria-label="Toggle fullscreen"
            onClick={toggleFullscreen}
          >
            <Maximize size={19} />
          </button>
          <button
            className="game-icon"
            title={sound ? 'Mute' : 'Sound'}
            aria-label={sound ? 'Mute sound' : 'Enable sound'}
            onClick={toggleSound}
          >
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            className="game-icon"
            title="How to play"
            aria-label="How to play"
            onClick={() => openModal('help')}
          >
            <HelpCircle size={19} />
          </button>
          <button
            className="game-icon"
            title="New run"
            aria-label="New run"
            onClick={() => openModal('new')}
          >
            <Settings2 size={19} />
          </button>
        </div>
      </header>
      <div className="arena-corner">
        <Home size={13} />
        <span>{run.arena === 'barn' ? 'BARN' : 'CONSTRUCTION YARD'}</span>
        <i />
        <span>{run.mode.toUpperCase()}</span>
      </div>
      {active && (
        <div className="wave-preview">
          <span>
            {active
              ? `${sim?.balloons.length ?? 0} ALIVE · ${sim?.pending ?? 0} INCOMING`
              : 'NEXT WAVE'}
          </span>
          <div>
            {types.map((type) => (
              <span
                key={type}
                className={`balloon-swatch ${type}`}
                title={BALLOONS[type].name}
                aria-label={BALLOONS[type].name}
                style={{ background: BALLOONS[type].color }}
              />
            ))}
          </div>
        </div>
      )}
      {phase === 'setup' && (
        <div className="field-briefing">
          <WaveBriefing
            run={run}
            compact
            onDeploy={deployVehicle}
            onBuy={(kind) => buy(kind, true)}
            onUpgrade={(id) => {
              openGarage('fleet');
              setSelected(id);
            }}
          />
        </div>
      )}
      {phase === 'setup' && placing !== null && (
        <div className="field-instruction">
          <MousePointer2 size={16} />
          <span>Click to place</span>
          <kbd>R</kbd>
          <span>Rotate</span>
          <kbd>ESC</kbd>
          <span>Cancel</span>
        </div>
      )}
      {phase === 'setup' && !run.fleet.length && (
        <div className="field-instruction">
          <MousePointer2 size={16} />
          <span>Choose a vehicle to deploy</span>
          <ArrowDown size={15} />
        </div>
      )}
      {armed && (
        <div className="field-instruction ability-instruction">
          <Sparkles size={16} />
          <span>{ABILITIES[armed].description}</span>
          <button aria-label="Cancel ability" onClick={() => setArmed(null)}>
            <X size={15} />
          </button>
        </div>
      )}
      {owned && placing === null && phase === 'setup' && (
        <div className="field-inspector">
          <div className="inspector-title">
            <VehicleThumb kind={owned.kind} />
            <div>
              <strong>{VEHICLES[owned.kind].short}</strong>
              <span>
                {heightLabel(vehicleStats(owned).min, vehicleStats(owned).max)} high ·{' '}
                {vehicleStats(owned).range} m tool reach
              </span>
            </div>
            <button aria-label="Deselect vehicle" onClick={() => setSelected(null)}>
              <X size={15} />
            </button>
          </div>
          <p className="inspector-capability">{armorLabel(owned)}</p>
          <VehicleMatchup run={run} kind={owned.kind} vehicle={owned} />
          <label>
            Strategy
            <select
              aria-label="Targeting mode"
              value={owned.targeting}
              onChange={(e) => setTargeting(e.target.value as TargetMode)}
            >
              {TARGETS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <div className="inspector-actions">
            <button
              onClick={() => {
                setPlacing(owned.id);
                setGrid(true);
              }}
            >
              <MousePointer2 size={14} />
              {owned.placed ? 'Move' : 'Deploy'}
            </button>
            <button onClick={rotateVehicle} title="Rotate vehicle">
              <RotateCw size={14} />
            </button>
            <button onClick={unplaceVehicle} disabled={!owned.placed} title="Recall vehicle">
              <Minus size={14} />
            </button>
            <button onClick={() => openGarage('fleet')} title="Upgrade vehicle">
              <Wrench size={14} />
            </button>
          </div>
        </div>
      )}
      {active && owned && liveVehicle && sim && (
        <div className="field-inspector live-inspector">
          <div className="inspector-title">
            <VehicleThumb kind={owned.kind} />
            <div>
              <strong>{VEHICLES[owned.kind].short}</strong>
              <span>
                {liveVehicle.pops} pops · {vehicleStats(liveVehicle).min}–
                {vehicleStats(liveVehicle).max} m
              </span>
            </div>
            <button aria-label="Deselect vehicle" onClick={() => setSelected(null)}>
              <X size={15} />
            </button>
          </div>
          <p className="vehicle-status" role="status">
            {sim.vehicleStatus(liveVehicle)}
          </p>
          <label>
            Strategy
            <select
              aria-label="Targeting mode"
              value={owned.targeting}
              onChange={(e) => setTargeting(e.target.value as TargetMode)}
            >
              {TARGETS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          {owned.upgrades.unique >= 3 && (
            <button
              className="secondary full-width"
              disabled={paused || liveVehicle.cooldown > sim.tick}
              onClick={() => sim.enqueue({ ability: 'vehicle', vehicleId: selected! })}
            >
              {VEHICLE_ABILITIES[owned.kind].name} <Zap size={15} />
            </button>
          )}
        </div>
      )}
      {active && sim && (
        <div className="fleet-monitor" aria-label="Active fleet">
          {sim.vehicles.map((v) => (
            <button
              key={v.id}
              {...vehicleTooltip.props(v.kind)}
              aria-label={`Select ${VEHICLES[v.kind].short} ${v.id}`}
              className={selected === v.id ? 'selected' : ''}
              onClick={() => vehicleClick(v.id)}
            >
              <VehicleThumb kind={v.kind} />
              <span>
                <strong>
                  {VEHICLES[v.kind].short} <small>{v.id}</small>
                </strong>
                <span>{v.targeting}</span>
                <span className={`fleet-state ${v.state}`}>{sim.vehicleStatus(v)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="view-controls">
        <button
          className="game-icon"
          aria-label="Rotate camera left"
          title="Rotate view · V"
          onClick={() => setRotation((r) => r - 1)}
        >
          <RotateCcw size={17} />
        </button>
        <button
          className="game-icon"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(0.65, z - 0.15))}
        >
          <Minus size={17} />
        </button>
        <button
          className="game-icon"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
        >
          <Plus size={17} />
        </button>
        {!active && (
          <button
            className={`game-icon ${grid ? 'on' : ''}`}
            aria-label="Toggle placement grid"
            onClick={() => setGrid((g) => !g)}
          >
            <Grid2X2 size={17} />
          </button>
        )}
      </div>
      {phase === 'setup' && (
        <div className="deployment-hud">
          <button className="garage-toggle" onClick={() => openGarage('shop')}>
            <Wrench size={24} />
            <span>GARAGE</span>
            <kbd>G</kbd>
          </button>
          <div className="deployment-tray">
            {run.fleet.map((v) => (
              <button
                key={v.id}
                {...vehicleTooltip.props(v.kind)}
                className={`deployment-slot ${selected === v.id ? 'selected' : ''} ${placing === v.id ? 'placing' : ''}`}
                aria-label={`${v.placed ? 'Select' : 'Deploy'} ${VEHICLES[v.kind].short} ${v.id}`}
                onClick={() => {
                  setSelected(v.id);
                  if (!v.placed) {
                    setPlacing(v.id);
                    setGrid(true);
                  } else setPlacing(null);
                }}
              >
                <VehicleThumb kind={v.kind} />
                <span>{VEHICLES[v.kind].short}</span>
                {v.placed ? (
                  <Check className="deployed-check" size={12} />
                ) : (
                  <span className="deploy-dot" />
                )}
              </button>
            ))}
            {(Object.keys(VEHICLES) as VehicleKind[]).map((kind, i) => (
              <button
                key={kind}
                {...vehicleTooltip.props(kind)}
                className="deployment-slot purchase-slot"
                aria-label={`Buy ${VEHICLES[kind].short} $${price(run, VEHICLES[kind].cost)}`}
                disabled={run.cash < price(run, VEHICLES[kind].cost)}
                onClick={() => buy(kind, true)}
              >
                <kbd>{i + 1}</kbd>
                <VehicleThumb kind={kind} />
                <span>{VEHICLES[kind].short}</span>
                <b>
                  <Plus size={10} />${price(run, VEHICLES[kind].cost)}
                </b>
              </button>
            ))}
          </div>
          <button
            className={`start-wave ${placed > 0 ? 'ready' : ''} ${placed && (briefing.gaps.length || unplacedCount) ? 'has-risk' : ''}`}
            aria-label="Start wave"
            disabled={!placed || !ready}
            onClick={() => start()}
          >
            <Play fill="currentColor" size={24} />
            <span>
              {briefing.gaps.length || unplacedCount ? 'REVIEW & START' : 'START WAVE'}
              <small>
                {briefing.gaps.length
                  ? `${briefing.gaps.length} COVERAGE GAP${briefing.gaps.length === 1 ? '' : 'S'}`
                  : unplacedCount
                    ? `${unplacedCount} UNDEPLOYED`
                    : `${placed} DEPLOYED`}{' '}
                <kbd>ENTER</kbd>
              </small>
            </span>
          </button>
        </div>
      )}
      {active && (
        <div className="combat-hud">
          {liveUncovered.length > 0 && (
            <div className="live-coverage-warning" role="status">
              <AlertTriangle size={16} />
              <span>
                <strong>
                  {liveUncovered.length} balloon{liveUncovered.length === 1 ? '' : 's'} out of fleet
                  coverage
                </strong>
                <small>
                  {heightLabel(
                    Math.min(...liveUncovered.map((b) => b.y)),
                    Math.max(...liveUncovered.map((b) => b.y)),
                  )}{' '}
                  high{liveUncovered.some((b) => b.armor) ? ' · armor protected' : ''}. Use
                  abilities to help.
                </small>
              </span>
            </div>
          )}
          {sim?.canFinishEarly && (
            <button
              className="finish-wave"
              disabled={paused}
              onClick={() => {
                sim.enqueue({ ability: 'finish' });
                setArmed(null);
              }}
            >
              <Flag size={16} />
              <span>
                End wave{' '}
                <small>
                  −
                  {sim.balloons.reduce(
                    (sum, b) => sum + (b.kind === 'layered' ? b.layer : BALLOONS[b.kind].lives),
                    0,
                  )}{' '}
                  lives
                </small>
              </span>
              <kbd>ENTER</kbd>
            </button>
          )}
          <div className="pop-score">
            <Sparkles size={17} />
            <strong key={sim?.pops ?? 0}>{sim?.pops ?? 0}</strong>
            <span>POPS</span>
          </div>
          <div className="ability-belt">
            {(Object.keys(ABILITIES) as AbilityKind[]).map((kind, i) => {
              const bought = run.abilities[kind] !== undefined,
                charges = sim?.abilityReady[kind] ?? [],
                available = charges.some((t) => t <= (sim?.tick ?? 0)),
                remaining = charges.length
                  ? Math.max(0, Math.min(...charges) - (sim?.tick ?? 0)) / 60
                  : 0,
                total = ABILITIES[kind].cooldown * (run.abilities[kind]! >= 1 ? 0.8 : 1);
              return (
                <button
                  key={kind}
                  className={`combat-ability ${armed === kind ? 'armed' : ''} ${available ? 'ready' : ''}`}
                  aria-label={`${ABILITIES[kind].name}${bought ? (available ? ' ready' : ` cooldown ${Math.ceil(remaining)}s`) : ' locked'}`}
                  title={ABILITIES[kind].description}
                  disabled={!bought || !available || paused}
                  onClick={() => useAbility(kind)}
                  style={
                    {
                      '--charge': `${bought ? (1 - remaining / total) * 100 : 0}%`,
                    } as React.CSSProperties
                  }
                >
                  <kbd>{['Q', 'W', 'E'][i]}</kbd>
                  <div>
                    {!bought ? (
                      <Lock size={23} />
                    ) : kind === 'gust' ? (
                      <Wind size={28} />
                    ) : kind === 'boost' ? (
                      <Zap size={28} />
                    ) : (
                      <Sprout size={28} />
                    )}
                  </div>
                  <span>
                    {bought && !available ? `${Math.ceil(remaining)}s` : ABILITIES[kind].name}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="combat-controls">
            <div>
              {[1, 2, 3].map((n) => (
                <button className={speed === n ? 'active' : ''} key={n} onClick={() => setSpeed(n)}>
                  {n}×
                </button>
              ))}
            </div>
            <button
              className="game-icon pause-toggle"
              aria-label={paused ? 'Resume round' : 'Pause round'}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? <Play size={20} /> : <Pause size={20} />}
            </button>
          </div>
        </div>
      )}
      {phase === 'countdown' && (
        <div className="round-countdown" key={countdown}>
          <span>ROUND {run.round}</span>
          <strong>{countdown === 2 ? 'READY?' : 'POP!'}</strong>
        </div>
      )}
      {active && paused && !modal && (
        <div className="pause-backdrop">
          <section className="pause-menu" role="dialog" aria-modal="true" aria-label="Pause menu">
            <Pause size={30} />
            <h2>PAUSED</h2>
            <button className="primary full-width" onClick={() => setPaused(false)}>
              <Play size={19} />
              Resume<kbd>SPACE</kbd>
            </button>
            <button className="secondary full-width" onClick={() => openModal('help')}>
              Controls
              <HelpCircle size={18} />
            </button>
            <button className="text-button" onClick={() => openModal('new')}>
              New run
            </button>
          </section>
        </div>
      )}
      {phase === 'garage' && (
        <div className="garage-scrim">
          <aside className="garage-panel" role="dialog" aria-modal="true" aria-label="Garage">
            <div className="panel-heading">
              <div>
                <h2>Prepare for round {run.round}</h2>
                <p className="workshop-subtitle">
                  <span>1 Upgrade</span>
                  <i /> <span>2 Check coverage</span>
                  <i /> <span>3 Deploy</span>
                  <i /> <span>4 Launch</span>
                </p>
              </div>
              <div className="garage-balance" aria-label={`Balance $${money(run.cash)}`}>
                <span>BALANCE</span>
                <strong>${money(run.cash)}</strong>
                {lastRound !== null && summary && <b>+${money(summary.earned)} payout</b>}
              </div>
              <button
                className="icon-button garage-close"
                aria-label="Close garage"
                onClick={setup}
              >
                <X size={20} />
              </button>
            </div>
            {lastRound !== null && summary && (
              <div className={`round-receipt ${summary.livesLost ? 'lost' : ''}`} role="status">
                {summary.cleared ? <Flag size={22} /> : <AlertTriangle size={22} />}
                <div>
                  <strong>
                    Round {lastRound}{' '}
                    {summary.cleared
                      ? 'cleared!'
                      : summary.reason === 'uncovered'
                        ? 'ended · coverage gap'
                        : 'ended · time expired'}
                  </strong>
                  <span>
                    {summary.pops} pops · {time(summary.seconds)} ·{' '}
                    {summary.livesLost ? `−${summary.livesLost} lives` : 'No lives lost'} · Best
                    chain {summary.bestStreak}×
                  </span>
                </div>
                <div className="receipt-earnings">
                  <strong>+${money(summary.earned)}</strong>
                  <span>Balance ${money(run.cash)}</span>
                </div>
                <details>
                  <summary>Payout</summary>
                  <div>
                    <span>
                      Pops +${summary.popCash} · Income +${summary.baseIncome} · Bonus +$
                      {summary.bonus}
                    </span>
                    <button onClick={exportReplay}>Export round replay</button>
                  </div>
                </details>
              </div>
            )}
            <div className="preparation-layout">
              <div className="preparation-briefing">
                <WaveBriefing
                  run={run}
                  onDeploy={deployVehicle}
                  onBuy={(kind) => buy(kind)}
                  onUpgrade={(id) => {
                    setSelected(id);
                    setTab('fleet');
                  }}
                />
              </div>
              <div className="workshop-area">
                {!active && (
                  <div className="panel-tabs">
                    {(['shop', 'fleet', 'abilities'] as const).map((t) => (
                      <button
                        key={t}
                        className={tab === t ? 'active' : ''}
                        onClick={() => {
                          vehicleTooltip.hide();
                          if (t === 'fleet' && !owned && run.fleet.length)
                            setSelected(run.fleet[0].id);
                          setTab(t);
                        }}
                      >
                        {t === 'shop'
                          ? 'Vehicle shop'
                          : t === 'fleet'
                            ? `Upgrades (${run.fleet.length})`
                            : 'Abilities'}
                      </button>
                    ))}
                  </div>
                )}
                <div className={`panel-content tab-${tab}`} ref={contentPanel}>
                  {tab === 'shop' ? (
                    <>
                      {(Object.keys(VEHICLES) as VehicleKind[]).map((kind) => {
                        const v = VEHICLES[kind];
                        const guide = VEHICLE_GUIDES[kind];
                        const cost = price(run, v.cost);
                        return (
                          <article
                            key={kind}
                            tabIndex={0}
                            className={`shop-card ${shopKind === kind ? 'selected' : ''}`}
                            onClick={() => setShopKind(kind)}
                          >
                            <div className="shop-card-main">
                              <div className={`thumb-bg ${kind}`}>
                                <VehicleThumb kind={kind} />
                              </div>
                              <div className="shop-card-info">
                                <span className="tool-tag">{v.tool}</span>
                                <h3>{v.name}</h3>
                                <p>{v.role}</p>
                              </div>
                            </div>
                            <div className="shop-card-guide">
                              <div className="shop-card-specs">
                                <span>STOCK CHASSIS</span>
                                <b>
                                  {v.min}–{v.max} m high
                                </b>
                                <b>{v.range} m range</b>
                              </div>
                              <p className="shop-card-guide-point strength">
                                <Check size={15} />
                                <span>
                                  <b>Strengths</b>
                                  {guide.strength}
                                </span>
                              </p>
                              <p className="shop-card-guide-point weakness">
                                <ShieldAlert size={15} />
                                <span>
                                  <b>Weaknesses</b>
                                  {guide.weakness}
                                </span>
                              </p>
                              <p className="shop-card-partner">{guide.partner}</p>
                            </div>
                            <VehicleMatchup run={run} kind={kind} />
                            <div className="shop-card-bottom">
                              <span>
                                {kind === 'harvester' || kind === 'sprayer' || kind === 'baler' ? (
                                  <Leaf size={12} />
                                ) : (
                                  <Wrench size={12} />
                                )}{' '}
                                {kind === 'harvester' || kind === 'sprayer' || kind === 'baler'
                                  ? 'FARM'
                                  : kind === 'blower'
                                    ? 'UTILITY'
                                    : 'CONSTRUCTION'}
                                <small>{v.footprint.join(' × ')} CELLS</small>
                              </span>
                              <button
                                className="buy-button"
                                disabled={cost > run.cash || phase !== 'garage'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  buy(kind);
                                }}
                              >
                                <Plus size={13} /> ${cost}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </>
                  ) : tab === 'fleet' ? (
                    <>
                      {run.fleet.length === 0 ? (
                        <div className="empty-state">
                          <Tractor size={34} />
                          <h3>No vehicles</h3>
                          <button className="text-button" onClick={() => setTab('shop')}>
                            Browse vehicles <ArrowRight size={15} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="fleet-list">
                            <div className="section-label">
                              YOUR VEHICLES <span>{run.fleet.length} OWNED</span>
                            </div>
                            {run.fleet.map((v) => (
                              <button
                                {...vehicleTooltip.props(v.kind)}
                                aria-label={`Select ${VEHICLES[v.kind].short} ${v.id} for upgrades`}
                                className={`fleet-item ${selected === v.id ? 'selected' : ''}`}
                                key={v.id}
                                onClick={() => {
                                  setSelected(v.id);
                                  setShopKind(v.kind);
                                }}
                              >
                                <VehicleThumb kind={v.kind} />
                                <div>
                                  <strong>
                                    {VEHICLES[v.kind].short} <small>#{v.id}</small>
                                  </strong>
                                  <span>
                                    {v.placed ? 'Deployed · ' + v.targeting : 'In the garage'}
                                  </span>
                                </div>
                                {v.placed ? <Check size={16} /> : <MousePointer2 size={16} />}
                              </button>
                            ))}
                          </div>
                          {owned && (
                            <div className="vehicle-detail">
                              <VehicleProfile vehicle={owned} />
                              <VehicleMatchup run={run} kind={owned.kind} vehicle={owned} />
                              <>
                                <UpgradePanel run={run} vehicle={owned} onUpgrade={upgrade} />
                                <button
                                  className="sell-button"
                                  onClick={sell}
                                  disabled={!canSellVehicle(run, owned.id)}
                                  title={
                                    !canSellVehicle(run, owned.id)
                                      ? 'Keep enough cash to replace your last vehicle.'
                                      : undefined
                                  }
                                >
                                  <Trash2 size={13} /> Sell vehicle{' '}
                                  <strong>+${Math.floor(owned.spent * 0.7)}</strong>
                                </button>
                              </>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="section-label">GLOBAL ABILITIES</div>
                      <p className="abilities-intro">
                        Buy once. Ready at the start of every round.
                      </p>
                      {(Object.keys(ABILITIES) as AbilityKind[]).map((kind) => {
                        const a = ABILITIES[kind],
                          tier = run.abilities[kind];
                        const cost = abilityCost(run, kind);
                        return (
                          <article className="ability-card" key={kind}>
                            <div className="ability-card-heading">
                              <span className={`ability-icon ${kind}`}>
                                {kind === 'gust' ? (
                                  <Wind size={21} />
                                ) : kind === 'boost' ? (
                                  <Zap size={21} />
                                ) : (
                                  <Sprout size={21} />
                                )}
                              </span>
                              <div>
                                <h3>{a.name}</h3>
                                <span>
                                  {Math.round(
                                    a.cooldown * (tier !== undefined && tier >= 1 ? 0.8 : 1),
                                  )}
                                  s COOLDOWN {tier === 2 ? '· 2 CHARGES' : ''}
                                </span>
                              </div>
                            </div>
                            <p>{a.description}</p>
                            <button
                              disabled={!canBuyAbility(run, kind) || phase !== 'garage'}
                              title={
                                !run.fleet.length && cost <= run.cash && !canBuyAbility(run, kind)
                                  ? 'Buy a vehicle first or keep enough cash for one.'
                                  : undefined
                              }
                              onClick={() => buyAbility(kind)}
                            >
                              {tier === 2 ? (
                                <>
                                  <Check size={14} /> Fully upgraded
                                </>
                              ) : (
                                <>
                                  {tier === undefined
                                    ? 'Buy ability'
                                    : tier === 0
                                      ? 'Upgrade: 20% faster recharge'
                                      : 'Upgrade: second charge'}
                                  <strong>${cost}</strong>
                                </>
                              )}
                            </button>
                          </article>
                        );
                      })}
                      <div className="garage-note">
                        <Sparkles size={17} />
                        <p>Vehicle abilities unlock at tier 3 of their unique upgrade path.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="panel-bottom">
              <span>Next: check coverage &amp; place vehicles</span>
              <button className="primary full-width" disabled={!ready} onClick={setup}>
                {unplacedCount
                  ? `Deploy ${unplacedCount} vehicle${unplacedCount === 1 ? '' : 's'} in arena`
                  : 'Review deployment'}{' '}
                <ArrowRight size={18} />
              </button>
              {!ready && <p className="bottom-note">Loading physics…</p>}
            </div>
          </aside>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <span className="status-dot" />
          {notice}
          <button aria-label="Dismiss notification" onClick={() => setNotice('')}>
            <X size={14} />
          </button>
        </div>
      )}
      {engineError && <div className="toast error">Physics could not load: {engineError}</div>}
      {finished && (
        <div className="modal-backdrop">
          <section
            className="modal summary-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Round results"
          >
            {phase === 'summary' && summary ? (
              <>
                <div className={`summary-emblem ${summary.cleared ? '' : 'lost'}`}>
                  {summary.cleared ? <Flag size={32} /> : <Shield size={32} />}
                </div>
                <span className="eyebrow">ROUND {String(run.round).padStart(2, '0')} COMPLETE</span>
                <h2>
                  {summary.cleared
                    ? 'Round cleared'
                    : summary.reason === 'uncovered'
                      ? 'Wave ended'
                      : 'Time expired'}
                </h2>

                <div className="summary-stats">
                  <div>
                    <strong>{summary.pops}</strong>
                    <span>BALLOONS POPPED</span>
                  </div>
                  <div>
                    <strong className={summary.livesLost ? 'danger' : ''}>
                      {summary.livesLost ? `−${summary.livesLost}` : '0'}
                    </strong>
                    <span>LIVES LOST</span>
                  </div>
                  <div>
                    <strong>{time(summary.seconds)}</strong>
                    <span>ROUND TIME</span>
                  </div>
                </div>
                <div className="payout">
                  <span>
                    Pop earnings <b>+${summary.popCash}</b>
                  </span>
                  <span>
                    Round income <b>+${summary.baseIncome}</b>
                  </span>
                  <span>
                    Clear bonus <b>+${summary.bonus}</b>
                  </span>
                  <strong>
                    Total earned <b>+${summary.earned}</b>
                  </strong>
                </div>
                <div className="top-vehicle">
                  <Tractor size={17} />
                  <span>
                    MVP <strong>{summary.topVehicle}</strong>
                  </span>
                </div>
                <div className="round-highlights">
                  <span>
                    <Zap size={14} /> <b>{summary.rushes}</b> POP RUSHES
                  </span>
                  <span>
                    <Sparkles size={14} /> <b>{summary.bestStreak}×</b> BEST CHAIN
                  </span>
                </div>
                <button className="primary full-width" onClick={nextRound}>
                  {run.lives <= 0
                    ? 'View results'
                    : run.round >= MODES[run.mode].rounds && !run.freeplay
                      ? 'Claim victory'
                      : 'Upgrade & prepare'}
                  <ArrowRight size={18} />
                </button>
                <button className="text-button replay-button" onClick={exportReplay}>
                  Export round replay
                </button>
              </>
            ) : phase === 'victory' ? (
              <>
                <div className="summary-emblem">
                  <Flag size={34} />
                </div>
                <span className="eyebrow">{run.mode.toUpperCase()} RUN COMPLETE</span>
                <h2>Victory</h2>
                <p>
                  {MODES[run.mode].rounds} rounds survived · {run.lives} lives remaining
                </p>
                <button
                  className="primary full-width"
                  onClick={() => {
                    setRun((r) => ({ ...r, freeplay: true, round: r.round + 1 }));
                    setPhase('setup');
                    simRef.current?.dispose();
                    simRef.current = null;
                    setSim(null);
                  }}
                >
                  Continue in freeplay <ArrowRight size={17} />
                </button>
                <button className="secondary full-width" onClick={() => openModal('new')}>
                  Start a new run
                </button>
              </>
            ) : (
              <>
                <div className="summary-emblem lost">
                  <Heart size={32} />
                </div>
                <span className="eyebrow">RUN ENDED · ROUND {run.round}</span>
                <h2>Game over</h2>
                <button className="primary full-width" onClick={() => openModal('new')}>
                  New run <RotateCcw size={17} />
                </button>
              </>
            )}
          </section>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop settings-backdrop">
          <section
            className={`modal ${modal === 'help' ? 'help-modal' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === 'help'
                ? 'How to play'
                : modal === 'launch'
                  ? 'Pre-launch coverage check'
                  : 'New run'
            }
          >
            <button
              className="modal-close icon-button"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={19} />
            </button>
            {modal === 'launch' ? (
              <>
                <div className="summary-emblem lost">
                  <AlertTriangle size={30} />
                </div>
                <span className="eyebrow">ROUND {run.round} · PRE-LAUNCH CHECK</span>
                <h2>Check your coverage</h2>
                <p className="launch-intro">
                  Your current deployment leaves these risks. You can adjust your fleet or launch
                  with them.
                </p>
                <div className="launch-gaps">
                  {briefing.gaps.map((t) => (
                    <div key={t.key}>
                      <AlertTriangle size={16} />
                      <span>
                        <strong>
                          {threatName(t)} · {heightLabel(t.min, t.max)} high
                        </strong>
                        <small>
                          {t.coverage === 'partial'
                            ? 'Part of the flight band is out of reach.'
                            : 'No deployed vehicle can hit these.'}
                          {t.armored ? ' Armor damage required.' : ''}
                        </small>
                      </span>
                    </div>
                  ))}
                  {unplacedCount > 0 && (
                    <div>
                      <Tractor size={16} />
                      <span>
                        <strong>
                          {unplacedCount} vehicle{unplacedCount === 1 ? '' : 's'} undeployed
                        </strong>
                        <small>Vehicles in the garage do not join the round.</small>
                      </span>
                    </div>
                  )}
                </div>
                <p className="launch-intro">
                  Any balloons left after 3 minutes cost lives. Abilities may help, but fleet
                  coverage is the reliable starting point.
                </p>
                <button
                  className="primary full-width"
                  onClick={() => {
                    setModal(null);
                    if (!unplacedCount) openGarage('shop');
                  }}
                >
                  Adjust {unplacedCount ? 'deployment' : 'fleet'} <Wrench size={17} />
                </button>
                <button className="secondary full-width launch-anyway" onClick={() => start(true)}>
                  Start round with these risks <Play size={17} />
                </button>
              </>
            ) : modal === 'new' ? (
              <>
                <BalloonLogo />
                <h2>New run</h2>
                <div className="section-label">DIFFICULTY</div>
                <div className="mode-options">
                  {(['easy', 'medium', 'hard'] as Mode[]).map((m) => (
                    <button
                      key={m}
                      className={newMode === m ? 'selected' : ''}
                      onClick={() => setNewMode(m)}
                    >
                      <strong>{m}</strong>
                      <span className="difficulty-hint">{MODES[m].description}</span>
                      <span>{MODES[m].rounds} rounds</span>
                      <small>
                        <Heart size={11} /> {MODES[m].lives} lives
                      </small>
                    </button>
                  ))}
                </div>
                <div className="section-label">YOUR ARENA</div>
                <div className="arena-options">
                  {(['barn', 'yard'] as ArenaKind[]).map((a) => (
                    <button
                      key={a}
                      className={newArena === a ? 'selected' : ''}
                      onClick={() => setNewArena(a)}
                    >
                      {a === 'barn' ? <Home size={24} /> : <Wrench size={24} />}
                      <strong>{a === 'barn' ? 'Barn' : 'Construction yard'}</strong>
                      <span>
                        {arenaFor(a).width} × {arenaFor(a).depth} m · {arenaFor(a).ceiling} m
                        ceiling
                      </span>
                    </button>
                  ))}
                </div>
                <div className="fresh-info">
                  <Coins size={16} />
                  $650 starting cash <span>·</span>{' '}
                  {run.fleet.length || run.round > 1
                    ? 'Replaces your saved run'
                    : 'Your progress saves between rounds'}
                </div>
                <button className="primary full-width" onClick={restart}>
                  Start run <ArrowRight size={17} />
                </button>
              </>
            ) : (
              <>
                <h2>How to play</h2>
                <div className="help-steps">
                  <div>
                    <span>01</span>
                    <section>
                      <h3>Build your fleet</h3>
                      <p>
                        After each round, earnings and upgrades open automatically. Buy and deploy
                        from the bottom bar. Open the garage with G to upgrade two paths, one to
                        tier 5 and the other to tier 2. Sell for 70% of your investment.
                      </p>
                    </section>
                  </div>
                  <div>
                    <span>02</span>
                    <section>
                      <h3>Place vehicles</h3>
                      <p>
                        Select a vehicle, then click a free cell. Press R to rotate, Esc to cancel.
                        The briefing shows exact incoming types, initial heights, armor, and any
                        coverage gaps. Choose targeting to match the wave.
                      </p>
                    </section>
                  </div>
                  <div>
                    <span>03</span>
                    <section>
                      <h3>Start the round</h3>
                      <p>
                        Vehicles move and attack automatically. Use purchased abilities during the
                        round. Space pauses; 1, 2, and 3 change speed. Q, W, and E select abilities.
                        Chain 10 pops with no gap over 2.5 seconds to trigger Pop Rush: five seconds
                        of faster movement and attacks for your entire fleet.
                      </p>
                    </section>
                  </div>
                </div>
                <div className="help-roles">
                  {(Object.keys(VEHICLES) as VehicleKind[]).map((k) => (
                    <div key={k}>
                      <VehicleThumb kind={k} />
                      <strong>{VEHICLES[k].short}</strong>
                      <p>
                        {VEHICLE_GUIDES[k].strength} {VEHICLE_GUIDES[k].weakness}
                      </p>
                      <span>
                        {VEHICLES[k].min}–{VEHICLES[k].max} m · {VEHICLES[k].tool}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="help-note">
                  Pop everything within 3 minutes for a cash bonus. Leftover balloons cost lives.
                  Excavators deal full armor damage; sprayers deal half. Attack tier 3 unlocks armor
                  damage for harvesters, cranes, and blowers. Balers deal quarter damage to armor.
                  Cranes and blowers reach high-flyers; pair them with low tools.
                </p>
                <button className="primary full-width" onClick={() => setModal(null)}>
                  Close <Check size={17} />
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
