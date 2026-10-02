import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, InstancedMesh, Object3D } from 'three';
import { Random, type Arena } from '../sim/data';
import { Box, Tree } from './models';

function CropField({ x, z, rows = 7 }: { x: number; z: number; rows?: number }) {
  const plants = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const obj = new Object3D(),
      rng = new Random(841),
      color = new Color();
    for (let row = 0; row < rows; row++)
      for (let i = 0; i < 15; i++) {
        obj.position.set(x + row * 0.65, -0.45 + rng.next() * 0.08, z + i * 0.6);
        obj.rotation.set(0, rng.next() * Math.PI, 0);
        obj.scale.set(0.8, 0.7 + rng.next() * 0.4, 0.8);
        obj.updateMatrix();
        plants.current!.setMatrixAt(row * 15 + i, obj.matrix);
        color.set(row % 3 ? '#668e35' : '#a8b749');
        plants.current!.setColorAt(row * 15 + i, color);
      }
    plants.current!.instanceMatrix.needsUpdate = true;
    plants.current!.instanceColor!.needsUpdate = true;
  }, [x, z, rows]);
  return (
    <group>
      <Box
        position={[x + (rows - 1) * 0.325, -0.86, z + 4.2]}
        size={[rows * 0.65 + 0.5, 0.04, 9.5]}
        color="#806443"
        surface="soil"
      />
      {Array.from({ length: rows }, (_, i) => (
        <Box
          key={i}
          position={[x + i * 0.65, -0.82, z + 4.2]}
          size={[0.25, 0.07, 9]}
          color="#a28455"
          surface="soil"
        />
      ))}
      <instancedMesh ref={plants} args={[undefined, undefined, rows * 15]} castShadow>
        <coneGeometry args={[0.3, 0.8, 5]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </group>
  );
}
function Windmill({ x, z }: { x: number; z: number }) {
  const blades = useRef<Group>(null);
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 0.2;
  });
  return (
    <group position={[x, -0.8, z]}>
      <Box position={[0, 2.5, 0]} size={[0.6, 5, 0.6]} color="#ddd2ad" surface="wood" />
      <Box
        position={[0, 2.3, 0]}
        size={[2.8, 0.14, 0.15]}
        rotation={[0, 0, Math.PI / 2 - 0.25]}
        color="#9a7954"
      />
      <Box
        position={[0, 2.3, 0]}
        size={[2.8, 0.14, 0.15]}
        rotation={[0, 0, Math.PI / 2 + 0.25]}
        color="#9a7954"
      />
      <group ref={blades} position={[0, 5.1, 0.45]}>
        {Array.from({ length: 8 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
            <Box position={[0, 1.15, 0]} size={[0.12, 2.3, 0.08]} color="#707e76" />
            <Box
              position={[0.18, 1.85, 0]}
              size={[0.65, 0.95, 0.1]}
              rotation={[0, 0.2, -0.12]}
              color="#e7dfb9"
            />
          </group>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.22, 16]} />
          <meshStandardMaterial color="#d3854a" />
        </mesh>
      </group>
    </group>
  );
}
function SiteCrane({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, -0.8, z]}>
      <Box position={[0, 0.3, 0]} size={[3, 0.6, 3]} color="#758b8c" surface="concrete" />
      {[-0.6, 0.6].flatMap((xx) =>
        [-0.6, 0.6].map((zz) => (
          <Box
            key={`${xx},${zz}`}
            position={[xx, 4, zz]}
            size={[0.16, 7.4, 0.16]}
            color="#eaba45"
          />
        )),
      )}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[0, 1 + i * 1.1, 0]}>
          <Box size={[1.4, 0.14, 1.4]} color="#d7a636" />
          <Box
            position={[0, 0.5, 0.62]}
            size={[1.55, 0.09, 0.1]}
            rotation={[0, 0, i % 2 ? 0.7 : -0.7]}
            color="#ffd772"
          />
        </group>
      ))}
      <Box position={[3.3, 7.5, 0]} size={[10, 0.4, 1]} color="#efbf42" />
      <Box position={[3.3, 8.1, 0]} size={[10, 0.1, 0.12]} color="#f7d56c" />
      {Array.from({ length: 10 }, (_, i) => (
        <Box
          key={i}
          position={[-1.1 + i, 7.85, 0.45]}
          size={[1, 0.1, 0.1]}
          rotation={[0, 0, i % 2 ? 0.65 : -0.65]}
          color="#997e42"
        />
      ))}
      <Box position={[-1.8, 7.1, 0]} size={[1.4, 1.4, 1.6]} color="#e2aa3e" />
      <Box position={[-1.8, 7.15, 0.82]} size={[1.1, 0.7, 0.04]} color="#476d78" />
      <Box position={[7, 5.9, 0]} size={[0.055, 3, 0.055]} color="#4f6667" />
      <mesh position={[7, 4.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.28, 0.07, 6, 12, Math.PI * 1.5]} />
        <meshStandardMaterial color="#e6bc49" />
      </mesh>
    </group>
  );
}
function WorkLights({ a }: { a: Arena }) {
  return (
    <group>
      {[5, a.width - 5].map((x) => (
        <group key={x} position={[x, 0, -1]}>
          <Box position={[0, 2, 0]} size={[0.12, 4, 0.12]} color="#475a5e" />
          <Box
            position={[0, 4.05, 0.3]}
            size={[1.2, 0.28, 0.6]}
            rotation={[0.15, 0, 0]}
            color="#40565c"
          />
          <mesh position={[0, 3.97, 0.5]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[1, 0.12, 0.35]} />
            <meshStandardMaterial color="#ffe9a1" emissive="#f5bd57" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
export function ArenaDetails({ arena: a }: { arena: Arena }) {
  const barn = a.kind === 'barn';
  return (
    <group>
      {/* Entry aprons and low edging keep the playable boundary easy to see. */}
      {[0, a.width].map((x) => (
        <group key={x}>
          <Box
            position={[x + (x ? 1.8 : -1.8), -0.38, a.depth / 2]}
            size={[3.6, 0.22, 6]}
            color={barn ? '#b7aa87' : '#9eaead'}
            surface="concrete"
          />
          {[-2.7, 2.7].map((z) => (
            <Box
              key={z}
              position={[x + (x ? 1.8 : -1.8), -0.15, a.depth / 2 + z]}
              size={[3.6, 0.12, 0.2]}
              color="#e4d6ad"
            />
          ))}
        </group>
      ))}
      <Box
        position={[a.width / 2, 0.09, a.depth + 0.15]}
        size={[a.width, 0.18, 0.3]}
        color={barn ? '#bd9160' : '#9aa8a2'}
      />
      {barn ? (
        <>
          {/* Broad stone lanes, worn wheel tracks, and loading bays. */}
          {[a.depth * 0.34, a.depth * 0.65].map((z) => (
            <group key={z}>
              <Box
                position={[a.width / 2, 0.023, z]}
                size={[a.width - 3, 0.012, 1.8]}
                color="#d4bf92"
                surface="soil"
              />
              {[-0.48, 0.48].map((offset) => (
                <Box
                  key={offset}
                  position={[a.width / 2, 0.035, z + offset]}
                  size={[a.width - 4, 0.012, 0.13]}
                  color="#b89969"
                />
              ))}
            </group>
          ))}
          {Array.from({ length: Math.floor(a.width / 4) }, (_, i) => (
            <group key={i} position={[2 + i * 4, 0.025, a.depth - 1.3]}>
              <Box size={[0.055, 0.012, 1.5]} color="#f2ddb4" />
              <Box position={[1.3, 0, -0.7]} size={[2.6, 0.012, 0.055]} color="#f2ddb4" />
            </group>
          ))}
          <CropField x={a.width + 3.5} z={a.depth * 0.25} />
          <CropField x={3} z={-11} rows={10} />
          <Windmill x={-5} z={a.depth - 3} />
          <group position={[-6, -0.83, 9]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.4, 1, 1]}>
              <circleGeometry args={[2.6, 48]} />
              <meshStandardMaterial color="#799d77" />
            </mesh>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.35, 1, 1]}>
              <circleGeometry args={[2.2, 48]} />
              <meshPhysicalMaterial color="#6da9ad" roughness={0.2} metalness={0.1} clearcoat={1} />
            </mesh>
            {[-1.6, 1.3].map((x) => (
              <mesh key={x} position={[x, 0.04, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.35, 8]} />
                <meshStandardMaterial color="#a0b95d" />
              </mesh>
            ))}
          </group>
          {[7, 15, 23].map((x) => (
            <Tree key={x} x={x} z={a.depth + 7} scale={0.9} />
          ))}
          <Box
            position={[a.width / 2, -0.8, a.depth + 5.5]}
            size={[a.width + 9, 0.09, 2]}
            color="#c3ab78"
            surface="soil"
          />
        </>
      ) : (
        <>
          {/* Panel joints and a broad marked service road leave open circulation lanes. */}
          {Array.from({ length: Math.floor(a.width / 6) }, (_, i) => (
            <Box
              key={`x${i}`}
              position={[6 + i * 6, 0.028, a.depth / 2]}
              size={[0.035, 0.012, a.depth]}
              color="#a4a998"
            />
          ))}
          {Array.from({ length: Math.floor(a.depth / 6) }, (_, i) => (
            <Box
              key={`z${i}`}
              position={[a.width / 2, 0.028, 6 + i * 6]}
              size={[a.width, 0.012, 0.035]}
              color="#a4a998"
            />
          ))}
          <Box
            position={[a.width / 2, 0.035, a.depth * 0.47]}
            size={[a.width - 2, 0.013, 5]}
            color="#abb6ae"
            surface="concrete"
          />
          {Array.from({ length: Math.floor(a.width / 4) }, (_, i) => (
            <Box
              key={i}
              position={[2 + i * 4, 0.046, a.depth * 0.47]}
              size={[2, 0.012, 0.09]}
              color="#f4e1aa"
            />
          ))}
          {[1.9, -1.9].map((offset) => (
            <Box
              key={offset}
              position={[a.width / 2, 0.046, a.depth * 0.47 + offset]}
              size={[a.width - 3, 0.012, 0.07]}
              color="#f4e1aa"
            />
          ))}
          <SiteCrane x={a.width + 4} z={5} />
          <WorkLights a={a} />
          <group position={[9, 0.2, -4]}>
            <Box size={[7, 2.4, 3]} color="#ece4cb" />
            <Box position={[0, 1.3, 0]} size={[7.4, 0.18, 3.4]} color="#427c87" />
            {[-2, 2].map((x) => (
              <group key={x} position={[x, 0.1, 1.53]}>
                <Box size={[1.5, 0.95, 0.08]} color="#426d7e" />
                <Box size={[0.06, 0.95, 0.09]} color="#f5eedb" />
              </group>
            ))}
            <Box position={[0, -0.1, 1.55]} size={[0.9, 1.9, 0.1]} color="#657f7b" />
          </group>
          <Box
            position={[a.width / 2, -0.81, a.depth + 4]}
            size={[a.width + 14, 0.08, 4.5]}
            color="#77928b"
            surface="concrete"
          />
          {Array.from({ length: 7 }, (_, i) => (
            <group key={i} position={[8 + i * 3, -0.55, a.depth + 4]}>
              <Box size={[2, 0.6, 0.5]} color="#c9a977" surface="wood" />
              <Box position={[0, 0.35, 0]} size={[2.2, 0.15, 0.6]} color="#e4c58c" surface="wood" />
            </group>
          ))}
          {[10, 24, 36].map((x) => (
            <Tree key={x} x={x} z={a.depth + 8} scale={0.85} />
          ))}
        </>
      )}
    </group>
  );
}
