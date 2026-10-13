import { useRef } from 'react';
import { ArrowLeftRight, Crosshair, LogOut, Pause, RotateCcw, Tractor, Zap } from 'lucide-react';
import { BALLOONS, VEHICLES, VEHICLE_ABILITIES } from '../sim/data';
import { vehicleStats } from '../sim/capabilities';
import type { SimView } from './sim-client';
import { canTargetBalloon, toolIntervalTicks, vehicleTool } from '../sim/capabilities';
import { balePathClear } from '../sim/vehicle-tools';
import { angleDifference } from '../sim/vehicle-motion';
import {
  driverAreaTargets,
  canSwitchDriverSide,
  driverSide,
  driverViewAngle,
  driverTarget,
  isContactTool,
  isCrawler,
  type DriverInput,
} from '../sim/vehicle-pilot';

export function DriverHUD({
  sim,
  vehicleId,
  input,
  focused,
  locked,
  lockUnavailable,
  paused,
  onExit,
  onPause,
  onNext,
  onMouse,
  onAbility,
  onBoost,
  onSide,
}: {
  sim: SimView;
  vehicleId: number;
  input: { current: DriverInput };
  focused: boolean;
  locked: boolean;
  lockUnavailable: boolean;
  paused: boolean;
  onExit: () => void;
  onPause: () => void;
  onNext: () => void;
  onMouse: () => void;
  onAbility: () => void;
  onBoost: () => void;
  onSide: () => void;
}) {
  const v = sim.vehicles.find((v) => v.id === vehicleId)!;
  const stats = vehicleStats(v);
  const entered = useRef(sim.tick);
  const feedback = useRef({ pops: v.pops, at: -100, amount: 0 });
  if (v.pops > feedback.current.pops) {
    feedback.current.amount = v.pops - feedback.current.pops;
    feedback.current.at = sim.tick;
    feedback.current.pops = v.pops;
  }
  const hit = sim.tick - feedback.current.at < 22;
  const contactTool = isContactTool(v.kind);
  const switchable = canSwitchDriverSide(v);
  const side = driverSide(v, input.current);
  const toolAngle = v.angle + (side === 'rear' ? Math.PI : 0);
  const contactName = v.kind === 'harvester' ? 'HEADER' : 'BLADE';
  const areaTool = vehicleTool(v).cone > 0;
  const contacts = driverAreaTargets(
    v,
    sim.balloons,
    contactTool ? v.angle : driverViewAngle(v, input.current),
    contactTool ? side : undefined,
  );
  const target = contacts[0] ?? driverTarget(v, input.current, sim.balloons);
  const distance = target ? Math.hypot(target.x - v.x, target.z - v.z) : 0;
  const aligned =
    !target ||
    !contactTool ||
    Math.abs(angleDifference(Math.atan2(target.x - v.x, target.z - v.z), toolAngle)) <=
      vehicleTool(v).cone;
  const eligible = target && canTargetBalloon(v, target.y, target.armor);
  const clear =
    !target ||
    v.kind !== 'baler' ||
    balePathClear(
      sim.arena,
      v.x,
      v.z,
      target.x,
      target.y,
      target.z,
      v.upgrades.unique >= 4 ? 0.65 : 0.35,
    );
  const ready = areaTool
    ? contacts.length > 0
    : !!target && eligible && distance <= stats.range && aligned && clear;
  const targetHint =
    contactTool && contacts.length > 0
      ? v.kind === 'harvester'
        ? 'HEADER CUTTING AUTOMATICALLY'
        : 'BLADE PLOWING AUTOMATICALLY'
      : !target
        ? contactTool
          ? `${contactName} CUTS ON CONTACT · DRIVE INTO BALLOONS`
          : 'Find a balloon. Make it pop.'
        : !eligible
          ? target.y < stats.min - 0.15 || target.y > stats.max + 0.2
            ? 'Outside tool height'
            : 'Armor needs upgrades'
          : distance > stats.range
            ? 'Move closer'
            : !aligned
              ? `Face the balloon with your ${contactName.toLowerCase()}`
              : !clear
                ? 'Shot blocked by scenery'
                : contactTool
                  ? `DRIVE INTO BALLOONS WITH YOUR ${contactName}`
                  : 'HOLD LMB TO POP';
  const gear = input.current.brake
    ? 'BRAKE'
    : v.speed < -0.1
      ? 'R'
      : Math.abs(v.speed) > 0.1
        ? 'D'
        : 'N';
  const ability = VEHICLE_ABILITIES[v.kind];
  const cooldown = Math.max(0, Math.ceil((v.cooldown - sim.tick) / 60));
  const boostBought = sim.run.abilities.boost !== undefined;
  const boostReady = sim.abilityReady.boost.some((tick) => tick <= sim.tick);
  const boostSeconds = Math.max(
    0,
    Math.ceil((Math.min(...sim.abilityReady.boost) - sim.tick) / 60),
  );
  const heading = ((((v.angle * 180) / Math.PI) % 360) + 360) % 360;
  const viewHeading = ((((driverViewAngle(v, input.current) * 180) / Math.PI) % 360) + 360) % 360;
  const compassCenter = Math.round(viewHeading / 45) * 45;
  const interval = toolIntervalTicks(
    v,
    v.boostUntil > sim.tick ||
      v.activeUntil > sim.tick ||
      v.upgrades.speed === 5 ||
      (v.upgrades.speed >= 4 && v.overdriveUntil > sim.tick),
    sim.rhythm.active(sim.tick),
  );
  const color = VEHICLES[v.kind].color;
  return (
    <div
      className={`driver-hud ${hit ? 'driver-hit' : ''} ${focused ? 'driver-focused' : ''} ${paused ? 'driver-paused' : ''}`}
      style={{ '--vehicle-color': color } as React.CSSProperties}
    >
      <div className="cockpit-roof" aria-hidden="true">
        <i />
        <b />
        <i />
      </div>
      <div className="cockpit-pillar left" aria-hidden="true" />
      <div className="cockpit-pillar right" aria-hidden="true" />
      <div className="driver-heading">
        <span className="driver-live-dot" />
        <strong>DRIVER’S SEAT</strong>
        <span>
          {VEHICLES[v.kind].short} #{v.id}
        </span>
        <button onClick={onPause} aria-label="Pause driving" title="Pause · P / Esc">
          <Pause size={15} />
        </button>
        <button className="driver-exit" onClick={onExit}>
          <LogOut size={15} /> Return to fleet <kbd>F</kbd>
        </button>
      </div>
      <div className="driver-compass" aria-label={`Looking ${Math.round(viewHeading)} degrees`}>
        <div className="driver-compass-tape">
          {[-2, -1, 0, 1, 2].map((offset) => {
            const bearing = compassCenter + offset * 45;
            return (
              <span key={offset} style={{ left: `calc(50% + ${(bearing - viewHeading) * 1.5}px)` }}>
                {
                  ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][
                    ((Math.round(bearing / 45) % 8) + 8) % 8
                  ]
                }
                <i />
              </span>
            );
          })}
        </div>
        <strong>{Math.round(viewHeading).toString().padStart(3, '0')}°</strong>
        <b>▼</b>
      </div>
      {!paused && !locked && (
        <button className="driver-mouse-prompt" onClick={onMouse}>
          <Crosshair size={18} />
          <span>
            <strong>
              {lockUnavailable
                ? 'Mouse look: hold right mouse and drag'
                : 'Click to engage mouse look'}
            </strong>
            <small>WASD still drives · F returns to your fleet</small>
          </span>
        </button>
      )}
      <div className={`driver-reticle ${ready ? 'on-target' : ''}`} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <b />
        {hit && <span className="driver-hitmarker">×</span>}
      </div>
      <div className={`driver-target ${ready ? 'ready' : ''}`}>
        {target && (
          <strong>
            {BALLOONS[target.kind].name} <span>{distance.toFixed(1)} m</span>
          </strong>
        )}
        <span>{targetHint}</span>
        {hit && (
          <b className="driver-pop-feedback" key={feedback.current.at}>
            +{feedback.current.amount} POP{feedback.current.amount > 1 ? 'S' : ''}!
          </b>
        )}
      </div>
      {v.state === 'stuck' && (
        <div className="driver-obstacle" role="status">
          OBSTACLE AHEAD <span>Reverse with S and steer clear</span>
        </div>
      )}
      {sim.tick - entered.current < 180 && locked && !paused && (
        <div className="driver-welcome">
          <Tractor size={20} />
          <strong>You’re at the wheel.</strong>
          <span>Your other vehicles keep fighting.</span>
        </div>
      )}
      <div className="cockpit-dashboard">
        <div className="driver-instruments">
          <span className="driver-label">
            {isCrawler(v.kind) ? 'TWIN TRACK DRIVE' : 'GROUND SPEED'}
          </span>
          <div className="driver-speed">
            <strong>
              {Math.round(Math.abs(v.speed) * 3.6)
                .toString()
                .padStart(2, '0')}
            </strong>
            <span>KM/H</span>
            <b className={gear === 'R' ? 'reverse' : ''}>{gear}</b>
          </div>
          <div className="driver-speed-bar" aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => (
              <i
                key={i}
                className={Math.abs(v.speed) / (stats.speed * 2.5) > i / 16 ? 'lit' : ''}
              />
            ))}
          </div>
          <span className="driver-traction">
            {input.current.brake
              ? 'BRAKING'
              : focused
                ? 'PRECISION AIM'
                : isCrawler(v.kind) && Math.abs(v.speed) < 0.1 && input.current.steer
                  ? 'PIVOT TURN'
                  : 'ENGINE RUNNING'}{' '}
            <b>{Math.round(heading)}°</b>
          </span>
        </div>
        <div className="driver-tool-panel">
          <div className="driver-label">
            <span>{VEHICLES[v.kind].tool}</span>
            {switchable && (
              <button
                className="driver-side-control"
                onClick={onSide}
                disabled={paused}
                aria-label={`Switch to ${side === 'rear' ? 'front' : 'rear'} tool`}
                aria-pressed={side === 'rear'}
                title="Switch front/rear view · C. Both headers keep cutting automatically."
              >
                <ArrowLeftRight size={13} /> {side.toUpperCase()} <kbd>C</kbd>
              </button>
            )}
          </div>
          <div className="driver-tool-status">
            <Crosshair size={18} />
            <strong>
              {contactTool
                ? v.kind === 'harvester'
                  ? 'HEADER ALWAYS ON'
                  : 'BLADE CONTACT ACTIVE'
                : input.current.fire
                  ? 'TOOL ENGAGED'
                  : 'TOOL READY'}
            </strong>
            <span>
              {stats.range.toFixed(1)} m reach · {stats.min}–{stats.max} m height
            </span>
          </div>
          <div className="driver-tool-charge" aria-label="Tool recovery">
            <i
              style={{
                width: `${Math.max(0, Math.min(1, 1 - (v.attackTick - sim.tick) / interval)) * 100}%`,
              }}
            />
          </div>
          {switchable && (
            <div className="driver-side-hint" role="status">
              {side === 'rear'
                ? 'REAR HEADER · W drives in reverse'
                : 'FRONT HEADER · W drives forward'}
            </div>
          )}
          <div className="driver-actions">
            <button
              disabled={paused || v.upgrades.unique < 3 || cooldown > 0}
              onClick={onAbility}
              title={v.upgrades.unique < 3 ? 'Unlock with Specialist tier 3' : ability.name}
            >
              <kbd>E</kbd>
              <Zap size={14} />
              <span>
                {v.upgrades.unique < 3
                  ? 'Specialist locked'
                  : cooldown
                    ? `${ability.name} · ${cooldown}s`
                    : ability.name}
              </span>
            </button>
            <button
              disabled={paused || !boostBought || !boostReady}
              onClick={onBoost}
              title={
                boostBought
                  ? 'Use a purchased speed boost on this vehicle'
                  : 'Purchase Speed Boost in the garage'
              }
            >
              <kbd>Q</kbd>
              <Zap size={14} />
              <span>
                {!boostBought
                  ? 'Boost locked'
                  : boostReady
                    ? 'Speed boost'
                    : `Boost · ${boostSeconds}s`}
              </span>
            </button>
          </div>
          <div className="driver-personal-score">
            <strong>{v.pops}</strong> YOUR POPS <i />{' '}
            <span>{sim.balloons.length} balloons left</span>
          </div>
        </div>
        <div className="driver-radar">
          <div className="driver-label">
            ARENA RADAR{' '}
            <span>
              <i /> balloons <b /> fleet
            </span>
          </div>
          <svg
            viewBox={`0 0 ${sim.arena.width} ${sim.arena.depth}`}
            role="img"
            aria-label="Arena radar showing balloons, obstacles, fleet and your position"
          >
            <rect
              x="0.5"
              y="0.5"
              width={sim.arena.width - 1}
              height={sim.arena.depth - 1}
              rx="2"
              fill="#152e29"
              stroke="#66947b"
              strokeWidth="0.5"
            />
            {sim.arena.obstacles.map((o, i) => (
              <rect
                key={i}
                x={o.x - o.w / 2}
                y={sim.arena.depth - o.z - o.d / 2}
                width={o.w}
                height={o.d}
                fill="#51634a"
                opacity="0.7"
              />
            ))}
            <circle
              cx={v.x}
              cy={sim.arena.depth - v.z}
              r={stats.range}
              fill="none"
              stroke="#ffe6a8"
              strokeWidth="0.35"
              opacity="0.3"
            />
            {sim.balloons.map((b) => (
              <circle
                key={b.id}
                cx={b.x}
                cy={sim.arena.depth - b.z}
                r={b.id === target?.id ? 0.85 : 0.55}
                fill={BALLOONS[b.kind].color}
                stroke={b.armor ? '#fff6d1' : 'none'}
                strokeWidth="0.3"
              />
            ))}
            {sim.vehicles
              .filter((other) => other.id !== v.id)
              .map((other) => (
                <rect
                  key={other.id}
                  x={other.x - 0.7}
                  y={sim.arena.depth - other.z - 0.7}
                  width="1.4"
                  height="1.4"
                  rx="0.3"
                  fill="#8ae5db"
                />
              ))}
            <g
              className="driver-view-bearing"
              transform={`translate(${v.x}, ${sim.arena.depth - v.z}) rotate(${viewHeading})`}
              aria-hidden="true"
            >
              <path d="M0 0 L-2.5 -6 L2.5 -6 Z" fill="#8ae5db" opacity="0.35" />
            </g>
            <g transform={`translate(${v.x}, ${sim.arena.depth - v.z}) rotate(${heading})`}>
              <path
                d="M0 -2.2 L1.4 1.3 L0 0.7 L-1.4 1.3 Z"
                fill="#ffdf89"
                stroke="#162922"
                strokeWidth="0.3"
              />
            </g>
          </svg>
          <button onClick={onNext} disabled={sim.vehicles.length < 2 || paused}>
            <RotateCcw size={12} /> Next vehicle <kbd>TAB</kbd>
          </button>
        </div>
      </div>
      <div className="driver-key-guide">
        <span>
          <kbd>W A S D</kbd> Drive
        </span>
        <span>
          <kbd>MOUSE</kbd> Look
        </span>
        {switchable && (
          <span>
            <kbd>C</kbd> Front / rear
          </span>
        )}
        <span>
          {contactTool ? (
            <>
              <kbd>AUTO</kbd> {v.kind === 'harvester' ? 'Header' : 'Blade'} cuts on contact
            </>
          ) : (
            <>
              <kbd>LMB</kbd> Use tool
            </>
          )}
        </span>
        <span>
          <kbd>SPACE</kbd> Brake
        </span>
        <span>
          <kbd>SHIFT</kbd> Focus
        </span>
        <span>
          <kbd>R</kbd> Center view
        </span>
        <span>
          <kbd>P / ESC</kbd> Pause
        </span>
      </div>
    </div>
  );
}
