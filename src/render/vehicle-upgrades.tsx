import type { VehicleKind } from '../sim/data';
import { Box, Paint, type Vec } from './vehicle-parts';
import { UPGRADE_COLORS, type VehicleUpgrades } from './vehicle-appearance';

function Cylinder({
  position,
  radius,
  length,
  color,
  rotation = [0, 0, 0],
}: {
  position: Vec;
  radius: number;
  length: number;
  color: string;
  rotation?: Vec;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, 12]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
    </mesh>
  );
}
function Ring({
  position,
  radius,
  color,
  rotation = [0, 0, 0],
}: {
  position: Vec;
  radius: number;
  color: string;
  rotation?: Vec;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <torusGeometry args={[radius, 0.065, 6, 20]} />
      <meshStandardMaterial color={color} metalness={0.55} roughness={0.3} />
    </mesh>
  );
}

// Each path owns a separate mounting zone: engine at the rear, traction on
// the undercarriage, attack at the tool, and specialist inside the tool assembly.
export function ChassisUpgrades({
  kind,
  upgrades: u,
}: {
  kind: VehicleKind;
  upgrades: VehicleUpgrades;
}) {
  const speed = UPGRADE_COLORS.speed;
  const cabX = kind === 'excavator' ? -0.35 : 0;
  return (
    <>
      {kind === 'harvester' && u.unique >= 3 && (
        <group name="specialist-rear-header" position={[0, 0.62, -1.55]}>
          <Paint size={[2.5, 0.25, 0.55]} color="#56cadd" />
          {[-1, -0.5, 0, 0.5, 1].map((x) => (
            <Box key={x} position={[x, -0.08, -0.42]} size={[0.12, 0.16, 0.45]} color="#e5f2ec" />
          ))}
        </group>
      )}

      {u.speed >= 1 && (
        <group name="speed-intake">
          <Paint position={[0, 1.55, -1.04]} size={[0.72, 0.3, 0.44]} color={speed} />
          <Box position={[0, 1.6, -1.27]} size={[0.57, 0.15, 0.035]} color="#23313a" />
        </group>
      )}
      {u.speed >= 2 && (
        <group name="speed-twin-exhaust">
          {[-1, 1].map((side) => (
            <group key={side}>
              <Cylinder
                position={[side * 0.61, 1.68, -1.04]}
                radius={0.105}
                length={0.85}
                color="#c5d3da"
              />
              <Cylinder
                position={[side * 0.61, 2.12, -1.04]}
                radius={0.14}
                length={0.12}
                color={speed}
              />
            </group>
          ))}
        </group>
      )}
      {u.speed >= 3 && (
        <group name="speed-turbo">
          <Cylinder
            position={[0, 1.94, -1.09]}
            radius={0.29}
            length={0.3}
            color={speed}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <Ring position={[0, 1.94, -1.26]} radius={0.2} color="#e6f4f8" />
          <Box position={[0, 1.94, -1.28]} size={[0.06, 0.35, 0.03]} color="#23313a" />
        </group>
      )}
      {u.speed >= 4 && (
        <group name="speed-overdrive-spoiler">
          {[-0.58, 0.58].map((x) => (
            <Box key={x} position={[x, 2.2, -1.06]} size={[0.09, 0.55, 0.12]} color="#304553" />
          ))}
          <Paint position={[0, 2.47, -1.07]} size={[1.8, 0.14, 0.42]} color={speed} />
        </group>
      )}
      {u.speed >= 5 && (
        <group name="speed-overdrive-cores">
          {[-1, 1].map((side) => (
            <group key={side}>
              <Paint
                position={[side * 0.65, 1.28, -0.66]}
                size={[0.36, 0.42, 0.72]}
                color="#263d53"
              />
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  position={[side * 0.84, 1.27, -0.9 + i * 0.22]}
                  size={[0.045, 0.3, 0.08]}
                  color={speed}
                />
              ))}
            </group>
          ))}
        </group>
      )}
      {u.attack >= 3 && (
        <group name="attack-cab-armor">
          {[-1, 1].map((side) => (
            <Paint
              key={side}
              position={[cabX + side * (kind === 'excavator' ? 0.46 : 0.61), 1.48, -0.5]}
              size={[0.08, 0.25, 0.84]}
              color={UPGRADE_COLORS.attack}
            />
          ))}
        </group>
      )}
      {u.attack >= 4 && (
        <group name="attack-roof-armor">
          <Paint
            position={[cabX, 2.3, -0.4]}
            size={[kind === 'excavator' ? 1.03 : 1.44, 0.12, 0.48]}
            color={UPGRADE_COLORS.attack}
          />
        </group>
      )}
    </>
  );
}

