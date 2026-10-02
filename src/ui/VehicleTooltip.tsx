import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ShieldAlert } from 'lucide-react';
import { VEHICLES, type VehicleKind } from '../sim/data';
import { VehicleThumb } from './VehicleThumb';
import { VEHICLE_GUIDES } from './vehicle-guide';

type Hint = {
  kind: VehicleKind;
  rect: { left: number; right: number; top: number; bottom: number };
};

export function useVehicleTooltip() {
  const [hint, setHint] = useState<Hint | null>(null);
  const hide = useCallback(() => setHint(null), []);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      window.removeEventListener('keydown', escape);
    };
  }, [hide]);
  const showAt = (kind: VehicleKind, rect: Hint['rect']) => setHint({ kind, rect });
  function props(kind: VehicleKind) {
    const guide = VEHICLE_GUIDES[kind];
    const show = (e: PointerEvent<HTMLElement> | FocusEvent<HTMLElement>) =>
      showAt(kind, e.currentTarget.getBoundingClientRect());
    return {
      onPointerEnter: show,
      onPointerLeave: hide,
      onFocus: show,
      onBlur: hide,
      onClickCapture: hide,
      'aria-description': `${VEHICLES[kind].role}. Strengths: ${guide.strength} Weaknesses: ${guide.weakness}`,
    };
  }
  return { hint, props, hide, showAt };
}

export function VehicleTooltip({ hint }: { hint: Hint | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    if (!hint || !ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    const left = Math.max(
      10,
      Math.min(
        hint.rect.left + (hint.rect.right - hint.rect.left - width) / 2,
        window.innerWidth - width - 10,
      ),
    );
    const above = hint.rect.top - height - 12;
    const top =
      above >= 10
        ? above
        : Math.max(10, Math.min(hint.rect.bottom + 12, window.innerHeight - height - 10));
    setPosition({ left, top });
  }, [hint]);
  if (!hint) return null;
  const v = VEHICLES[hint.kind],
    guide = VEHICLE_GUIDES[hint.kind];
  return createPortal(
    <div ref={ref} className="vehicle-tooltip" role="tooltip" style={position}>
      <div className="vehicle-tooltip-heading">
        <VehicleThumb kind={hint.kind} />
        <div>
          <strong>{v.name}</strong>
          <span>{v.role}</span>
        </div>
      </div>
      <div className="vehicle-tooltip-range">
        <span>STOCK CHASSIS</span>
        <b>
          {v.min}–{v.max} m high
        </b>
        <b>{v.range} m range</b>
      </div>
      <p className="vehicle-strength">
        <Check size={15} />
        <span>
          <b>Strengths</b>
          {guide.strength}
        </span>
      </p>
      <p className="vehicle-weakness">
        <ShieldAlert size={15} />
        <span>
          <b>Weaknesses</b>
          {guide.weakness}
        </span>
      </p>
      <div className="vehicle-partner">{guide.partner}</div>
    </div>,
    document.body,
  );
}
