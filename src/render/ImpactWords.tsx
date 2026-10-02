import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, InstancedMesh, Object3D } from 'three';
import type { Simulation } from '../sim/engine';

// One locally drawn texture and one draw call, even in a crowded late wave.
export function ImpactWords({ sim }: { sim: Simulation }) {
  const ref = useRef<InstancedMesh>(null);
  const object = useMemo(() => new Object3D(), []);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 192;
    const ctx = canvas.getContext('2d')!;
    ctx.translate(192, 96);
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = i % 2 ? 0.72 : 1;
      const x = Math.cos(angle) * 178 * radius,
        y = Math.sin(angle) * 84 * radius;
      if (!i) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffda65';
    ctx.strokeStyle = '#473525';
    ctx.lineWidth = 6;
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-0.08);
    ctx.font = 'italic 900 76px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeText('POP!', 0, 5);
    ctx.fillStyle = '#fffbe3';
    ctx.fillText('POP!', 0, 5);
    return new CanvasTexture(canvas);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    let count = 0;
    // Show occasional stamps, leaving the balloons and routes easy to read.
    for (let i = sim.events.length - 1; i >= 0 && count < 8; i--) {
      const event = sim.events[i];
      const age = (sim.tick - event.tick) / 60;
      if (age > 0.7 || (event.id % 3 !== 0 && event.kind === 'basic')) continue;
      const appear = Math.min(1, age / 0.055);
      const fade = Math.min(1, (0.7 - age) / 0.25);
      const size = (1 + Math.sin(Math.min(1, age / 0.22) * Math.PI) * 0.24) * appear * fade;
      object.position.set(event.x, event.y + 0.65 + age * 1.8, event.z);
      object.quaternion.copy(camera.quaternion);
      object.rotateZ(((event.id % 5) - 2) * 0.065);
      object.scale.set(2.35 * size, 1.175 * size, 1);
      object.updateMatrix();
      ref.current.setMatrixAt(count++, object.matrix);
    }
    ref.current.count = count;
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 8]} frustumCulled={false} renderOrder={2}>
      <planeGeometry />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.05}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
