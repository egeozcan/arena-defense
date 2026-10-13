import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { PerspectiveCamera as ThreePerspectiveCamera, Vector3 } from 'three';
import type { Simulation } from '../sim/engine';
import { angleDifference } from '../sim/vehicle-motion';
import { driverEye, driverSide, driverViewAngle, type DriverInput } from '../sim/vehicle-pilot';

export function DriverCamera({
  sim,
  vehicleId,
  input,
  focus,
  interpolation,
}: {
  sim: Simulation;
  vehicleId: number;
  input: { current: DriverInput };
  focus: { current: boolean };
  interpolation: { current: number };
}) {
  const camera = useRef<ThreePerspectiveCamera>(null);
  const target = useMemo(() => new Vector3(), []);
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  useFrame((_, delta) => {
    const c = camera.current;
    const v = sim.vehicles.find((v) => v.id === vehicleId);
    if (!c || !v) return;
    const alpha = interpolation.current;
    const heading = v.pangle + angleDifference(v.angle, v.pangle) * alpha;
    const t = (sim.tick - 1 + alpha) / 60;
    const travel = v.ptravel + (v.travel - v.ptravel) * alpha;
    const bob = reducedMotion
      ? 0
      : Math.sin(travel * 5) * Math.min(0.018, Math.abs(v.speed) * 0.002);
    let fired = -1000;
    for (const hit of sim.attacks) if (hit.vehicleId === v.id) fired = hit.tick;
    const recoil = reducedMotion ? 0 : Math.max(0, 1 - (sim.tick - fired + alpha) / 9) * 0.014;
    const [cabX, cabY, cabZ] = driverEye(v.kind, driverSide(v, input.current));
    c.position.set(
      v.px +
        (v.x - v.px) * alpha -
        sim.arena.width / 2 +
        Math.sin(heading) * cabZ +
        Math.cos(heading) * cabX,
      cabY + bob,
      v.pz +
        (v.z - v.pz) * alpha -
        sim.arena.depth / 2 +
        Math.cos(heading) * cabZ -
        Math.sin(heading) * cabX,
    );
    const yaw = driverViewAngle(v, input.current) + angleDifference(heading, v.angle);
    const pitch = input.current.pitch + recoil + (reducedMotion ? 0 : v.pitch * 0.2);
    target
      .set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch))
      .add(c.position);
    c.up.set(0, 1, 0);
    c.lookAt(target);
    if (!reducedMotion)
      c.rotateZ(v.roll * 0.15 + (sim.rhythm.active(sim.tick) ? Math.sin(t * 22) * 0.001 : 0));
    const fov = focus.current
      ? 56
      : 76 + (reducedMotion ? 0 : Math.min(5, Math.abs(v.speed) * 0.35));
    c.fov += (fov - c.fov) * (1 - Math.exp(-delta * 10));
    c.updateProjectionMatrix();
  });
  return <PerspectiveCamera ref={camera} makeDefault fov={76} near={0.06} far={150} />;
}
