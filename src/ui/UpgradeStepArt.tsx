import type { PathName, VehicleKind } from '../sim/data';

export function upgradeSvgUrl(kind: VehicleKind, path: PathName, tier: number): string {
  return `${import.meta.env.BASE_URL}upgrades/${kind}-${path}-${tier}.svg`;
}

export function UpgradeStepArt({
  kind,
  path,
  tier,
  className = '',
  mini = false,
  size,
}: {
  kind: VehicleKind;
  path: PathName;
  tier: number;
  className?: string;
  mini?: boolean;
  size?: number;
}) {
  const src = upgradeSvgUrl(kind, path, tier);
  return (
    <img
      src={src}
      alt={`${kind} ${path} tier ${tier}`}
      className={`upgrade-step-art ${mini ? 'mini' : ''} ${className}`}
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
    />
  );
}
