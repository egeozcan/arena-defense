import { memo, useLayoutEffect, useRef } from 'react';
import type { InstancedMesh, Matrix4 } from 'three';
import type { Vec } from './vehicle-parts';

// Static repeated detail shares its geometry and material within each assembly.
export const InstancedBoxes = memo(function InstancedBoxes({
  matrices,
  size,
  color,
}: {
  matrices: Matrix4[];
  size: Vec;
  color: string;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < matrices.length; i++) mesh.setMatrixAt(i, matrices[i]);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, matrices.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </instancedMesh>
  );
});
