import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { Random, type SurfacePatch } from '../sim/data';

export function SurfacePatches({ patches }: { patches: SurfacePatch[] }) {
  const stones = useMemo(
    () =>
      patches.map((p, index) => {
        const rng = new Random(841 + index * 73);
        return Array.from({ length: 40 }, () => ({
          x: (rng.next() - 0.5) * (p.w - 0.4),
          z: (rng.next() - 0.5) * (p.d - 0.4),
          size: 0.08 + rng.next() * 0.12,
          angle: rng.next() * Math.PI,
        }));
      }),
    [patches],
  );
  return (
    <group>
      {patches.map((p, index) => (
        <group key={index} position={[p.x, 0, p.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]} receiveShadow>
            <planeGeometry args={[p.w, p.d]} />
            <meshStandardMaterial
              color={p.kind === 'oil' ? '#26323f' : '#826746'}
              roughness={p.kind === 'oil' ? 0.16 : 1}
              metalness={p.kind === 'oil' ? 0.4 : 0}
            />
          </mesh>
          {p.kind === 'oil'
            ? [0.62, 0.9, 1.15].map((radius, i) => (
                <mesh
                  key={radius}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[-p.w * 0.2, 0.052 + i * 0.002, 0]}
                >
                  <ringGeometry args={[radius, radius + 0.08, 40]} />
                  <meshBasicMaterial color={['#607981', '#736687', '#a19a6b'][i]} />
                </mesh>
              ))
            : stones[index].map((s, i) => (
                <mesh key={i} position={[s.x, 0.075, s.z]} rotation={[0, s.angle, 0]}>
                  <dodecahedronGeometry args={[s.size, 0]} />
                  <meshStandardMaterial color={i % 2 ? '#b49a71' : '#655e50'} roughness={1} />
                </mesh>
              ))}
          <Text
            position={[0, 0.3, p.d / 2 - 0.65]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.55}
            color={p.kind === 'oil' ? '#a8d0dd' : '#ffe2a3'}
          >
            {p.kind === 'oil' ? 'OIL' : 'ROUGH'}
          </Text>
        </group>
      ))}
    </group>
  );
}
