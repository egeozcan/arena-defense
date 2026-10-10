import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Color, Group, InstancedMesh, Mesh, Object3D, OrthographicCamera, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import {
  BALLOONS,
  LAYER_COLORS,
  arenaFor,
  canPlace,
  footprint,
  waveTypes,
  VEHICLES,
  type Run,
  type OwnedVehicle,
  type VehicleKind,
} from '../sim/data';
import { angleDifference } from '../sim/vehicle-motion';
import { Simulation, vehicleStats, type Bale } from '../sim/engine';
import { Box, Hay, Tree, VehicleModel } from './models';
import { Scenery } from './Scenery';
import { ArenaDetails } from './ArenaDetails';
import { CombatEffects } from './CombatEffects';
import { BaleProjectiles } from './BaleProjectiles';
import { ImpactWords } from './ImpactWords';
interface Props {
  run: Run;
  sim: Simulation | null;
  phase: string;
  selected: number | null;
  placementId: number | null;
  shopKind: VehicleKind;
  grid: boolean;
  rotation: number;
  zoom: number;
  onPlace: (x: number, z: number) => void;
  onVehicle: (id: number) => void;
  onVehicleHover: (kind: VehicleKind | null, x?: number, y?: number) => void;
  onPoint: (x: number, z: number) => void;
  onGust: (dx: number, dz: number) => void;
  armed: string | null;
  interpolation: { current: number };
}
function Terrain({ run, grid }: { run: Run; grid: boolean }) {
  const a = useMemo(
    () => arenaFor(run.arena, run.round, run.seed),
    [run.arena, run.round, run.seed],
  );
  const barn = a.kind === 'barn';
  return (
    <group>
      <Box
        position={[a.width / 2, -0.48, a.depth / 2]}
        size={[a.width + 0.6, 0.9, a.depth + 0.6]}
        color={barn ? '#aa8763' : '#a2a38a'}
      />
      <Box
        position={[a.width / 2, -0.045, a.depth / 2]}
        size={[a.width, 0.07, a.depth]}
        color={barn ? '#d6ac73' : '#b9b2a0'}
        surface={barn ? 'soil' : 'concrete'}
      />
      {barn ? (
        <>
          <Box
            position={[a.width * 0.455, 0.003, 2.5]}
            size={[a.width * 0.23, 0.016, 3]}
            color="#a09274"
          />
          <Box
            position={[a.width / 2, 0.003, a.depth - 3]}
            size={[a.width - 2, 0.018, 4]}
            color="#cab278"
          />
          {Array.from({ length: Math.floor(a.width / 1.3) }, (_, i) => (
            <Box
              key={i}
              position={[i * 1.3 + 1, 0.012, a.depth - 3]}
              size={[0.3, 0.018, 3]}
              color={i % 2 ? '#c9b47e' : '#d0bb83'}
            />
          ))}
        </>
      ) : (
        <>
          <Box
            position={[a.width / 2, 0.005, a.depth * 0.79]}
            size={[a.width * 0.24, 0.018, a.depth * 0.42]}
            color="#9d9b80"
          />
          <Box position={[a.width / 2, 0.005, 4]} size={[a.width - 2, 0.02, 7]} color="#d3d1ba" />
          {Array.from({ length: Math.floor(a.width / 6) }, (_, i) => (i + 1) * 6).map((x) => (
            <Box key={x} position={[x, 0.02, 4]} size={[0.06, 0.025, 7]} color="#b6b9a5" />
          ))}
        </>
      )}
      {grid && (
        <group>
          {Array.from({ length: a.width + 1 }, (_, i) => (
            <Box
              key={`x${i}`}
              position={[i, 0.03, a.depth / 2]}
              size={[0.022, 0.013, a.depth]}
              color="#b3a381"
            />
          ))}
          {Array.from({ length: a.depth + 1 }, (_, i) => (
            <Box
              key={`z${i}`}
              position={[a.width / 2, 0.03, i]}
              size={[a.width, 0.013, 0.022]}
              color="#b3a381"
            />
          ))}
        </group>
      )}
      {a.obstacles
        .filter((o) => !o.loose)
        .map((o, i) => (
          <group key={i}>
            {o.kind === 'hay' ? (
              <>
                <Hay x={o.x} z={o.z} w={o.w} d={o.d} h={o.h * 0.5} />
                <group position={[0.2, o.h * 0.5, 0]}>
                  <Hay x={o.x} z={o.z} w={o.w * 0.8} d={o.d * 0.9} h={o.h * 0.5} />
                </group>
              </>
            ) : o.kind === 'stall' ? (
              <>
                <Box
                  position={[o.x, 0.55, o.z]}
                  size={[o.w, 0.2, o.d]}
                  color="#aa7744"
                  surface="wood"
                />
                {[-o.w / 2, o.w / 2].map((x) => (
                  <Box
                    key={x}
                    position={[o.x + x, 1.3, o.z]}
                    size={[0.2, 2.6, o.d]}
                    color="#976334"
                    surface="wood"
                  />
                ))}
                <Box
                  position={[o.x, 2.6, o.z]}
                  size={[o.w, 0.2, o.d]}
                  color="#c8934a"
                  surface="wood"
                />
              </>
            ) : (
              <>
                <Box
                  position={[o.x, o.h / 2, o.z]}
                  size={[o.w, o.h, o.d]}
                  color={o.kind === 'platform' ? '#8f998f' : '#b4b0a0'}
                />
                {Array.from({ length: 3 }, (_, j) => (
                  <Box
                    key={j}
                    position={[o.x, o.h + 0.1 + j * 0.2, o.z]}
                    size={[o.w * 0.9, 0.16, o.d * 0.5]}
                    color="#aa8561"
                  />
                ))}
              </>
            )}
          </group>
        ))}
      {barn ? (
        <>
          <Box
            position={[a.width / 2, 1.25, -0.35]}
            size={[a.width, 2.5, 0.45]}
            color="#bd3c2b"
            surface="wood"
          />
          {Array.from({ length: a.width + 1 }, (_, i) => (
            <Box key={i} position={[i, 1.2, -0.105]} size={[0.045, 2.4, 0.02]} color="#9e3027" />
          ))}
          <Box
            position={[a.width / 2, 2.6, -0.35]}
            size={[a.width + 0.5, 0.16, 0.65]}
            color="#e5d2a5"
          />
          {[0, a.width].map((x) => (
            <group key={x}>
              <Box position={[x, 1.1, 3]} size={[0.4, 2.2, 6]} color="#bd3c2b" surface="wood" />
              <Box
                position={[x, 1.1, a.depth - 3]}
                size={[0.4, 2.2, 6]}
                color="#bd3c2b"
                surface="wood"
              />
              {[0.5, 5.5, a.depth - 5.5, a.depth - 0.5].map((z) => (
                <Box key={z} position={[x, 1.7, z]} size={[0.45, 3.4, 0.45]} color="#ecdbb4" />
              ))}
              <Box
                position={[x, 3.5, a.depth / 2]}
                size={[0.32, 0.22, a.depth + 0.8]}
                color="#976334"
                surface="wood"
              />
            </group>
          ))}
          {[4, a.width / 2, a.width - 4].map((x) => (
            <group key={x}>
              <Box
                position={[x, 2.9, -0.4]}
                size={[0.35, 5.8, 0.35]}
                color="#976334"
                surface="wood"
              />
              <Box position={[x, 5.8, 1.3]} size={[0.3, 0.3, 3.4]} color="#976334" surface="wood" />
            </group>
          ))}
          <group position={[-3, 0, -1]}>
            <mesh position={[0, 2.1, 0]} castShadow>
              <cylinderGeometry args={[1.2, 1.2, 4.2, 16]} />
              <meshStandardMaterial color="#a7b6aa" flatShading />
            </mesh>
            <mesh position={[0, 4.75, 0]} castShadow>
              <coneGeometry args={[1.3, 1.3, 16]} />
              <meshStandardMaterial color="#738d7f" flatShading />
            </mesh>
            {[1, 2.7].map((y) => (
              <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.205, 0.035, 4, 16]} />
                <meshStandardMaterial color="#748d7f" />
              </mesh>
            ))}
          </group>
          <Hay x={a.width + 2} z={a.depth - 2} />
          <Hay x={a.width + 3.5} z={a.depth - 2} />
        </>
      ) : (
        <>
          {[0, a.width].map((x) => (
            <group key={x}>
              {Array.from({ length: Math.ceil(a.depth / 4) }, (_, i) => 1 + i * 4).map((z) => (
                <Box key={z} position={[x, 1, z]} size={[0.12, 2, 0.12]} color="#798f85" />
              ))}
              <Box position={[x, 1, a.depth / 2]} size={[0.04, 0.04, a.depth]} color="#7e9488" />
            </group>
          ))}
          <Box position={[a.width / 2, 0.8, -0.3]} size={[a.width, 1.6, 0.3]} color="#8b9e90" />
          {[a.width * 0.3, a.width * 0.7].map((x) => (
            <group key={x} position={[x, 0, -2]}>
              <Box position={[0, 0.4, 0]} size={[3, 0.8, 0.2]} color="#f0be62" />
              {[-1, 1].map((xx) => (
                <Box key={xx} position={[xx, 0.8, 0]} size={[0.16, 1.6, 0.16]} color="#f2d199" />
              ))}
              {[-1, -0.5, 0, 0.5, 1].map((xx) => (
                <Box
                  key={xx}
                  position={[xx, 0.45, -0.12]}
                  size={[0.2, 0.7, 0.025]}
                  rotation={[0, 0, -0.4]}
                  color="#3f4b41"
                />
              ))}
            </group>
          ))}
        </>
      )}
      <Box
        position={[a.width / 2, -0.95, a.depth / 2]}
        size={[a.width + 24, 0.1, a.depth + 24]}
        color="#6aa259"
        surface="grass"
      />
      {[
        [-5, 5],
        [a.width + 5, 3],
        [-4, a.depth + 3],
        [a.width + 5, a.depth + 4],
        [a.width - 3, -5],
      ].map(([x, z], i) => (
        <Tree key={i} x={x} z={z} scale={i % 2 ? 1 : 1.25} />
      ))}
      {Array.from({ length: Math.floor(a.width / 2.4) }, (_, i) => (
        <group key={i} position={[3 + i * 2.4, -0.8, a.depth + 4]}>
          <Box position={[0, 0.7, 0]} size={[0.15, 1.5, 0.15]} color="#a9794c" surface="wood" />
          <Box position={[1.2, 1, 0]} size={[2.5, 0.13, 0.12]} color="#dfb574" surface="wood" />
          <Box position={[1.2, 0.5, 0]} size={[2.5, 0.13, 0.12]} color="#dfb574" surface="wood" />
        </group>
      ))}
      <Box position={[a.width + 2, 0.05, 6]} size={[1, 0.1, 2]} color="#8ca28c" />
    </group>
  );
}
function CameraRig({
  rotation,
  zoom,
  width,
  depth,
  sim,
}: {
  rotation: number;
  zoom: number;
  width: number;
  depth: number;
  sim: Simulation | null;
}) {
  const controls = useRef<OrbitControlsType>(null);
  const seenPops = useRef(0),
    shake = useRef(0),
    previousSim = useRef(sim),
    time = useRef(0);
  const reduceMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  useFrame(({ camera, size }, delta) => {
    time.current += delta;
    if (sim !== previousSim.current) {
      previousSim.current = sim;
      seenPops.current = sim?.pops ?? 0;
      shake.current = 0;
    }
    if (sim && sim.pops > seenPops.current) {
      shake.current = reduceMotion
        ? 0
        : Math.min(0.38, 0.1 + (sim.pops - seenPops.current) * 0.035);
      seenPops.current = sim.pops;
    }
    shake.current = Math.max(0, shake.current - delta * 1.5);
    if (controls.current) {
      const angle = Math.PI / 4 + (rotation * Math.PI) / 2;
      const target = new Vector3(Math.sin(angle) * 35, 30, Math.cos(angle) * 35).add(
        controls.current.target,
      );
      camera.position.lerp(target, 0.08);
      camera.position.x += Math.sin(time.current * 83) * shake.current;
      camera.position.z += Math.cos(time.current * 71) * shake.current;
      camera.lookAt(controls.current.target);
      const c = camera as OrthographicCamera;
      const across = Math.abs(Math.cos(angle)) * width + Math.abs(Math.sin(angle)) * depth;
      const along = Math.abs(Math.sin(angle)) * width + Math.abs(Math.cos(angle)) * depth;
      const base = Math.min(
        Math.max(250, size.width - (size.width < 760 ? 35 : 120)) / (across + 8),
        Math.max(260, size.height - 145) / (along * Math.sin(Math.atan2(30, 35)) + 7),
      );
      const rushZoom = !reduceMotion && sim?.rhythm.active(sim.tick) ? 1.035 : 1;
      c.zoom += (zoom * base * rushZoom - c.zoom) * 0.1;
      c.updateProjectionMatrix();
    }
  });
  return (
    <OrbitControls
      ref={controls}
      enableRotate={false}
      enablePan
      enableZoom={false}
      target={[0, 0, 0]}
      maxPolarAngle={Math.PI / 2}
    />
  );
}
function BalloonInstances({
  sim,
  interpolation,
}: {
  sim: Simulation;
  interpolation: { current: number };
}) {
  const balls = useRef<InstancedMesh>(null),
    knots = useRef<InstancedMesh>(null),
    strings = useRef<InstancedMesh>(null),
    halo = useRef<InstancedMesh>(null),
    shine = useRef<InstancedMesh>(null),
    armor = useRef<InstancedMesh>(null),
    cargo = useRef<InstancedMesh>(null);
  const obj = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);
  const flashColor = useMemo(() => new Color('#fff7c4'), []);
  useFrame(() => {
    if (
      !balls.current ||
      !knots.current ||
      !strings.current ||
      !halo.current ||
      !shine.current ||
      !armor.current ||
      !cargo.current
    )
      return;
    sim.balloons.forEach((b, i) => {
      const r = BALLOONS[b.kind].radius;
      const hit = Math.max(0, 1 - (sim.tick - b.hitTick) / 10);
      const appear = Math.min(
        1,
        Math.max(0.2, (sim.tick - b.spawned + interpolation.current) / 12),
      );
      obj.position.set(
        b.px + (b.x - b.px) * interpolation.current,
        b.py + (b.y - b.py) * interpolation.current,
        b.pz + (b.z - b.pz) * interpolation.current,
      );
      obj.rotation.set(0, 0, Math.sin(sim.tick / 90 + b.id) * 0.08);
      obj.scale.set(r * (1 + hit * 0.22) * appear, r * (1.25 - hit * 0.18) * appear, r * appear);
      obj.updateMatrix();
      balls.current!.setMatrixAt(i, obj.matrix);
      color.set(b.kind === 'layered' ? LAYER_COLORS[b.layer - 1] : BALLOONS[b.kind].color);
      color.lerp(flashColor, hit * 0.55);
      balls.current!.setColorAt(i, color);
      obj.position.set(b.x + r * 0.38, b.y + r * 0.52, b.z + r * 0.77);
      obj.scale.set(r * 0.15, r * 0.31, r * 0.06);
      obj.rotation.set(0, 0.5, -0.3);
      obj.updateMatrix();
      shine.current!.setMatrixAt(i, obj.matrix);
      obj.position.set(b.x, b.y, b.z);
      obj.rotation.set(Math.PI / 2, 0, 0);
      obj.scale.setScalar(b.armor ? r * 1.03 : 0);
      obj.updateMatrix();
      armor.current!.setMatrixAt(i, obj.matrix);
      obj.position.set(b.x, b.y - r * 1.5, b.z);
      obj.rotation.set(0, 0, 0);
      obj.scale.setScalar(b.kind === 'carrier' ? 0.8 : 0);
      obj.updateMatrix();
      cargo.current!.setMatrixAt(i, obj.matrix);
      obj.position.set(b.x, b.y - r * 1.2, b.z);
      obj.scale.set(0.065, 0.12, 0.065);
      obj.updateMatrix();
      knots.current!.setMatrixAt(i, obj.matrix);
      knots.current!.setColorAt(i, color);
      obj.position.y = b.y - r * 1.2 - 0.4;
      obj.scale.set(0.008, 0.7, 0.008);
      obj.updateMatrix();
      strings.current!.setMatrixAt(i, obj.matrix);
      obj.position.set(b.x, b.y, b.z);
      obj.scale.setScalar(b.regen ? r * 1.6 : 0);
      obj.updateMatrix();
      halo.current!.setMatrixAt(i, obj.matrix);
    });
    for (const ref of [balls, knots, strings, halo, shine, armor, cargo]) {
      const mesh = ref.current;
      if (!mesh) continue;
      mesh.count = sim.balloons.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });
  return (
    <>
      <instancedMesh
        ref={balls}
        args={[undefined, undefined, 300]}
        castShadow
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial roughness={0.2} metalness={0.12} />
      </instancedMesh>
      <instancedMesh ref={knots} args={[undefined, undefined, 300]} frustumCulled={false}>
        <coneGeometry args={[1, 1, 5]} />
        <meshStandardMaterial />
      </instancedMesh>
      <instancedMesh ref={strings} args={[undefined, undefined, 300]} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshStandardMaterial color="#746e58" />
      </instancedMesh>
      <instancedMesh ref={shine} args={[undefined, undefined, 300]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={armor} args={[undefined, undefined, 300]} frustumCulled={false}>
        <torusGeometry args={[1, 0.075, 6, 20]} />
        <meshStandardMaterial color="#b2c8da" metalness={0.7} roughness={0.35} />
      </instancedMesh>
      <instancedMesh
        ref={cargo}
        args={[undefined, undefined, 300]}
        castShadow
        frustumCulled={false}
      >
        <boxGeometry args={[0.9, 0.45, 0.6]} />
        <meshStandardMaterial color="#dca448" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={halo} args={[undefined, undefined, 300]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial color="#fff0be" wireframe transparent opacity={0.3} />
      </instancedMesh>
      {sim.balloons
        .filter((b) => b.fleeing || (b.armor && b.kind !== 'armored'))
        .map((b) => (
          <BalloonMarker key={b.id} sim={sim} id={b.id} />
        ))}
    </>
  );
}
function BalloonMarker({ sim, id }: { sim: Simulation; id: number }) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    const b = sim.balloons.find((b) => b.id === id);
    if (b && ref.current) ref.current.position.set(b.x, b.y, b.z);
  });
  return (
    <group ref={ref}>
      <Box
        position={[-0.52, 0, 0]}
        size={[0.5, 0.06, 0.25]}
        rotation={[0, 0, -0.3]}
        color="#faf0d5"
      />
      <Box
        position={[0.52, 0, 0]}
        size={[0.5, 0.06, 0.25]}
        rotation={[0, 0, 0.3]}
        color="#faf0d5"
      />
    </group>
  );
}
function ActiveVehicle({
  sim,
  id,
  selected,
  onClick,
  onHover,
  interpolation,
}: {
  sim: Simulation;
  id: number;
  selected: boolean;
  onClick: () => void;
  onHover: Props['onVehicleHover'];
  interpolation: { current: number };
}) {
  const ref = useRef<Group>(null);
  const v = sim.vehicles.find((v) => v.id === id)!;
  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(
        v.px + (v.x - v.px) * interpolation.current,
        0,
        v.pz + (v.z - v.pz) * interpolation.current,
      );
      ref.current.rotation.y =
        v.pangle + angleDifference(v.angle, v.pangle) * interpolation.current;
      let firedTick = -1000;
      for (const hit of sim.attacks) if (hit.vehicleId === v.id) firedTick = hit.tick;
      const kick = Math.max(0, 1 - (sim.tick - firedTick) / 10);
      ref.current.rotation.x = -kick * (v.kind === 'excavator' ? 0.055 : 0.025);
      ref.current.position.y = kick * 0.035;
    }
  });
  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(v.kind, e.clientX, e.clientY);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <VehicleModel kind={v.kind} vehicle={v} sim={sim} interpolation={interpolation} />
      {selected && <Selection range={vehicleStats(v).range} />}{' '}
      {v.state === 'stuck' && (
        <group position={[0, 3, 0]}>
          <Box size={[0.15, 0.45, 0.15]} color="#edb766" />
          <Box position={[0, -0.4, 0]} size={[0.15, 0.15, 0.15]} color="#edb766" />
        </group>
      )}
    </group>
  );
}
function LiveHay({ bale }: { bale: Bale }) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(bale.x, 0, bale.z);
    ref.current.scale.y = 0.6 + 0.4 * (bale.integrity ?? 1);
  });
  return (
    <group ref={ref}>
      <Hay x={0} z={0} w={bale.w} d={bale.d} h={bale.h} />
    </group>
  );
}
function Selection({ range = 3, color = '#eff4c2' }: { range?: number; color?: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <ringGeometry args={[range - 0.045, range, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} depthWrite={false} />
    </mesh>
  );
}
function Confetti({ sim }: { sim: Simulation }) {
  const ref = useRef<InstancedMesh>(null);
  const obj = useMemo(() => new Object3D(), []);
  const fragmentColor = useMemo(() => new Color(), []);
  useFrame(() => {
    if (!ref.current) return;
    let index = 0;
    for (const e of sim.events)
      for (let i = 0; i < 16; i++) {
        if (index >= 1200) break;
        const t = (sim.tick - e.tick) / 60;
        const angle = i * 2.399 + e.id * 0.37,
          speed = 2 + (i % 4) * 0.7;
        obj.position.set(
          e.x + Math.cos(angle) * t * speed,
          Math.max(0.08, e.y + t * (2.5 + (i % 3)) - t * t * 5),
          e.z + Math.sin(angle) * t * speed,
        );
        obj.rotation.set(t * 5 + i, t * 3, i);
        obj.scale.setScalar(Math.max(0, 1 - t / 1.2) * (1 + (i % 3) * 0.25));
        obj.updateMatrix();
        ref.current.setMatrixAt(index, obj.matrix);
        fragmentColor.set(i % 4 === 0 ? '#fff4b5' : i % 4 === 1 ? '#ffd265' : e.color);
        ref.current.setColorAt(index, fragmentColor);
        index++;
      }
    ref.current.count = index;
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 1200]} frustumCulled={false}>
      <boxGeometry args={[0.17, 0.07, 0.23]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}
function PlacementGhost({ vehicle }: { vehicle: OwnedVehicle }) {
  const ref = useRef<Group>(null);
  useLayoutEffect(() => {
    ref.current?.traverse((object) => {
      if (object instanceof Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          material.transparent = true;
          material.opacity = 0.5;
          material.depthWrite = false;
        }
      }
    });
  }, [vehicle.kind, vehicle.upgrades]);
  return (
    <group ref={ref}>
      <VehicleModel kind={vehicle.kind} upgrades={vehicle.upgrades} />
    </group>
  );
}
function StagingBalloons({ run }: { run: Run }) {
  const group = useRef<Group>(null),
    a = arenaFor(run.arena, run.round, run.seed);
  const types = waveTypes(run.round, run.seed, run.mode);
  useFrame(({ clock }) => {
    group.current?.children.forEach((child, i) => {
      child.position.y = 1.6 + (i % 3) * 0.4 + Math.sin(clock.elapsedTime * 1.5 + i) * 0.18;
      child.rotation.z = Math.sin(clock.elapsedTime + i) * 0.08;
    });
  });
  return (
    <group ref={group}>
      {Array.from({ length: 6 }, (_, i) => {
        const color = BALLOONS[types[i % types.length]].color;
        return (
          <group
            key={i}
            position={[-1.6 - (i % 3) * 1.1, 1.6, a.depth / 2 + (Math.floor(i / 3) - 0.5) * 1.1]}
          >
            <mesh castShadow scale={[0.48, 0.62, 0.48]}>
              <sphereGeometry args={[1, 24, 16]} />
              <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
            </mesh>
            <mesh
              position={[0.2, 0.28, 0.37]}
              scale={[0.07, 0.17, 0.03]}
              rotation={[0, 0.3, -0.35]}
            >
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color="#fff" transparent opacity={0.55} />
            </mesh>
            <mesh position={[0, -0.67, 0]}>
              <coneGeometry args={[0.07, 0.12, 5]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, -1.15, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.85, 4]} />
              <meshStandardMaterial color="#7a6842" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
function Scene(props: Props) {
  const { run, sim, phase, selected, shopKind, grid, armed } = props;
  const a = arenaFor(run.arena, run.round, run.seed);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const start = useRef<[number, number] | null>(null);
  const vehicle = run.fleet.find((v) => v.id === props.placementId);
  const valid = vehicle && hover && canPlace(a, run.fleet, vehicle, hover[0], hover[1]);
  function point(e: ThreeEvent<PointerEvent | MouseEvent>) {
    return [Math.floor(e.point.x + a.width / 2), Math.floor(e.point.z + a.depth / 2)] as [
      number,
      number,
    ];
  }
  return (
    <>
      <color attach="background" args={['#94bb95']} />
      <fog attach="fog" args={['#94bb95', 65, 110]} />
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#cfeaff', '#485a40', 0.9]} />
      <directionalLight
        position={[-16, 30, 18]}
        intensity={2.8}
        color="#fff3dd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-normalBias={0.04}
        shadow-bias={-0.0001}
        shadow-radius={3}
      />
      <directionalLight position={[20, 15, -25]} intensity={0.65} color="#c1e6ff" />
      <CameraRig
        rotation={props.rotation}
        zoom={props.zoom}
        width={a.width}
        depth={a.depth}
        sim={sim}
      />
      <group position={[-a.width / 2, 0, -a.depth / 2]}>
        <Terrain run={run} grid={grid && phase === 'setup'} />
        <Scenery kind={run.arena} />
        {!(phase === 'round' || phase === 'summary') &&
          a.obstacles
            .filter((o) => o.loose)
            .map((o) => <Hay key={o.id} x={o.x} z={o.z} w={o.w} d={o.d} h={o.h} />)}
        <ArenaDetails arena={a} />
        {(phase === 'setup' || phase === 'countdown') && <StagingBalloons run={run} />}
        {phase === 'garage' && !run.fleet.some((v) => v.placed) && (
          <group position={[a.width / 2, 0, a.depth / 2]} rotation={[0, 0.25, 0]}>
            <VehicleModel kind={shopKind} preview />
          </group>
        )}
        {!(phase === 'round' || phase === 'summary') &&
          run.fleet
            .filter((v) => v.placed)
            .map((v) => {
              const [w, d] = footprint(v);
              return (
                <group
                  key={v.id}
                  position={[v.x + w / 2, 0, v.z + d / 2]}
                  rotation={[0, v.rotation, 0]}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    if (phase === 'setup' && props.placementId === null)
                      props.onVehicleHover(v.kind, e.clientX, e.clientY);
                  }}
                  onPointerOut={() => props.onVehicleHover(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onVehicle(v.id);
                  }}
                >
                  <VehicleModel kind={v.kind} upgrades={v.upgrades} />
                  {v.id === selected && <Selection range={vehicleStats(v).range} />}
                </group>
              );
            })}
        {phase === 'setup' && vehicle && hover && (
          <group
            position={[
              hover[0] + footprint(vehicle)[0] / 2,
              0.03,
              hover[1] + footprint(vehicle)[1] / 2,
            ]}
            rotation={[0, vehicle.rotation, 0]}
          >
            <PlacementGhost vehicle={vehicle} />
            <Box
              position={[0, 0, 0]}
              size={[
                ...([footprint(vehicle)[0], 0.05, footprint(vehicle)[1]] as [
                  number,
                  number,
                  number,
                ]),
              ]}
              color={valid ? '#a9c59a' : '#d68c7c'}
            />
            <Selection range={1.5} color={valid ? '#ecf5c8' : '#f8b6a4'} />
          </group>
        )}
        {sim && (phase === 'round' || phase === 'summary') && (
          <>
            <BalloonInstances sim={sim} interpolation={props.interpolation} />
            <CombatEffects sim={sim} />
            <BaleProjectiles sim={sim} interpolation={props.interpolation} />
            <ImpactWords sim={sim} />
            {sim.vehicles.map((v) => (
              <ActiveVehicle
                key={v.id}
                sim={sim}
                id={v.id}
                interpolation={props.interpolation}
                selected={selected === v.id}
                onClick={() => props.onVehicle(v.id)}
                onHover={props.onVehicleHover}
              />
            ))}
            {sim.bales.map((b) => (
              <LiveHay key={b.id} bale={b} />
            ))}
            <Confetti sim={sim} />
          </>
        )}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[a.width / 2, 0.06, a.depth / 2]}
          onPointerMove={(e) => {
            const p = point(e);
            setHover(p);
          }}
          onPointerOut={() => {
            setHover(null);
          }}
          onPointerDown={(e) => {
            start.current = point(e);
          }}
          onPointerUp={(e) => {
            if (armed === 'gust' && start.current) {
              const end = point(e);
              props.onGust(end[0] - start.current[0], end[1] - start.current[1]);
              start.current = null;
            }
          }}
          onClick={(e) => {
            if (armed === 'gust') return;
            const p = point(e);
            if (phase === 'setup') props.onPlace(...p);
            else if (armed) props.onPoint(...p);
          }}
        >
          <planeGeometry args={[a.width, a.depth]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {phase !== 'round' && (
          <>
            <group position={[0.8, 0, a.depth / 2]}>
              <Selection range={0.75} color="#f4e7b2" />
            </group>
            <group position={[a.width - 0.8, 0, a.depth / 2]}>
              <Selection range={0.75} color="#f4e7b2" />
            </group>
          </>
        )}
      </group>
      <ContactShadows position={[0, -0.85, 0]} opacity={0.2} scale={90} blur={2.5} far={15} />
    </>
  );
}
export function ArenaScene(props: Props) {
  return (
    <Canvas
      shadows
      orthographic
      camera={{ position: [35, 30, 35], zoom: 25, near: 0.1, far: 150 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}
