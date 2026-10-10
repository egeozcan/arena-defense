import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  MoveUpRight,
  Shield,
  Wrench,
} from 'lucide-react';
import {
  BALLOONS,
  MODES,
  VEHICLES,
  arenaFor,
  price,
  type Run,
  type VehicleKind,
} from '../sim/data';
import { armorLabel, vehicleStats } from '../sim/capabilities';
import {
  coverageFor,
  forecast,
  futureChanges,
  heightLabel,
  recommendation,
  responderLabel,
  stockVehicle,
  threatName,
} from './wave-forecast';
import { VehicleThumb } from './VehicleThumb';

export function WaveBriefing({
  run,
  compact = false,
  onBuy,
  onUpgrade,
  onDeploy,
}: {
  run: Run;
  compact?: boolean;
  onBuy: (kind: VehicleKind) => void;
  onUpgrade: (id: number) => void;
  onDeploy: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const info = useMemo(() => forecast(run), [run]);
  const changes = useMemo(() => futureChanges(run), [run]);
  const next = useMemo(() => forecast({ ...run, round: run.round + 1 }), [run]);
  const hayCount = arenaFor(run.arena, run.round, run.seed).obstacles.filter((o) => o.loose).length;
  const hasNextRound = run.freeplay || run.round < MODES[run.mode].rounds;
  const unplaced = run.fleet.filter((v) => !v.placed);
  const purchaseKinds = [
    ...new Set(
      info.gaps
        .filter((t) => coverageFor(run.fleet, t.min, t.max, t.armored) !== 'covered')
        .map(recommendation),
    ),
  ];
  return (
    <section
      className={`wave-briefing ${compact ? 'compact' : ''}`}
      aria-label={`Round ${run.round} briefing`}
    >
      <button
        className="briefing-heading"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className={`briefing-emblem ${info.gaps.length ? 'warning' : ''}`}>
          {info.gaps.length ? <AlertTriangle size={19} /> : <Check size={19} />}
        </span>
        <span>
          <small>
            ROUND {run.round} · {info.total} INCOMING
          </small>
          <strong>
            {!run.fleet.length
              ? 'Build your first defense'
              : !run.fleet.some((v) => v.placed)
                ? 'Deploy your fleet'
                : info.gaps.length
                  ? 'Coverage needs attention'
                  : 'Every flight band covered'}
          </strong>
        </span>
        <ChevronDown size={16} className={expanded ? 'expanded' : ''} />
      </button>
      {expanded && (
        <div className="briefing-body">
          <div className="threat-list">
            {info.threats.map((t) => (
              <article key={t.key} className={`threat-row ${t.coverage}`}>
                <div className="threat-title">
                  <span
                    className={`threat-balloon ${t.armored ? 'armored' : ''}`}
                    style={{ '--balloon-color': BALLOONS[t.kind].color } as React.CSSProperties}
                  />
                  <strong>{threatName(t)}</strong>
                  <b>
                    {t.child ? '+' : '×'}
                    {t.count}
                  </b>
                </div>
                <div className="threat-altitude">
                  <MoveUpRight size={15} />
                  <span>{heightLabel(t.min, t.max)} high</span>
                  {t.coverage === 'covered' && (
                    <span className="threat-ready">
                      <Check size={14} /> Covered
                    </span>
                  )}
                </div>
                {(t.kind === 'layered' || t.armored || t.kind === 'carrier' || t.child) && (
                  <p className="threat-trait">
                    {t.armored && (
                      <>
                        <Shield size={13} /> Armor
                      </>
                    )}
                    {t.kind === 'layered' && <span>{info.layers} layers · splits on pop</span>}
                    {t.kind === 'carrier' && <span>Drops 3 low balloons + hay</span>}
                    {t.child && <span>Released when carriers pop</span>}
                  </p>
                )}
                {t.coverage !== 'covered' && (
                  <p className="threat-coverage">
                    <AlertTriangle size={14} />
                    {coverageFor(run.fleet, t.min, t.max, t.armored) === 'covered'
                      ? 'Deploy your counter to cover these'
                      : t.coverage === 'partial'
                        ? 'Some heights are out of reach'
                        : t.armored &&
                            coverageFor(
                              run.fleet.filter((v) => v.placed),
                              t.min,
                              t.max,
                              false,
                            ) !== 'uncovered'
                          ? 'Needs armor damage'
                          : 'No vehicle in range'}
                  </p>
                )}
              </article>
            ))}
          </div>
          {(hayCount > 0 ||
            info.oil > 0 ||
            info.rough > 0 ||
            info.fleeing > 0 ||
            info.regen > 0) && (
            <div className="wave-traits">
              {hayCount > 0 && <span>{hayCount} loose hay bales</span>}
              {info.oil > 0 && <span>{info.oil} oil slicks · low grip</span>}
              {info.rough > 0 && <span>{info.rough} rough patches · slow travel</span>}
              {info.fleeing > 0 && <span>{info.fleeing} fleeing</span>}
              {info.regen > 0 && <span>{info.regen} regrowing</span>}
            </div>
          )}
          {changes.length > 0 && hasNextRound && (
            <div className="coming-next" role="status">
              <span className="briefing-label">PREPARE FOR ROUND {run.round + 1}</span>
              {changes.map((change) => (
                <p key={change}>
                  <AlertTriangle size={14} />
                  {change}
                </p>
              ))}
            </div>
          )}
          {unplaced.length > 0 && (
            <p className="briefing-deploy">
              <AlertTriangle size={14} />
              {unplaced.length} vehicle{unplaced.length === 1 ? '' : 's'} awaiting deployment.
            </p>
          )}
          {unplaced
            .filter((v) =>
              info.gaps.some((t) => coverageFor([v], t.min, t.max, t.armored) !== 'uncovered'),
            )
            .map((v) => (
              <button className="deploy-recommendation" key={v.id} onClick={() => onDeploy(v.id)}>
                Deploy {responderLabel(v)} <ArrowRight size={13} />
              </button>
            ))}
          {purchaseKinds.length > 0 && (
            <div className="briefing-fixes">
              <span className="briefing-label">CLOSE THE GAPS</span>
              {purchaseKinds.map((kind) => {
                const cost = price(run, VEHICLES[kind].cost);
                const needsArmorUpgrade =
                  kind === 'crane' && info.gaps.some((t) => t.min >= 6 && t.armored);
                const owned = run.fleet.find(
                  (v) => v.kind === kind && (!v.placed || needsArmorUpgrade),
                );
                return (
                  <div className="coverage-fix" key={kind}>
                    <VehicleThumb kind={kind} />
                    <div>
                      <strong>{VEHICLES[kind].short}</strong>
                      <span>
                        {heightLabel(VEHICLES[kind].min, VEHICLES[kind].max)} ·{' '}
                        {kind === 'excavator'
                          ? 'full armor damage'
                          : kind === 'sprayer'
                            ? 'crowd coverage'
                            : kind === 'harvester'
                              ? 'low balloon coverage'
                              : 'high-flyer coverage'}
                      </span>
                    </div>
                    {owned ? (
                      <button
                        onClick={() =>
                          needsArmorUpgrade ? onUpgrade(owned.id) : onDeploy(owned.id)
                        }
                      >
                        {needsArmorUpgrade ? 'Upgrade' : 'Deploy'} #{owned.id}
                      </button>
                    ) : (
                      <button
                        disabled={run.cash < cost}
                        onClick={() => onBuy(kind)}
                        aria-label={`Buy recommended ${VEHICLES[kind].short} for $${cost}`}
                      >
                        ${cost}
                        <small>{run.cash < cost ? `$${cost - run.cash} short` : 'Buy'}</small>
                      </button>
                    )}
                  </div>
                );
              })}
              {info.gaps.some((t) => t.min >= 6 && t.armored) && (
                <p className="threat-detail">
                  Armored high-flyers need a crane or blower with Attack tier 3. Stock cranes and
                  blowers cannot damage them. Keep the Attack path available.
                </p>
              )}
              {info.gaps.some((t) => t.armored) &&
                run.fleet.some(
                  (v) =>
                    (v.kind === 'harvester' || v.kind === 'crane' || v.kind === 'blower') &&
                    v.upgrades.attack < 3,
                ) && (
                  <p className="threat-detail">
                    Alternative: Attack tier 3 lets harvesters, cranes, and blowers damage armor
                    within their height range. Two-path limits apply.
                  </p>
                )}
            </div>
          )}
          <details className="briefing-details">
            <summary>
              Fleet & wave details <ChevronDown size={15} />
            </summary>
            {run.fleet.length > 0 && (
              <div className="briefing-fleet">
                <span className="briefing-label">YOUR VEHICLES</span>
                {run.fleet.map((v) => {
                  const stats = vehicleStats(v);
                  return (
                    <button
                      key={v.id}
                      onClick={() => onUpgrade(v.id)}
                      className={!v.placed ? 'undeployed' : ''}
                    >
                      <VehicleThumb kind={v.kind} />
                      <span>
                        <strong>{responderLabel(v)}</strong>
                        <span>{heightLabel(stats.min, stats.max)} high</span>
                        <small>
                          {stats.range} m reach · {armorLabel(v)}
                          {!v.placed ? ' · Undeployed' : ''}
                        </small>
                      </span>
                      <Wrench size={13} />
                    </button>
                  );
                })}
              </div>
            )}
            <div className="wave-behaviors">
              {info.oil > 0 && (
                <p>
                  <b>Oil:</b> weakens acceleration, braking and turning. Extra drive speed does not
                  restore grip. Use dry lanes or better Traction; tier 3's mud/rough bonus does not
                  apply to oil. Tier 5 restores full grip.
                </p>
              )}
              {info.rough > 0 && (
                <p>
                  <b>Rough ground:</b> loose stones slow travel and handling. Tracked vehicles cope
                  better; Traction tier 3 adds rough grip, and tier 5 removes the slowdown. Balloons
                  fly over both surfaces.
                </p>
              )}
              {hayCount > 0 && (
                <p>
                  <b>Loose hay:</b> {hayCount} bales in the lanes. Harvesters and excavators clear
                  them; dozers, balers and mixers push when there is room. Other chassis detour
                  until Traction tier 3. Blade tier 3 lets dozers crush them.
                </p>
              )}
              {info.layers > 0 && (
                <p>
                  <b>Layered:</b> each outer layer splits into two smaller balloons.
                </p>
              )}
              {info.fleeing > 0 && (
                <p>
                  <b>Fleeing:</b> dodge approaching vehicles.
                </p>
              )}
              {info.regen > 0 && (
                <p>
                  <b>Regrowing:</b> recover HP and layers after 5 s without a hit.
                </p>
              )}
              <p>
                <b>Coverage:</b> your deployed fleet can reach these heights and damage the balloon
                type. Speed and damage still matter.
              </p>
            </div>
            <div className="briefing-responders">
              <span className="briefing-label">WHO CAN HIT WHAT</span>
              {info.threats.map((t) => (
                <p key={t.key}>
                  <strong>{threatName(t)}</strong>
                  <span>
                    {t.responders.length
                      ? t.responders
                          .map(
                            (v) =>
                              `${responderLabel(v)}${coverageFor([v], t.min, t.max, t.armored) === 'partial' ? ' (some heights)' : ''}`,
                          )
                          .join(', ')
                      : 'No deployed counter'}
                  </span>
                </p>
              ))}
            </div>
            {hasNextRound && (
              <div className="briefing-preview">
                <span className="briefing-label">NEXT ROUND · {next.total} INCOMING</span>
                {next.threats
                  .filter((t) => !t.child)
                  .map((t) => (
                    <p key={t.key}>
                      <span>{threatName(t)}</span>
                      <strong>{heightLabel(t.min, t.max)}</strong>
                    </p>
                  ))}
                {next.fleeing > 0 && !info.fleeing && <p>New: fleeing balloons dodge vehicles.</p>}
                {next.regen > 0 && !info.regen && <p>New: regrowing balloons heal between hits.</p>}
              </div>
            )}
            <p className="forecast-footnote">
              Heights are initial flight bands; collisions and abilities can shift them. Unpopped
              balloons cost lives after 3 minutes.
            </p>
          </details>
        </div>
      )}
    </section>
  );
}

export function VehicleMatchup({
  run,
  kind,
  vehicle,
}: {
  run: Run;
  kind: VehicleKind;
  vehicle?: Run['fleet'][number];
}) {
  const v = vehicle ?? stockVehicle(kind);
  const info = forecast(run, [v]);
  return (
    <div className="vehicle-matchup" aria-label={`${VEHICLES[kind].short} matchups`}>
      <span>
        {vehicle ? 'THIS VEHICLE VS. ROUND' : 'STOCK CHASSIS VS. ROUND'} {run.round}
      </span>
      <div>
        {info.threats.map((t) => (
          <span
            key={t.key}
            className={t.coverage}
            title={
              t.coverage === 'covered'
                ? 'Can target the full height band'
                : t.coverage === 'partial'
                  ? 'Can target only part of this height band'
                  : 'Cannot target: height or armor limit'
            }
          >
            {t.coverage === 'covered' ? (
              <Check size={11} />
            ) : t.coverage === 'partial' ? (
              <MoveUpRight size={11} />
            ) : (
              <AlertTriangle size={11} />
            )}
            {threatName(t)}
            {t.coverage === 'partial'
              ? ' · partial'
              : t.coverage === 'uncovered'
                ? ' · cannot hit'
                : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
