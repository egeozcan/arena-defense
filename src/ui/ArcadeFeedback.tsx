import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import type { Simulation } from '../sim/engine';
import { POP_RUSH } from '../sim/pop-rush';

export function ArcadeFeedback({ sim, paused }: { sim: Simulation; paused: boolean }) {
  const [tick, setTick] = useState(sim.tick);
  const [burst, setBurst] = useState({ serial: 0, amount: 0, cash: 0 });
  useEffect(() => {
    let raf = 0,
      seen = sim.pops,
      lastCash = sim.popCash,
      lastUI = -1,
      lastCallout = -100;
    function update() {
      if (sim.tick - lastUI >= 3) {
        setTick(sim.tick);
        lastUI = sim.tick;
      }
      if (sim.pops > seen) {
        const amount = sim.pops - seen;
        if ((amount >= 3 || sim.rhythm.streak === 1) && sim.tick - lastCallout >= 24) {
          setBurst({ serial: sim.pops, amount, cash: sim.popCash - lastCash });
          lastCallout = sim.tick;
        }
        seen = sim.pops;
        lastCash = sim.popCash;
      }
      raf = requestAnimationFrame(update);
    }
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [sim]);
  const rhythm = sim.rhythm;
  const rushing = rhythm.active(tick);
  const fill = rushing
    ? Math.max(0, (rhythm.rushUntil - tick) / POP_RUSH.durationTicks)
    : rhythm.charge / POP_RUSH.charge;
  const fuse = Math.max(0, 1 - (tick - rhythm.lastPop) / POP_RUSH.chainTicks);
  return (
    <div
      className={`arcade-feedback ${rushing ? 'is-rushing' : ''} ${paused ? 'feedback-paused' : ''}`}
    >
      <div className="rush-meter" aria-label={rushing ? 'Pop Rush active' : 'Pop Rush charge'}>
        <div className="rush-heading">
          <Zap size={16} fill="currentColor" />
          <strong>POP RUSH</strong>
          <span>
            {rushing
              ? `${((rhythm.rushUntil - tick) / 60).toFixed(1)}s`
              : `${rhythm.charge}/${POP_RUSH.charge}`}
          </span>
        </div>
        <div
          className="rush-track"
          role="progressbar"
          aria-label={rushing ? 'Overdrive remaining' : 'Pops to overdrive'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fill * 100)}
        >
          <i style={{ transform: `scaleX(${fill})` }} />
        </div>
        <span className="rush-hint">
          {rushing ? 'FLEET OVERDRIVE · GO GO GO!' : 'CHAIN 10 POPS TO OVERDRIVE'}
        </span>
        {rhythm.streak >= 3 && (
          <div className="rush-chain">
            <strong>
              {rhythm.streak}
              <small>×</small>
            </strong>
            <span>CHAIN</span>
            <i style={{ transform: `scaleX(${fuse})` }} />
          </div>
        )}
      </div>
      {rhythm.rushes > 0 && (
        <div className="rush-ignition" key={`rush-${rhythm.rushes}`} aria-hidden="true">
          <div className="rush-flare" />
          <div className="rush-callout">
            <span>FULL FLEET. FULL THROTTLE.</span>
            <strong>POP RUSH!</strong>
            <small>5 SECONDS OF OVERDRIVE</small>
          </div>
        </div>
      )}
      {burst.serial > 0 && !rushing && (
        <div className="pop-callout" key={`pop-${burst.serial}`} aria-hidden="true">
          <strong>
            {burst.amount >= 6 ? 'POP OFF!' : burst.amount >= 3 ? 'MULTIPOP!' : 'POP!'}
          </strong>
          <span>+${burst.cash}</span>
        </div>
      )}
    </div>
  );
}
