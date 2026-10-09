import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, Object3D } from 'three';
import type { Simulation } from '../sim/engine';

export function BaleProjectiles({
  sim,
  interpolation,
}: {
  sim: Simulation;
  interpolation: { current: number };
}) {
  const bales = useRef<InstancedMesh>(null),
    bands = useRef<InstancedMesh>(null);
  const obj = useMemo(() => new Object3D(), []),
    color = useMemo(() => new Color(), []);
  useFrame(() => {
    if (!bales.current || !bands.current) return;
    let count = 0;
    const alpha = interpolation.current;
    for (const shot of sim.shots.slice(0, 256)) {
      const scale = shot.radius / 0.35;
      obj.position.set(
        shot.px + (shot.x - shot.px) * alpha,
        shot.py + (shot.y - shot.py) * alpha,
        shot.pz + (shot.z - shot.pz) * alpha,
      );
      obj.rotation.set(0, Math.atan2(shot.dx, shot.dz), 0);
      obj.scale.set(0.6 * scale, 0.45 * scale, 0.8 * scale);
      obj.updateMatrix();
      bales.current.setMatrixAt(count, obj.matrix);
      color.set(shot.burst ? '#f5d377' : '#dcb35e');
      bales.current.setColorAt(count, color);
      obj.scale.set(0.63 * scale, 0.47 * scale, 0.08 * scale);
      obj.updateMatrix();
      bands.current.setMatrixAt(count++, obj.matrix);
    }
    for (const mesh of [bales.current, bands.current]) {
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });
  return (
    <>
      <instancedMesh
        ref={bales}
        args={[undefined, undefined, 256]}
        frustumCulled={false}
        castShadow
      >
        <boxGeometry />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={bands} args={[undefined, undefined, 256]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial color="#78582f" roughness={0.8} />
      </instancedMesh>
    </>
  );
}
