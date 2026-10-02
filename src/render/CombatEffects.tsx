import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, InstancedMesh, Object3D, Vector3 } from 'three';
import type { Simulation } from '../sim/engine';

export function CombatEffects({ sim }: { sim: Simulation }) {
  const drops = useRef<InstancedMesh>(null),
    rings = useRef<InstancedMesh>(null),
    dust = useRef<InstancedMesh>(null),
    sparks = useRef<InstancedMesh>(null),
    glows = useRef<InstancedMesh>(null);
  const obj = useMemo(() => new Object3D(), []),
    color = useMemo(() => new Color(), []),
    offset = useMemo(() => new Vector3(), []);
  useFrame(({ camera }) => {
    if (!drops.current || !rings.current || !dust.current || !sparks.current || !glows.current)
      return;
    let d = 0,
      r = 0,
      p = 0,
      s = 0,
      g = 0;
    const ring = (
      x: number,
      y: number,
      z: number,
      size: number,
      hue: string,
      billboard = false,
    ) => {
      if (r >= 400 || size <= 0) return;
      obj.position.set(x, y, z);
      obj.scale.setScalar(size);
      if (billboard) obj.quaternion.copy(camera.quaternion);
      else obj.rotation.set(-Math.PI / 2, 0, 0);
      obj.updateMatrix();
      rings.current!.setMatrixAt(r, obj.matrix);
      color.set(hue);
      rings.current!.setColorAt(r++, color);
    };
    const glow = (x: number, y: number, z: number, size: number, hue: string) => {
      if (g >= 300 || size <= 0) return;
      obj.position.set(x, y, z);
      obj.scale.setScalar(size);
      obj.quaternion.copy(camera.quaternion);
      obj.updateMatrix();
      glows.current!.setMatrixAt(g, obj.matrix);
      color.set(hue);
      glows.current!.setColorAt(g++, color);
    };
    const burst = (
      x: number,
      y: number,
      z: number,
      age: number,
      hue: string,
      seed: number,
      power = 1,
    ) => {
      if (age < 0 || age > 0.48) return;
      const fade = Math.pow(1 - age / 0.48, 1.5);
      for (let i = 0; i < 12 && s < 1800; i++) {
        const angle = (i * Math.PI) / 6 + seed * 0.71;
        const radius = (0.15 + age * (4.5 + (i % 3))) * power;
        offset
          .set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
          .applyQuaternion(camera.quaternion);
        obj.position.set(x + offset.x, y + offset.y, z + offset.z);
        obj.quaternion.copy(camera.quaternion);
        obj.rotateZ(angle);
        obj.scale.set((0.25 + age * 1.6) * fade * power, fade * power, 1);
        obj.updateMatrix();
        sparks.current!.setMatrixAt(s, obj.matrix);
        color.set(i % 3 === 0 ? '#fffce1' : hue);
        sparks.current!.setColorAt(s++, color);
      }
    };
    for (const hit of sim.attacks) {
      const age = (sim.tick - hit.tick) / 60;
      if (age > 0.42) continue;
      const spray = hit.kind === 'sprayer',
        amount = spray ? 18 : hit.kind === 'harvester' ? 9 : 5;
      const hue = spray ? '#6fffe8' : hit.kind === 'crane' ? '#a1e8ff' : '#ffe28b';
      for (let i = 0; i < amount && d < 900; i++) {
        const t = Math.min(1, age / (spray ? 0.22 : 0.1)),
          spread = spray ? 0.55 : 0.22;
        obj.position.set(
          hit.from[0] + (hit.to[0] - hit.from[0]) * t + Math.sin(i * 2.4) * spread * t,
          hit.from[1] + (hit.to[1] - hit.from[1]) * t + Math.cos(i * 3.1) * spread * t,
          hit.from[2] + (hit.to[2] - hit.from[2]) * t + Math.sin(i * 3.8) * spread * t,
        );
        obj.rotation.set(0, 0, 0);
        obj.scale.setScalar((spray ? 0.16 : 0.13) * Math.max(0, 1 - age / 0.42));
        obj.updateMatrix();
        drops.current.setMatrixAt(d, obj.matrix);
        color.set(hue);
        drops.current.setColorAt(d++, color);
      }
      glow(...hit.from, Math.max(0, 1 - age / 0.12) * 0.6, hue);
      if (hit.kind === 'excavator') {
        ring(hit.to[0], 0.1, hit.to[2], (0.6 + age * 5) * (1 - age / 0.42), '#ffca64');
        burst(...hit.to, age - 0.08, '#ffcf67', hit.tick, 0.8);
      }
      if (hit.kind === 'crane') {
        ring(...hit.to, (0.3 + age * 3) * (1 - age / 0.42), '#d4fbff', true);
        burst(...hit.to, age - 0.08, '#97e6ff', hit.tick, 0.7);
      }
    }
    for (const e of sim.events) {
      const age = (sim.tick - e.tick) / 60;
      const power =
        (e.kind === 'carrier' ? 1.5 : e.kind === 'armored' ? 1.3 : 1) *
        (e.tick >= sim.rhythm.rushStarted && e.tick < sim.rhythm.rushUntil ? 1.2 : 1);
      burst(e.x, e.y, e.z, age, e.color, e.id, power);
      if (age < 0.5) {
        const fade = 1 - age / 0.5;
        ring(e.x, e.y, e.z, (0.45 + age * 4) * fade * power, '#fff4ba', true);
        ring(e.x, 0.08, e.z, (0.4 + age * 5) * fade * power, e.color);
        glow(e.x, e.y, e.z, Math.max(0, 1 - age / 0.2) * 1.15 * power, '#fff2a4');
      }
    }
    for (const v of sim.vehicles) {
      const rushing = sim.rhythm.active(sim.tick);
      if (v.boostUntil > sim.tick || v.activeUntil > sim.tick || rushing) {
        const hue = rushing ? '#ffcf57' : '#80f3ef';
        ring(v.x, 0.09, v.z, 1.35 + Math.sin(sim.tick / 5) * 0.12, hue);
        glow(v.x, 0.4, v.z, rushing ? 1.4 : 1, hue);
      }
      const ignitionAge = (sim.tick - sim.rhythm.rushStarted) / 60;
      if (ignitionAge >= 0 && ignitionAge < 0.8) {
        ring(v.x, 0.1, v.z, (1 + ignitionAge * 7) * (1 - ignitionAge / 0.8), '#ffdf73');
        burst(v.x, 0.5, v.z, ignitionAge, '#ffcf57', v.id, 1.25);
      }
      if (rushing && v.state === 'moving') {
        for (let i = 0; i < 3; i++) {
          const t = (sim.tick / 12 + i / 3) % 1;
          glow(
            v.x - Math.sin(v.angle) * (1 + t * 2),
            0.3,
            v.z - Math.cos(v.angle) * (1 + t * 2),
            (1 - t) * 0.45,
            '#ffbc45',
          );
        }
      }
      const speed = Math.hypot(v.vx, v.vz);
      const churning = Math.max(speed, Math.abs(v.yawRate) * 0.65);
      if (churning < 0.25) continue;
      const forwardX = speed > 0.1 ? v.vx / speed : Math.sin(v.angle);
      const forwardZ = speed > 0.1 ? v.vz / speed : Math.cos(v.angle);
      const power = Math.min(1.4, churning / 6 + Math.abs(v.steer) * 0.25);
      for (let i = 0; i < 8 && p < 220; i++) {
        const t = (sim.tick / 25 + i / 8) % 1,
          back = 0.7 + t * Math.min(3, churning * 0.4);
        obj.position.set(
          v.x - forwardX * back + Math.cos(v.angle) * (i % 2 ? 0.85 : -0.85),
          0.15 + t * 0.3,
          v.z - forwardZ * back - Math.sin(v.angle) * (i % 2 ? 0.85 : -0.85),
        );
        obj.rotation.set(t, i, 0);
        obj.scale.setScalar((0.12 + Math.sin(t * Math.PI) * 0.27) * (1 - t) * power);
        obj.updateMatrix();
        dust.current.setMatrixAt(p++, obj.matrix);
      }
    }
    if (sim.gust.until > sim.tick) {
      offset.set(sim.gust.dx, 0.08, sim.gust.dz).normalize();
      for (let i = 0; i < 60 && d < 900; i++) {
        const t = (sim.tick / 45 + i * 0.13) % 1;
        obj.position.set(
          sim.arena.width / 2 + offset.x * (t - 0.5) * sim.arena.width + ((i % 5) - 2) * 2,
          1 + (i % 4),
          sim.arena.depth / 2 + offset.z * (t - 0.5) * sim.arena.depth + ((i % 6) - 3) * 1.5,
        );
        obj.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), offset);
        obj.scale.set(0.04, 0.85, 0.04);
        obj.updateMatrix();
        drops.current.setMatrixAt(d, obj.matrix);
        color.set('#d6fff4');
        drops.current.setColorAt(d++, color);
      }
    }
    for (const cloud of sim.clouds)
      if (cloud.until > sim.tick) {
        ring(cloud.x, 0.1, cloud.z, 4 + Math.sin(sim.tick / 12) * 0.35, '#a3f78d');
      }
    for (const [mesh, count] of [
      [drops.current, d],
      [rings.current, r],
      [dust.current, p],
      [sparks.current, s],
      [glows.current, g],
    ] as const) {
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });
  return (
    <>
      <instancedMesh ref={drops} args={[undefined, undefined, 900]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial transparent opacity={0.9} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={rings} args={[undefined, undefined, 400]} frustumCulled={false}>
        <ringGeometry args={[0.86, 1, 32]} />
        <meshBasicMaterial transparent opacity={0.8} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={sparks} args={[undefined, undefined, 1800]} frustumCulled={false}>
        <boxGeometry args={[1, 0.1, 0.04]} />
        <meshBasicMaterial transparent opacity={0.95} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={glows} args={[undefined, undefined, 300]} frustumCulled={false}>
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </instancedMesh>
      <instancedMesh ref={dust} args={[undefined, undefined, 220]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#dfc49a" transparent opacity={0.32} depthWrite={false} />
      </instancedMesh>
    </>
  );
}
