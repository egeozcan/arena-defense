import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Group, type MeshStandardMaterial } from 'three';
import { type VehicleKind } from '../sim/data';
import type { Simulation, SimVehicle } from '../sim/engine';
import { angleDifference, wheelSteering } from '../sim/vehicle-motion';
import { Box, Paint, type ShapeProps, type Vec } from './vehicle-parts';
export { Box } from './vehicle-parts';
import { UPGRADE_COLORS, vehicleAppearance, type VehicleUpgrades } from './vehicle-appearance';
import { ChassisUpgrades, ToolUpgrades, TractionUpgrades } from './vehicle-upgrades';
function Glass({ position, size }: ShapeProps) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color="#347e96"
        metalness={0.32}
        roughness={0.12}
        clearcoat={1}
        transparent
        opacity={0.82}
      />
    </mesh>
  );
}
function Lamp({
  position,
  role,
  side = 0,
  vehicle,
  sim,
}: {
  position: Vec;
  role: 'head' | 'brake' | 'reverse' | 'indicator';
  side?: number;
  vehicle?: SimVehicle;
  sim?: Simulation;
}) {
  const material = useRef<MeshStandardMaterial>(null);
  const color = role === 'brake' ? '#fa5940' : role === 'indicator' ? '#ffb83b' : '#fff4c4';
  useFrame(() => {
    if (!material.current) return;
    const braking = vehicle && vehicle.acceleration < -1.5 && Math.abs(vehicle.speed) > 0.2;
    const reversing = vehicle && vehicle.speed < -0.15;
    const indicating =
      vehicle && Math.sign(vehicle.steer) === side && Math.abs(vehicle.steer) > 0.22;
    material.current.emissiveIntensity =
      role === 'head'
        ? 0.45
        : role === 'brake'
          ? braking
            ? 2.5
            : 0.15
          : role === 'reverse'
            ? reversing
              ? 1.8
              : 0
            : indicating && Math.floor((sim?.tick ?? 0) / 18) % 2 === 0
              ? 2
              : 0.05;
  });
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[role === 'reverse' ? 0.08 : 0.17, 0.09, 0.055]} />
      <meshStandardMaterial
        ref={material}
        color={color}
        emissive={color}
        roughness={0.2}
        metalness={0.25}
      />
    </mesh>
  );
}
interface RunningGearProps {
  x: number;
  vehicle?: SimVehicle;
  interpolation?: { current: number };
  traction?: number;
}
function Wheel({
  x,
  z,
  big = false,
  tireScale = 1,
  traction = 0,
  steering = false,
  rear = false,
  vehicle,
  interpolation,
}: RunningGearProps & {
  z: number;
  big?: boolean;
  tireScale?: number;
  steering?: boolean;
  rear?: boolean;
}) {
  const knuckle = useRef<Group>(null),
    rotor = useRef<Group>(null);
  const r = (big ? 0.58 : 0.43) * tireScale;
  const outside = x > 0 ? -1 : 1;
  useFrame(() => {
    const alpha = interpolation?.current ?? 1;
    const steer = vehicle ? vehicle.psteer + (vehicle.steer - vehicle.psteer) * alpha : 0;
    if (knuckle.current) knuckle.current.rotation.y = steering ? wheelSteering(steer, x, rear) : 0;
    if (rotor.current) {
      const travel = vehicle ? vehicle.ptravel + (vehicle.travel - vehicle.ptravel) * alpha : 0;
      // The local axle points toward -X; negative rotation rolls toward +Z.
      rotor.current.rotation.y = -travel / r;
    }
  });
  return (
    <group position={[x, r, z]} ref={knuckle}>
      <group rotation={[0, 0, Math.PI / 2]}>
        <group ref={rotor}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[r, r, 0.34, 24]} />
            <meshStandardMaterial color="#172025" roughness={0.96} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[0, side * 0.175, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <torusGeometry args={[r * 0.75, r * 0.2, 8, 24]} />
              <meshStandardMaterial color="#253038" roughness={0.9} />
            </mesh>
          ))}
          {Array.from({ length: 16 }, (_, i) =>
            [-1, 1].map((side) => {
              const angle = (i * Math.PI) / 8;
              return (
                <group key={`${i}-${side}`} rotation={[0, angle, 0]}>
                  <Box
                    position={[r - 0.015, side * 0.09, 0]}
                    size={[0.085, 0.19, 0.09]}
                    rotation={[side * 0.48, 0, 0]}
                    color="#354048"
                  />
                </group>
              );
            }),
          )}
          {traction >= 2 &&
            Array.from({ length: 8 }, (_, i) => (
              <group key={`chain-${i}`} rotation={[0, (i * Math.PI) / 4, 0]}>
                <Box
                  position={[r, 0, 0]}
                  size={[0.05, 0.37, 0.05]}
                  color={UPGRADE_COLORS.traction}
                />
              </group>
            ))}
          <mesh position={[0, outside * 0.195, 0]} castShadow>
            <cylinderGeometry args={[r * 0.56, r * 0.56, 0.055, 24]} />
            <meshStandardMaterial color="#c6ccca" metalness={0.7} roughness={0.32} />
          </mesh>
          <mesh position={[0, outside * 0.228, 0]}>
            <cylinderGeometry args={[r * 0.42, r * 0.42, 0.028, 20]} />
            <meshStandardMaterial color="#41515b" metalness={0.55} roughness={0.5} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (i * Math.PI) / 3;
            return (
              <Box
                key={i}
                position={[Math.cos(angle) * r * 0.26, outside * 0.252, Math.sin(angle) * r * 0.26]}
                size={[r * 0.37, 0.03, 0.07]}
                rotation={[0, -angle, 0]}
                color={traction >= 1 ? UPGRADE_COLORS.traction : '#e0d9c4'}
              />
            );
          })}
          <mesh position={[0, outside * 0.27, 0]}>
            <cylinderGeometry args={[r * 0.18, r * 0.18, 0.045, 12]} />
            <meshStandardMaterial color="#e59b48" metalness={0.45} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
