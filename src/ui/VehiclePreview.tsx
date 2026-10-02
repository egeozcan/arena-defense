import { Canvas } from '@react-three/fiber';
import { Bounds } from '@react-three/drei';
import type { OwnedVehicle } from '../sim/data';
import { VehicleModel } from '../render/models';

export function VehiclePreview({ vehicle }: { vehicle: OwnedVehicle }) {
  return (
    <div className="vehicle-preview" role="img" aria-label={`Upgraded ${vehicle.kind}`}>
      <Canvas
        orthographic
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [10, 8, 12], zoom: 30 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.3} />
        <hemisphereLight args={['#e3f4ff', '#8d7657', 1.4]} />
        <directionalLight position={[-5, 10, 8]} intensity={3.2} />
        <directionalLight position={[6, 4, -5]} intensity={1} color="#c9eaff" />
        <Bounds
          key={`${vehicle.id}-${Object.values(vehicle.upgrades).join('-')}`}
          fit
          clip
          margin={1.15}
          maxDuration={0}
        >
          <VehicleModel kind={vehicle.kind} upgrades={vehicle.upgrades} />
        </Bounds>
      </Canvas>
    </div>
  );
}