export function TractionUpgrades({ kind, tier }: { kind: VehicleKind; tier: number }) {
  const color = UPGRADE_COLORS.traction;
  const farm = kind !== 'excavator' && kind !== 'crane';
  return (
    <>
      {tier >= 1 && (
        <group name="traction-wheel-guards">
          {[-1, 1].map((side) => (
            <Paint
              key={side}
              position={[side * 0.98, farm ? 1.23 + tier * 0.04 : 0.82, -0.27]}
              size={[0.32, 0.16, 1.5]}
              color={color}
            />
          ))}
        </group>
      )}
      {tier >= 2 && (
        <group name="traction-axle-braces">
          {[-1, 1].map((side) => (
            <Paint
              key={side}
              position={[side * 0.8, farm ? 0.9 : 0.85, -0.18]}
              size={[0.16, 0.22, 0.7]}
              color={color}
            />
          ))}
        </group>
      )}
      {tier >= 3 && (
        <group name="traction-mud-plow">
          <Paint
            position={[0, 0.43, 1.16]}
            size={[2.15, 0.38, 0.2]}
            rotation={[0.18, 0, 0]}
            color={color}
          />
          {[-0.8, 0, 0.8].map((x) => (
            <Box key={x} position={[x, 0.33, 1.28]} size={[0.17, 0.3, 0.14]} color="#dbe4ce" />
          ))}
        </group>
      )}
      {tier >= 4 && (
        <group name="traction-recovery-winch">
          <Paint position={[0, 0.81, -1.25]} size={[0.9, 0.32, 0.33]} color={color} />
          <Cylinder
            position={[0, 0.84, -1.43]}
            radius={0.13}
            length={0.56}
            color="#e8e3c8"
            rotation={[0, 0, Math.PI / 2]}
          />
        </group>
      )}
      {tier >= 5 && (
        <group name="traction-all-terrain-cage">
          {[-1, 1].map((side) => (
            <group key={side}>
              <Box position={[side * 0.88, 1.06, -0.45]} size={[0.14, 0.65, 0.16]} color={color} />
              <Paint position={[side * 0.91, 1.37, -0.28]} size={[0.19, 0.14, 1.7]} color={color} />
            </group>
          ))}
        </group>
      )}
    </>
  );
}