function Track({ x, vehicle, interpolation, traction = 0 }: RunningGearProps) {
  const belt = useRef<Group>(null),
    rollers = useRef<Group>(null);
  const half = 0.85,
    radius = 0.34;
  const perimeter = 4 * half + 2 * Math.PI * radius;
  useFrame(() => {
    const alpha = interpolation?.current ?? 1;
    const travel = vehicle
      ? x < 0
        ? vehicle.pleftTravel + (vehicle.leftTravel - vehicle.pleftTravel) * alpha
        : vehicle.prightTravel + (vehicle.rightTravel - vehicle.prightTravel) * alpha
      : 0;
    belt.current?.children.forEach((link, i) => {
      let t = ((((i * perimeter) / 32 - travel) % perimeter) + perimeter) % perimeter;
      let y = radius,
        z = -half,
        tilt = 0;
      if (t < 2 * half) z += t;
      else if ((t -= 2 * half) < Math.PI * radius) {
        const angle = t / radius;
        y = radius * Math.cos(angle);
        z = half + radius * Math.sin(angle);
        tilt = angle;
      } else if ((t -= Math.PI * radius) < 2 * half) {
        y = -radius;
        z = half - t;
        tilt = Math.PI;
      } else {
        const angle = (t - 2 * half) / radius + Math.PI;
        y = radius * Math.cos(angle);
        z = -half + radius * Math.sin(angle);
        tilt = angle;
      }
      link.position.set(0, 0.39 + y, z);
      link.rotation.x = tilt;
    });
    rollers.current?.children.forEach((roller) => {
      roller.rotation.x = travel / 0.27;
    });
  });
  return (
    <group position={[x, 0, 0]}>
      <Paint position={[0, 0.4, 0]} size={[0.4, 0.56, 2.12]} color="#1b292e" />
      <group ref={rollers}>
        {[-0.83, -0.28, 0.28, 0.83].map((z) => (
          <group key={z} position={[0, 0.39, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.27, 0.27, 0.46, 16]} />
              <meshStandardMaterial color="#52636c" metalness={0.55} roughness={0.52} />
            </mesh>
            <Box
              position={[Math.sign(x) * 0.24, 0, 0]}
              size={[0.035, 0.36, 0.065]}
              color="#b1b8ac"
            />
            <mesh position={[Math.sign(x) * 0.265, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.04, 10]} />
              <meshStandardMaterial color="#d5a156" metalness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={belt}>
        {Array.from({ length: 32 }, (_, i) => (
          <group key={i}>
            <Box size={[0.54, 0.065, 0.15]} color="#35434b" />
            <Box
              position={[0, 0.045, 0]}
              size={[traction >= 2 ? 0.67 : 0.56, traction >= 2 ? 0.055 : 0.03, 0.045]}
              color={traction >= 2 ? UPGRADE_COLORS.traction : '#718079'}
            />
          </group>
        ))}
      </group>
    </group>
  );
}
export function VehicleModel({
  kind,
  working = false,
  preview = false,
  vehicle,
  sim,
  interpolation,
  upgrades,
}: {
  kind: VehicleKind;
  upgrades?: VehicleUpgrades;
  working?: boolean;
  preview?: boolean;
  vehicle?: SimVehicle;
  sim?: Simulation;
  interpolation?: { current: number };
}) {
  const tool = useRef<Group>(null),
    reel = useRef<Group>(null),
    beacon = useRef<Group>(null),
    chassis = useRef<Group>(null),
    upper = useRef<Group>(null),
    outriggers = useRef<Group>(null);
  useFrame(({ clock }) => {
    const alpha = interpolation?.current ?? 1;
    const t = sim ? (sim.tick - 1 + alpha) / 60 : clock.elapsedTime;
    const attacking = vehicle ? vehicle.state === 'attacking' : working;
    const travel = vehicle ? vehicle.ptravel + (vehicle.travel - vehicle.ptravel) * alpha : 0;
    if (outriggers.current) {
      const deployed = !vehicle || vehicle.state === 'attacking';
      outriggers.current.scale.x = deployed ? 1 : 0.55;
      outriggers.current.position.y = deployed ? 0 : 0.45;
    }
    if (reel.current) {
      if (kind === 'blower') reel.current.rotation.z = t * (attacking ? 28 : 5);
      else reel.current.rotation.x = attacking ? t * 18 : travel * 3;
    }
    if (tool.current)
      tool.current.rotation.x = attacking ? Math.sin(t * (kind === 'excavator' ? 7 : 9)) * 0.18 : 0;
    if (beacon.current) beacon.current.rotation.y = t * 4;
    if (upper.current && vehicle) {
      // The slew ring aims the boom independently of the crawler undercarriage.
      const heading = vehicle.pangle + angleDifference(vehicle.angle, vehicle.pangle) * alpha;
      const aim =
        vehicle.ptoolAngle + angleDifference(vehicle.toolAngle, vehicle.ptoolAngle) * alpha;
      upper.current.rotation.y = angleDifference(aim, heading);
    }
    if (chassis.current) {
      chassis.current.rotation.x = vehicle
        ? vehicle.ppitch + (vehicle.pitch - vehicle.ppitch) * alpha
        : 0;
      chassis.current.rotation.z = vehicle
        ? vehicle.proll + (vehicle.roll - vehicle.proll) * alpha
        : 0;
      const speed = vehicle ? Math.abs(vehicle.speed) : 0;
      chassis.current.position.y = Math.sin(travel * 8) * Math.min(0.025, speed * 0.004);
    }
  });
  const u = upgrades ?? vehicle?.upgrades;
  const appearance = vehicleAppearance(kind, u);
  const tiers = u ?? { attack: 0, speed: 0, traction: 0, unique: 0 };
  const c = appearance.paint,
    farm = kind !== 'excavator' && kind !== 'crane',
    cabX = kind === 'excavator' ? -0.35 : 0;
  return (
    <group>
      {farm
        ? [-0.91, 0.91].map((x) => (
            <group key={x}>
              <Wheel
                x={x}
                z={0.75}
                big
                tireScale={appearance.tireScale}
                traction={tiers.traction}
                steering={kind !== 'harvester'}
                vehicle={vehicle}
                interpolation={interpolation}
              />
              <Wheel
                x={x}
                z={-0.72}
                tireScale={appearance.tireScale}
                traction={tiers.traction}
                steering={kind === 'harvester'}
                rear
                vehicle={vehicle}
                interpolation={interpolation}
              />
            </group>
          ))
        : [-0.82, 0.82].map((x) => (
            <Track
              key={x}
              x={x}
              vehicle={vehicle}
              interpolation={interpolation}
              traction={tiers.traction}
            />
          ))}
      <TractionUpgrades kind={kind} tier={tiers.traction} />
      {kind === 'crane' && tiers.unique >= 5 && (
        <group ref={outriggers} name="specialist-tower-outriggers">
          {[-1, 1].map((side) => (
            <group key={side}>
              <Paint position={[side * 1.3, 0.55, 0]} size={[1.4, 0.2, 0.25]} color="#56cadd" />
              <Box position={[side * 1.9, 0.28, 0]} size={[0.17, 0.55, 0.17]} color="#304553" />
              <Paint position={[side * 1.9, 0.08, 0]} size={[0.55, 0.15, 0.65]} color="#56cadd" />
            </group>
          ))}
        </group>
      )}
      <group ref={chassis}>
        <Paint position={[0, 0.64, 0]} size={[1.55, 0.42, 2.1]} color="#243942" />
        {farm &&
          [-0.91, 0.91].map((x) => (
            <group key={x}>
              <Paint
                position={[x, 1.22 + (appearance.tireScale - 1) * 1.16, 0.75]}
                size={[0.48, 0.14, 1.08]}
                color={c}
              />
              <Box position={[x * 0.72, 0.61, 0]} size={[0.22, 0.1, 0.95]} color="#58625d" />
            </group>
          ))}
        {!farm && (
          <mesh position={[0, 0.89, -0.2]} castShadow>
            <cylinderGeometry args={[0.65, 0.65, 0.14, 24]} />
            <meshStandardMaterial color="#4d5a5c" metalness={0.7} roughness={0.4} />
          </mesh>
        )}
        <group ref={farm ? undefined : upper}>
          <ChassisUpgrades kind={kind} upgrades={tiers} />
          <Paint position={[0, 0.94, -0.35]} size={[1.48, 0.6, 1.5]} color={c} />
          <Paint position={[0, 1.22, -0.7]} size={[1.25, 0.28, 0.95]} color={c} />
          <Paint
            position={[cabX, 1.65, -0.49]}
            size={[kind === 'excavator' ? 0.85 : 1.15, 1, 1]}
            color={c}
          />
          <Glass
            position={[cabX, 1.78, 0.03]}
            size={[kind === 'excavator' ? 0.65 : 0.95, 0.68, 0.05]}
            color="#16596e"
          />
          {[-1, 1].map((side) => (
            <group key={side}>
              <Glass
                position={[cabX + side * (kind === 'excavator' ? 0.44 : 0.6), 1.78, -0.5]}
                size={[0.035, 0.66, 0.76]}
                color="#247e96"
              />
              <Box
                position={[cabX + side * (kind === 'excavator' ? 0.465 : 0.625), 1.75, -0.51]}
                size={[0.035, 0.7, 0.06]}
                color="#e2d6b3"
              />
              <Box position={[side * 0.8, 1.6, 0.07]} size={[0.14, 0.2, 0.12]} color="#304956" />
            </group>
          ))}
          <Box
            position={[cabX - 0.18, 1.95, 0.065]}
            size={[0.085, 0.32, 0.012]}
            rotation={[0, 0, -0.4]}
            color="#addfe4"
          />
          <Paint
            position={[cabX, 2.21, -0.5]}
            size={[kind === 'excavator' ? 1 : 1.4, 0.16, 1.18]}
            color="#fff1ce"
          />
          <group position={[cabX, 2.35, -0.65]} ref={beacon}>
            <mesh>
              <cylinderGeometry args={[0.14, 0.16, 0.18, 12]} />
              <meshStandardMaterial color="#ffb52f" emissive="#ff8a1a" emissiveIntensity={0.35} />
            </mesh>
            <Box position={[0, 0, 0.13]} size={[0.1, 0.12, 0.035]} color="#fff4b1" />
          </group>
          <Paint position={[0, 0.68, 0.99]} size={[1.6, 0.18, 0.21]} color="#bac4ba" />
          <Box position={[0, 0.97, -1.115]} size={[0.88, 0.35, 0.025]} color="#1a3039" />
          {Array.from({ length: 5 }, (_, i) => (
            <Box
              key={i}
              position={[0, 0.84 + i * 0.055, -1.135]}
              size={[0.83, 0.016, 0.018]}
              color="#88938b"
            />
          ))}
          {[-1, 1].map((side) => (
            <group key={side}>
              <Lamp
                position={[side * 0.65, 0.81, -1.14]}
                role="brake"
                vehicle={vehicle}
                sim={sim}
              />
              <Lamp
                position={[side * 0.5, 0.81, -1.14]}
                role="reverse"
                vehicle={vehicle}
                sim={sim}
              />
              <Lamp position={[side * 0.68, 1.15, 0.51]} role="head" />
              <Lamp
                position={[side * 0.69, 1.02, 0.51]}
                role="indicator"
                side={side}
                vehicle={vehicle}
                sim={sim}
              />
              <Box
                position={[side * 0.69, 0.89, -0.08]}
                size={[0.24, 0.075, 0.46]}
                color="#758279"
              />
              <Box
                position={[side * 0.74, 0.72, -0.15]}
                size={[0.26, 0.055, 0.3]}
                color="#b2b8a7"
              />
            </group>
          ))}
          <Box position={[0.57, 1.65, -0.88]} size={[0.12, 1.1, 0.12]} color="#22343e" />
          <Paint position={[0, 0.62, -1.12]} size={[1.28, 0.19, 0.16]} color="#e4d8c0" />
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              position={[0.751, 1.05, -0.77 + i * 0.14]}
              size={[0.02, 0.12, 0.075]}
              color="#663c30"
            />
          ))}
          {kind === 'harvester' && (
            <>
              <group
                position={[0, tiers.unique >= 2 ? 0.78 : 0.58, 1.45]}
                scale={[appearance.toolWidth, 1, 1]}
              >
                <ToolUpgrades kind={kind} upgrades={tiers} />
                <Paint size={[3.2, 0.24, 0.65]} color={c} />
                <group ref={reel} position={[0, 0.2, 0.33]}>
                  <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.14, 0.14, 3.05, 16]} />
                    <meshStandardMaterial color="#213841" metalness={0.4} />
                  </mesh>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Box
                      key={i}
                      position={[
                        0,
                        Math.cos(i * Math.PI * 0.4) * 0.27,
                        Math.sin(i * Math.PI * 0.4) * 0.27,
                      ]}
                      size={[2.95, 0.07, 0.07]}
                      color="#3b5560"
                    />
                  ))}
                  {[-1.48, 1.48].map((x) => (
                    <mesh key={x} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]}>
                      <cylinderGeometry args={[0.34, 0.34, 0.065, 12]} />
                      <meshStandardMaterial color={c} />
                    </mesh>
                  ))}
                </group>
                {Array.from({ length: 10 }, (_, i) => (
                  <Box
                    key={i}
                    position={[-1.4 + i * 0.31, -0.12, 0.7]}
                    size={[0.08, 0.08, 0.55]}
                    color="#f5d789"
                  />
                ))}
              </group>
              <Paint
                position={[0.97, 1.82, -0.6]}
                size={[0.24, 0.24, 1.8]}
                rotation={[0.1, 0.18, 0]}
                color={c}
              />
            </>
          )}
          {kind === 'sprayer' && (
            <group ref={tool} scale={[appearance.reach, 1, 1]}>
              <ToolUpgrades kind={kind} upgrades={tiers} />
              <mesh position={[0, 1.25, 0.53]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.56, 0.56, 1.3, 20]} />
                <meshPhysicalMaterial color="#dcf0a6" roughness={0.3} clearcoat={0.8} />
              </mesh>
              {[-0.45, 0.45].map((z) => (
                <mesh key={z} position={[0, 1.25, 0.53 + z]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.57, 0.035, 6, 20]} />
                  <meshStandardMaterial color="#527f39" />
                </mesh>
              ))}
              <Paint position={[0, 1.04, 1.14]} size={[5, 0.11, 0.13]} color="#315a45" />
              {[-2, -1, 0, 1, 2].map((x) => (
                <group key={x}>
                  <Box position={[x, 0.93, 1.14]} size={[0.11, 0.19, 0.11]} color="#ffdb6f" />
                  <Box
                    position={[x / 2, 1.28, 0.8]}
                    size={[0.06, 0.06, 2.1]}
                    rotation={[0, Math.atan2(x, 1), 0]}
                    color="#6b9651"
                  />
                </group>
              ))}
            </group>
          )}
          {kind === 'baler' && (
            <>
              <Paint position={[0, 1.07, 0.68]} size={[1.5, 0.65, 1.02]} color={c} />
              <Paint position={[0, 1.48, 0.7]} size={[1.25, 0.13, 0.9]} color="#f4e0b2" />
              {[-1, 1].map((side) => (
                <group key={side}>
                  <Box
                    position={[side * 0.77, 1.16, 0.6]}
                    size={[0.03, 0.3, 0.55]}
                    color="#49374f"
                  />
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      position={[side * 0.79, 1.06 + i * 0.1, 0.6]}
                      size={[0.02, 0.035, 0.48]}
                      color="#eacb81"
                    />
                  ))}
                </group>
              ))}
              <group ref={upper} position={[0, 1.65, 0.7]}>
                <group ref={tool} scale={[appearance.toolWidth, 1, appearance.reach]}>
                  <ToolUpgrades kind={kind} upgrades={tiers} />
                  <Paint position={[0, 0.15, 0.32]} size={[1.1, 0.8, 1.05]} color={c} />
                  <Paint position={[0, 0.15, 0.9]} size={[1.2, 0.9, 0.18]} color="#f4d886" />
                  <Box position={[0, 0.15, 1]} size={[0.87, 0.56, 0.05]} color="#2a303b" />
                  <Paint position={[0, 0.12, 1.07]} size={[0.64, 0.4, 0.15]} color="#d5ac53" />
                  {[-0.2, 0.2].map((x) => (
                    <Box
                      key={x}
                      position={[x, 0.12, 1.16]}
                      size={[0.025, 0.42, 0.025]}
                      color="#72522d"
                    />
                  ))}
                  <mesh position={[0, -0.38, 0]} castShadow>
                    <cylinderGeometry args={[0.52, 0.52, 0.16, 20]} />
                    <meshStandardMaterial color="#53606a" metalness={0.7} />
                  </mesh>
                </group>
              </group>
              <group ref={reel} position={[0, 0.6, 1.36]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.14, 0.14, 1.45, 16]} />
                  <meshStandardMaterial color="#edc861" />
                </mesh>
                {[0, 1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    position={[
                      0,
                      Math.cos((i * Math.PI) / 2) * 0.22,
                      Math.sin((i * Math.PI) / 2) * 0.22,
                    ]}
                    size={[1.4, 0.06, 0.07]}
                    color="#efe1b0"
                  />
                ))}
              </group>
              <Paint position={[0, 0.42, 1.33]} size={[1.72, 0.14, 0.5]} color={c} />
            </>
          )}
          {kind === 'blower' && (
            <>
              <Paint position={[0, 1.1, 0.65]} size={[1.45, 0.55, 0.9]} color={c} />
              {[-1, 1].map((side) => (
                <Box
                  key={side}
                  position={[side * 0.77, 1.15, 0.65]}
                  size={[0.04, 0.25, 0.6]}
                  color="#eff0cf"
                />
              ))}
              <group ref={upper} position={[0, 1.65, 0.65]}>
                <Paint position={[0, 0, 0]} size={[0.5, 0.4, 0.5]} color="#3e5665" />
                <group ref={tool}>
                  <ToolUpgrades kind={kind} upgrades={tiers} />
                  <mesh position={[0, 0.55, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.82, 0.68, 0.66, 32, 1, true]} />
                    <meshStandardMaterial color={c} side={2} metalness={0.35} roughness={0.3} />
                  </mesh>
                  <mesh position={[0, 0.55, 0.47]} castShadow>
                    <torusGeometry args={[0.8, 0.1, 10, 32]} />
                    <meshStandardMaterial color="#f1dfb5" metalness={0.35} />
                  </mesh>
                  <group ref={reel} position={[0, 0.55, 0.44]}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]}>
                        <Paint
                          position={[0, 0.36, 0]}
                          rotation={[0, 0.25, -0.28]}
                          size={[0.26, 0.62, 0.08]}
                          color="#eceddd"
                        />
                      </group>
                    ))}
                    <mesh>
                      <sphereGeometry args={[0.18, 16, 12]} />
                      <meshStandardMaterial color="#3d5461" metalness={0.8} />
                    </mesh>
                  </group>
                  {[-0.45, 0, 0.45].map((x) => (
                    <Box
                      key={x}
                      position={[x, 0.55, 0.59]}
                      size={[0.025, Math.sqrt(0.64 - x * x) * 2, 0.025]}
                      color="#738d93"
                    />
                  ))}
                  {[-1, 1].map((side) => (
                    <Paint
                      key={side}
                      position={[side * 0.77, 0.1, 0]}
                      rotation={[0, 0, side * 0.2]}
                      size={[0.13, 0.58, 0.22]}
                      color="#546d78"
                    />
                  ))}
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      position={[0.87, 0.7 + i * 0.1, 0.35]}
                      size={[0.3, 0.045, 0.03]}
                      rotation={[0, 0.15, -0.25]}
                      color={i % 2 ? '#f3d681' : '#e9fbf4'}
                    />
                  ))}
                </group>
              </group>
            </>
          )}
          {kind === 'excavator' && (
            <group
              ref={tool}
              position={[0.4, 1.35, 0.3]}
              scale={[appearance.toolWidth, 1, appearance.reach]}
            >
              <ToolUpgrades kind={kind} upgrades={tiers} />
              <Paint
                position={[0, 1.1, 1]}
                size={[0.36, 2.8, 0.36]}
                rotation={[0.7, 0, 0]}
                color={c}
              />
              <Paint
                position={[0, 1.4, 2.55]}
                size={[0.29, 2.5, 0.3]}
                rotation={[-0.75, 0, 0]}
                color="#ed951e"
              />
              <Box
                position={[0.24, 1.2, 1.1]}
                size={[0.08, 1.9, 0.08]}
                rotation={[0.7, 0, 0]}
                color="#c1e0e5"
              />
              <Box
                position={[0.21, 1.7, 2.38]}
                size={[0.08, 1.25, 0.08]}
                rotation={[-0.75, 0, 0]}
                color="#293d45"
              />
              {[
                [0, 2.25, 1.95],
                [0, 0.6, 3.25],
              ].map((pos, i) => (
                <mesh key={i} position={pos as Vec} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.18, 0.18, 0.48, 12]} />
                  <meshStandardMaterial color="#4e6370" metalness={0.5} />
                </mesh>
              ))}
              <Paint
                position={[0, 0.58, 3.25]}
                size={[1, 0.72, 0.85]}
                rotation={[0.2, 0, 0]}
                color="#425361"
              />
              {[-0.35, 0, 0.35].map((x) => (
                <Box key={x} position={[x, 0.29, 3.8]} size={[0.13, 0.17, 0.3]} color="#9aabb4" />
              ))}
            </group>
          )}
          {kind === 'crane' && (
            <group
              ref={tool}
              position={[0, 1.3, 0.5]}
              scale={[appearance.toolWidth, tiers.unique >= 5 ? 1.18 : 1, appearance.reach]}
            >
              <ToolUpgrades kind={kind} upgrades={tiers} />
              <Paint
                position={[0, 2, 1.3]}
                size={[0.45, 5, 0.45]}
                rotation={[0.58, 0, 0]}
                color={c}
              />
              <Paint
                position={[0, 4, 2.7]}
                size={[0.3, 3, 0.3]}
                rotation={[0.58, 0, 0]}
                color="#ffd45a"
              />
              <Box position={[0, 2.9, 3.58]} size={[0.045, 3, 0.045]} color="#243c46" />
              <mesh position={[0, 1.4, 3.58]} rotation={[0, 0, 0.4]} castShadow>
                <torusGeometry args={[0.24, 0.075, 8, 16, Math.PI * 1.4]} />
                <meshStandardMaterial color="#516776" metalness={0.6} />
              </mesh>
              <Paint position={[0, 1, -1.25]} size={[1.4, 0.6, 0.6]} color="#e27624" />
              {[0, 1, 2, 3].map((i) => (
                <Box
                  key={i}
                  position={[0.235, 0.8 + i * 0.35, 0.5 + i * 0.23]}
                  size={[0.025, 0.22, 0.25]}
                  rotation={[0.58, 0, 0]}
                  color="#283e48"
                />
              ))}
            </group>
          )}
        </group>
      </group>
      {preview && (
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[3.5, 64]} />
          <meshStandardMaterial color="#e8d5aa" />
        </mesh>
      )}
    </group>
  );
}
export function Hay({
  x,
  z,
  w = 1.4,
  d = 1,
  h = 0.9,
}: {
  x: number;
  z: number;
  w?: number;
  d?: number;
  h?: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <Box position={[0, h / 2, 0]} size={[w, h, d]} color="#e9b847" surface="hay" />
      {[-0.32, 0.32].map((k) => (
        <Box
          key={k}
          position={[k * w, h / 2 + 0.025, 0]}
          size={[0.05, h + 0.055, d + 0.035]}
          color="#b08231"
        />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <Box
          key={i}
          position={[0, h * (0.12 + i * 0.17), d / 2 + 0.012]}
          size={[w * 0.88, 0.022, 0.016]}
          color={i % 2 ? '#f5d375' : '#d59d3b'}
        />
      ))}
    </group>
  );
}
export function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, -0.85, z]} scale={scale}>
      <Box position={[0, 1.1, 0]} size={[0.32, 2.2, 0.32]} color="#785132" surface="wood" />
      {[
        [-0.3, 2.3, 0, 1.2, '#35794b'],
        [0.55, 2.6, 0.1, 1, '#5c9e42'],
        [0, 3.1, -0.3, 1.05, '#7ab94b'],
      ].map(([px, py, pz, r, c], i) => (
        <mesh key={i} position={[px, py, pz] as Vec} castShadow>
          <icosahedronGeometry args={[r as number, 1]} />
          <meshStandardMaterial color={c as string} flatShading roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
