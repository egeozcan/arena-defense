import type { VehicleKind } from '../sim/data';

export function VehicleThumb({ kind }: { kind: VehicleKind }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}vehicles/${kind}.png`}
      width="768"
      height="640"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="vehicle-thumb"
    />
  );
}