export function ToolUpgrades({
  kind,
  upgrades: u,
}: {
  kind: VehicleKind;
  upgrades: VehicleUpgrades;
}) {
  const attack = UPGRADE_COLORS.attack,
    special = UPGRADE_COLORS.unique;
  const cutter = kind === 'harvester',
    spray = kind === 'sprayer',
    crane = kind === 'crane';
  // Tool-local mounting points follow the existing boom recoil and slewing.
  if (kind === 'baler' || kind === 'blower')
    return (
      <>
        {[1, 2, 3, 4, 5]
          .filter((tier) => u.attack >= tier)
          .map((tier) => (
            <group key={tier} name={`attack-tool-stage-${tier}`}>
              <Paint
                position={[0, 0.35 + tier * 0.18, 0.3]}
                size={[0.85 + tier * 0.08, 0.12, 0.2]}
                color={attack}
              />
              {[-1, 1].map((side) => (
                <Box
                  key={side}
                  position={[side * (0.45 + tier * 0.03), 0.35 + tier * 0.18, 0.45]}
                  size={[0.1, 0.18, 0.3]}
                  color={attack}
                />
              ))}
            </group>
          ))}
        {[1, 2, 3, 4, 5]
          .filter((tier) => u.unique >= tier)
          .map((tier) => (
            <group key={tier} name={`specialist-${kind}-stage-${tier}`}>
              <Ring
                position={[0, 0.3, 0.15 + tier * 0.16]}
                radius={kind === 'blower' ? 0.76 + tier * 0.04 : 0.5 + tier * 0.025}
                color={special}
              />
              <Cylinder
                position={[0.66, -0.3 + tier * 0.18, -0.35]}
                radius={0.09}
                length={0.4}
                color={special}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
          ))}
      </>
    );
  const head: Vec = cutter
    ? [0, 0, 0.6]
    : spray
      ? [0, 1.04, 1.14]
      : kind === 'excavator'
        ? [0, 0.58, 3.25]
        : [0, 1.4, 3.58];
  return (
    <>
      <group position={head}>
        {u.attack >= 1 && (
          <group name="attack-reinforced-edge">
            {crane ? (
              <Ring position={[0, 0, 0]} radius={0.34} color={attack} />
            ) : (
              <Paint
                position={[0, cutter ? -0.13 : -0.22, 0.1]}
                size={[cutter ? 3.1 : spray ? 3.8 : 1.1, 0.13, 0.23]}
                color={attack}
              />
            )}
          </group>
        )}
        {u.attack >= 2 && (
          <group name="attack-tool-drive">
            {crane ? (
              <Cylinder position={[0, 0.75, 0]} radius={0.2} length={0.3} color={attack} />
            ) : (
              [-1, 1].map((side) => (
                <Cylinder
                  key={side}
                  position={[side * (cutter ? 1.64 : spray ? 1.7 : 0.5), 0.12, -0.06]}
                  radius={0.21}
                  length={0.22}
                  color={attack}
                  rotation={[0, 0, Math.PI / 2]}
                />
              ))
            )}
          </group>
        )}
        {u.attack >= 3 && (
          <group name="attack-piercing-teeth">
            {crane ? (
              <Box
                position={[0, -0.42, 0]}
                size={[0.18, 0.7, 0.18]}
                rotation={[0, 0, 0.2]}
                color="#e6eef2"
              />
            ) : spray ? (
              Array.from({ length: 8 }, (_, i) => (
                <Cylinder
                  key={i}
                  position={[(i - 3.5) * 0.56, -0.18, 0.18]}
                  radius={0.09}
                  length={0.38}
                  rotation={[Math.PI / 2, 0, 0]}
                  color="#e6eef2"
                />
              ))
            ) : (
              Array.from({ length: cutter ? 8 : 4 }, (_, i) => (
                <Box
                  key={i}
                  position={[
                    (i - (cutter || spray ? 3.5 : 1.5)) * (cutter || spray ? 0.4 : 0.3),
                    -0.2,
                    0.36,
                  ]}
                  size={[0.13, 0.2, 0.36]}
                  color="#e6eef2"
                  rotation={[0.2, 0, 0]}
                />
              ))
            )}
          </group>
        )}
        {u.attack >= 4 && (
          <group name="attack-heavy-housing">
            {crane && <Box position={[0, 0.2, 0]} size={[1.5, 0.14, 0.16]} color={attack} />}
            {[-1, 1].map((side) => (
              <Paint
                key={side}
                position={[side * (cutter ? 1.7 : spray ? 2.1 : 0.65), 0.04, 0]}
                size={[0.24, 0.6, 0.64]}
                color={attack}
              />
            ))}
          </group>
        )}
        {u.attack >= 5 && (
          <group name="attack-signature-tool">
            {crane ? (
              <group name="attack-twin-hooks">
                <Cylinder position={[0, 0.35, 0]} radius={0.38} length={0.35} color="#352b3d" />
                <Box position={[0, 0.35, 0]} size={[1.15, 0.2, 0.25]} color={attack} />
                {[-1, 1].map((side) => (
                  <group key={side} position={[side * 0.45, 0, 0]}>
                    <Box position={[0, 0.18, 0]} size={[0.07, 0.5, 0.07]} color="#304553" />
                    <Paint
                      position={[0, -0.13, 0.18]}
                      size={[0.2, 0.6, 0.2]}
                      rotation={[0.3, 0, 0]}
                      color={attack}
                    />
                    <Box position={[0, -0.48, 0.18]} size={[0.18, 0.18, 0.38]} color="#e6eef2" />
                  </group>
                ))}
              </group>
            ) : spray ? (
              [-1, 1].map((side) => (
                <group key={side}>
                  <Cylinder
                    position={[side * 1.4, 0.35, 0.22]}
                    radius={0.3}
                    length={0.65}
                    rotation={[Math.PI / 2, 0, 0]}
                    color={attack}
                  />
                  <Cylinder
                    position={[side * 1.4, 0.35, 0.56]}
                    radius={0.23}
                    length={0.025}
                    rotation={[Math.PI / 2, 0, 0]}
                    color="#253343"
                  />
                  <Ring position={[side * 1.4, 0.35, 0.58]} radius={0.24} color="#e6eef2" />
                </group>
              ))
            ) : (
              <>
                <Paint
                  position={[0, 0.15, 0.35]}
                  size={[cutter ? 3.8 : 1.7, 0.32, 0.36]}
                  color="#352b3d"
                />
                {[-1, 1].map((side) => (
                  <Box
                    key={side}
                    position={[side * (cutter ? 1.82 : 0.77), 0.2, 0.55]}
                    size={[0.2, 0.65, 0.35]}
                    color={attack}
                    rotation={[0, 0, side * 0.3]}
                  />
                ))}
              </>
            )}
          </group>
        )}
      </group>
      {cutter && (
        <>
          {u.unique >= 1 && (
            <group name="specialist-header-extensions">
              {[-1, 1].map((side) => (
                <Paint
                  key={side}
                  position={[side * 1.78, 0, 0]}
                  size={[0.4, 0.3, 0.7]}
                  color={special}
                />
              ))}
            </group>
          )}
          {u.unique >= 2 && (
            <group name="specialist-header-lift">
              {[-1.12, 1.12].map((x) => (
                <Box
                  key={x}
                  position={[x, 0.52, -0.3]}
                  size={[0.1, 1, 0.12]}
                  color={special}
                  rotation={[0.25, 0, 0]}
                />
              ))}
            </group>
          )}
          {u.unique >= 4 && (
            <group name="specialist-high-cutter">
              <Paint position={[0, 1.3, 0]} size={[3.6, 0.18, 0.3]} color={special} />
              {[-1.6, -0.8, 0, 0.8, 1.6].map((x) => (
                <Box key={x} position={[x, 1.3, 0.3]} size={[0.16, 0.16, 0.42]} color="#eaf9ff" />
              ))}
            </group>
          )}
          {u.unique >= 5 && (
            <group name="specialist-thresher-turbines">
              {[-0.9, 0.9].map((x) => (
                <group key={x}>
                  <Cylinder
                    position={[x, 0.65, 0.35]}
                    radius={0.43}
                    length={0.32}
                    color="#254652"
                    rotation={[Math.PI / 2, 0, 0]}
                  />
                  <Ring position={[x, 0.65, 0.53]} radius={0.34} color={special} />
                  <Box position={[x, 0.65, 0.55]} size={[0.55, 0.1, 0.03]} color={special} />
                </group>
              ))}
            </group>
          )}
        </>
      )}
      {spray && (
        <>
          {u.unique >= 1 && (
            <group name="specialist-pressure-pump">
              <Paint position={[0, 1.75, 0.65]} size={[0.55, 0.32, 0.48]} color={special} />
            </group>
          )}
          {u.unique >= 2 && (
            <group name="specialist-fan-nozzles">
              {[-1, 1].map((side) => (
                <Paint
                  key={side}
                  position={[side * 2.42, 1.03, 1.17]}
                  size={[0.4, 0.25, 0.35]}
                  rotation={[0, side * 0.4, 0]}
                  color={special}
                />
              ))}
            </group>
          )}
          {u.unique >= 3 && (
            <group name="specialist-sticky-reservoirs">
              {[-0.68, 0.68].map((x) => (
                <Cylinder
                  key={x}
                  position={[x, 1.54, 0.45]}
                  radius={0.19}
                  length={0.65}
                  color={special}
                />
              ))}
            </group>
          )}
          {u.unique >= 4 && (
            <group name="specialist-acid-canister">
              <Cylinder position={[0, 2.15, 0.65]} radius={0.3} length={0.55} color="#caff57" />
              <Ring
                position={[0, 2.15, 0.65]}
                radius={0.31}
                color="#304f45"
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
          )}
          {u.unique >= 5 && (
            <group name="specialist-radial-fog-cannon">
              <Cylinder position={[0, 2.56, 0.65]} radius={0.26} length={0.4} color={special} />
              {Array.from({ length: 8 }, (_, i) => (
                <group key={i} position={[0, 2.7, 0.65]} rotation={[0, (i * Math.PI) / 4, 0]}>
                  <Cylinder
                    position={[0, 0, 0.44]}
                    radius={0.14}
                    length={0.55}
                    rotation={[Math.PI / 2, 0, 0]}
                    color={special}
                  />
                </group>
              ))}
            </group>
          )}
        </>
      )}
      {kind === 'excavator' && (
        <>
          {u.unique >= 1 && (
            <group name="specialist-boom-extension">
              <Paint
                position={[0, 1.7, 2.5]}
                size={[0.42, 0.6, 0.44]}
                rotation={[-0.75, 0, 0]}
                color={special}
              />
            </group>
          )}
          {u.unique >= 2 && (
            <group name="specialist-wide-bucket">
              {[-0.65, 0.65].map((x) => (
                <Paint
                  key={x}
                  position={[x, 0.58, 3.25]}
                  size={[0.32, 0.8, 0.95]}
                  color={special}
                />
              ))}
            </group>
          )}
          {u.unique >= 3 && (
            <group name="specialist-dual-hydraulics">
              {[-0.32, 0.32].map((x) => (
                <Cylinder
                  key={x}
                  position={[x, 1.1, 1.03]}
                  radius={0.12}
                  length={2.05}
                  rotation={[0.7, 0, 0]}
                  color={special}
                />
              ))}
            </group>
          )}
          {u.unique >= 4 && (
            <group name="specialist-slam-hammer">
              <Cylinder position={[0, 0.9, 3.05]} radius={0.34} length={0.9} color={special} />
              <Paint position={[0, 0.35, 3.04]} size={[1.15, 0.2, 0.6]} color="#dae5ef" />
            </group>
          )}
          {u.unique >= 5 && (
            <group name="specialist-demolisher-jaws">
              {[-1, 1].map((side) => (
                <Paint
                  key={side}
                  position={[side * 0.62, 0.65, 3.85]}
                  size={[0.28, 0.9, 0.75]}
                  rotation={[0, 0, side * -0.3]}
                  color={special}
                />
              ))}
            </group>
          )}
        </>
      )}
      {kind === 'crane' && (
        <>
          {u.unique >= 1 && (
            <group name="specialist-telescopic-boom">
              <Paint
                position={[0, 4.65, 3.12]}
                size={[0.4, 0.65, 0.4]}
                rotation={[0.58, 0, 0]}
                color={special}
              />
            </group>
          )}
          {u.unique >= 2 && (
            <group name="specialist-fast-winch">
              <Cylinder
                position={[0, 1.75, -0.8]}
                radius={0.38}
                length={0.95}
                color={special}
                rotation={[0, 0, Math.PI / 2]}
              />
            </group>
          )}
          {u.unique >= 3 && (
            <group name="specialist-wrecking-ball">
              <mesh position={[0, 1.4, 3.58]} castShadow>
                <icosahedronGeometry args={[0.58, 1]} />
                <meshStandardMaterial color="#455565" metalness={0.7} roughness={0.4} />
              </mesh>
              <Ring
                position={[0, 1.4, 3.58]}
                radius={0.59}
                color={special}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
          )}
          {u.unique >= 4 && (
            <group name="specialist-carrier-magnet">
              {[-1, 1].map((side) => (
                <Paint
                  key={side}
                  position={[side * 0.42, 0.94, 3.58]}
                  size={[0.23, 0.55, 0.38]}
                  color={special}
                />
              ))}
              <Box position={[0, 1.18, 3.58]} size={[1.05, 0.18, 0.38]} color={special} />
            </group>
          )}
          {u.unique >= 5 && (
            <group name="specialist-tower-jib">
              <Paint position={[0, 5.25, 2.82]} size={[0.6, 0.3, 3.8]} color={special} />
              <Box position={[0, 6, 2.82]} size={[0.12, 0.12, 3.8]} color={special} />
              {[-1.6, -0.8, 0, 0.8, 1.6].map((z) => (
                <Box
                  key={z}
                  position={[0, 5.65, 2.82 + z]}
                  size={[0.12, 0.7, 0.12]}
                  rotation={[0.5, 0, 0]}
                  color="#deebf1"
                />
              ))}
              <Box position={[0, 3.5, 4.65]} size={[0.07, 3.3, 0.07]} color="#304553" />
              <Ring position={[0, 1.9, 4.65]} radius={0.3} color={special} />
            </group>
          )}
        </>
      )}
    </>
  );
}
