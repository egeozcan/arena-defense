import { useMemo } from 'react';
import { RoundedBoxGeometry } from 'three-stdlib';
import { surfaceTexture } from './textures';
export type Vec = [number, number, number];
export interface ShapeProps {
  position?: Vec;
  size?: Vec;
  color?: string;
  rotation?: Vec;
  surface?: Parameters<typeof surfaceTexture>[0];
}
export function Box({
  position = [0, 0, 0],
  size = [1, 1, 1],
  color = '#ccc',
  rotation = [0, 0, 0],
  surface,
}: ShapeProps) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.85}
        map={surface ? surfaceTexture(surface) : null}
      />
    </mesh>
  );
}
export function Paint({
  position = [0, 0, 0],
  size = [1, 1, 1],
  color = '#ccc',
  rotation = [0, 0, 0],
}: ShapeProps) {
  const geometry = useMemo(
    () => new RoundedBoxGeometry(...size, 1, Math.min(0.09, Math.min(...size) * 0.22)),
    [size[0], size[1], size[2]],
  );
  return (
    <mesh geometry={geometry} position={position} rotation={rotation} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={color}
        roughness={0.32}
        metalness={0.12}
        clearcoat={0.7}
        clearcoatRoughness={0.25}
      />
    </mesh>
  );
}
