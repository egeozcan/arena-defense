import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, InstancedMesh, Object3D } from 'three';
import { Random, arenaFor, type ArenaKind } from '../sim/data';
import { Box } from './models';

function Barrel({ x, z, color = '#4d8c9c' }: { x: number; z: number; color?: string }) {
  return (
    <group position={[x, -0.85, z]}>
      <mesh position={[0, 0.57, 0]} castShadow>
        <cylinderGeometry args={[0.43, 0.43, 1.14, 16]} />
        <meshStandardMaterial color={color} metalness={0.22} roughness={0.6} />
      </mesh>
      {[0.18, 0.95].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.435, 0.035, 6, 16]} />
          <meshStandardMaterial color="#334953" metalness={0.4} />
        </mesh>
      ))}
      <Box position={[0, 1.15, 0]} size={[0.17, 0.03, 0.17]} color="#294654" />
    </group>
  );
}
function Cone({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, -0.83, z]}>
      <Box position={[0, 0.055, 0]} size={[0.7, 0.11, 0.7]} color="#2d4146" />
      <mesh position={[0, 0.51, 0]} castShadow>
        <coneGeometry args={[0.28, 0.9, 16]} />
        <meshStandardMaterial color="#ff8b2d" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.13, 0.18, 0.17, 16]} />
        <meshStandardMaterial color="#fff6d6" />
      </mesh>
    </group>
  );
}
export function Scenery({ kind }: { kind: ArenaKind }) {
  const a = useMemo(() => arenaFor(kind), [kind]);
  const grass = useRef<InstancedMesh>(null),
    stones = useRef<InstancedMesh>(null),
    straw = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const rng = new Random(503),
      obj = new Object3D(),
      color = new Color();
    for (let i = 0; i < 360; i++) {
      let x = 0,
        z = 0;
      do {
        x = rng.next() * (a.width + 20) - 10;
        z = rng.next() * (a.depth + 20) - 10;
      } while (x > -1.5 && x < a.width + 1.5 && z > -1.5 && z < a.depth + 1.5);
      obj.position.set(x, -0.79, z);
      obj.rotation.set((rng.next() - 0.5) * 0.6, rng.next() * 6.28, (rng.next() - 0.5) * 0.6);
      obj.scale.set(0.65 + rng.next() * 0.5, 0.6 + rng.next() * 0.8, 1);
      obj.updateMatrix();
      grass.current!.setMatrixAt(i, obj.matrix);
      color.set(['#4c9150', '#68a649', '#95b859'][i % 3]);
      grass.current!.setColorAt(i, color);
    }
    for (let i = 0; i < 90; i++) {
      let x = 0,
        z = 0;
      do {
        x = rng.next() * (a.width + 12) - 6;
        z = rng.next() * (a.depth + 12) - 6;
      } while (x > 0 && x < a.width && z > 0 && z < a.depth);
      obj.position.set(x, -0.84, z);
      obj.rotation.set(0, rng.next() * 6.28, 0);
      obj.scale.setScalar(0.08 + rng.next() * 0.15);
      obj.updateMatrix();
      stones.current!.setMatrixAt(i, obj.matrix);
    }
    for (let i = 0; i < 150; i++) {
      obj.position.set(
        1 + rng.next() * (a.width - 2),
        0.018,
        kind === 'barn' ? a.depth - 6 + rng.next() * 5 : 1 + rng.next() * (a.depth - 2),
      );
      obj.rotation.set(0, rng.next() * 6.28, 0);
      obj.scale.set(0.5 + rng.next(), 1, 1);
      obj.updateMatrix();
      straw.current!.setMatrixAt(i, obj.matrix);
      color.set(kind === 'barn' ? ['#edd393', '#bc945c'][i % 2] : ['#aaa99a', '#8b9089'][i % 2]);
      straw.current!.setColorAt(i, color);
    }
    for (const mesh of [grass.current, stones.current, straw.current]) {
      mesh!.instanceMatrix.needsUpdate = true;
      if (mesh!.instanceColor) mesh!.instanceColor.needsUpdate = true;
    }
  }, [a, kind]);
  return (
    <group>
      <instancedMesh ref={grass} args={[undefined, undefined, 360]}>
        <coneGeometry args={[0.055, 0.36, 3]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={stones} args={[undefined, undefined, 90]} receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#96a090" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={straw} args={[undefined, undefined, 150]}>
        <boxGeometry args={[0.28, 0.012, 0.035]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      {kind === 'barn' ? (
        <>
          {[6, a.width / 2, a.width - 6].map((x) => (
            <group key={x} position={[x, 1.5, -0.1]}>
              <Box size={[1.9, 1.1, 0.1]} color="#f5d4a7" />
              <Box position={[0, 0, 0.065]} size={[1.65, 0.86, 0.02]} color="#275c70" />
              <Box position={[0, 0, 0.085]} size={[0.09, 0.86, 0.02]} color="#efcb93" />
              <Box position={[0, 0, 0.085]} size={[1.65, 0.08, 0.02]} color="#efcb93" />
              <Box
                position={[0, -0.56, 0.12]}
                size={[2, 0.12, 0.35]}
                color="#825431"
                surface="wood"
              />
            </group>
          ))}
          {[4, a.width / 2, a.width - 4].map((x) => (
            <group key={x}>
              <Box
                position={[x + 1.2, 3.7, -0.08]}
                size={[3.1, 0.19, 0.24]}
                rotation={[0, 0, 0.65]}
                color="#855735"
                surface="wood"
              />
              <Box
                position={[x - 1.2, 3.7, -0.08]}
                size={[3.1, 0.19, 0.24]}
                rotation={[0, 0, -0.65]}
                color="#855735"
                surface="wood"
              />
            </group>
          ))}
          <Barrel x={a.width + 2} z={6} />
          <Barrel x={a.width + 3} z={6.5} color="#dc6841" />
          <Box
            position={[a.width + 2.4, -0.72, 9]}
            size={[2, 0.24, 1.5]}
            color="#9c7149"
            surface="wood"
          />
          {[-0.65, 0, 0.65].map((x) => (
            <Box
              key={x}
              position={[a.width + 2.4 + x, -0.53, 9]}
              size={[0.3, 0.1, 1.5]}
              color="#bf965d"
              surface="wood"
            />
          ))}
          <Box position={[-2, 0.3, 2.5]} size={[1.1, 1.1, 1]} color="#d09d57" surface="wood" />
          <Box
            position={[-2, 0.88, 2.5]}
            size={[1.15, 0.08, 1.05]}
            color="#ab733f"
            surface="wood"
          />
          {Array.from({ length: 10 }, (_, i) => (
            <group
              key={i}
              position={[a.width + 4 + Math.sin(i * 3) * 1.7, -0.85, a.depth / 2 + i * 0.8]}
            >
              <Box position={[0, 0.2, 0]} size={[0.035, 0.4, 0.035]} color="#4b853a" />
              <mesh position={[0, 0.4, 0]}>
                <icosahedronGeometry args={[0.1, 0]} />
                <meshStandardMaterial color={i % 2 ? '#ffcc3a' : '#fff8d7'} />
              </mesh>
            </group>
          ))}
        </>
      ) : (
        <>
          {[-1.4, a.width + 1.4].flatMap((x) =>
            [a.depth / 2 - 2, a.depth / 2 + 2].map((z) => <Cone key={`${x}-${z}`} x={x} z={z} />),
          )}
          <Barrel x={a.width + 2} z={4} color="#4788ac" />
          <Barrel x={a.width + 3.2} z={4.3} color="#e1a23e" />
          <group position={[a.width - 4, 0.5, -3]}>
            <Box size={[6, 2.7, 2.4]} color="#397e94" />
            {Array.from({ length: 12 }, (_, i) => (
              <Box
                key={i}
                position={[-2.75 + i * 0.5, 0, 1.23]}
                size={[0.06, 2.55, 0.06]}
                color="#225870"
              />
            ))}
            <Box position={[-1, 0, 1.28]} size={[0.05, 2.6, 0.05]} color="#afd0d0" />
          </group>
          {a.obstacles.map((o, i) => (
            <group key={i} position={[o.x, o.h + 0.05, o.z + o.d / 2]}>
              <Box size={[o.w, 0.09, 0.28]} color="#f5bc3a" />
              {Array.from({ length: Math.floor(o.w * 2) }, (_, j) => (
                <Box
                  key={j}
                  position={[-o.w / 2 + 0.2 + j * 0.5, 0.05, 0]}
                  size={[0.18, 0.01, 0.29]}
                  rotation={[0, 0.4, 0]}
                  color="#33434b"
                />
              ))}
            </group>
          ))}
        </>
      )}
    </group>
  );
}
