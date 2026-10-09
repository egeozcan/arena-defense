import { Crosshair, Gauge, Shield, MoveUpRight } from 'lucide-react';
import { VEHICLES, type OwnedVehicle } from '../sim/data';
import { armorLabel, vehicleStats } from '../sim/capabilities';
import { VehicleThumb } from './VehicleThumb';
import { VehiclePreview } from './VehiclePreview';

export function VehicleProfile({ vehicle }: { vehicle: OwnedVehicle }) {
  const v = VEHICLES[vehicle.kind],
    stats = vehicleStats(vehicle);
  return (
    <div className="vehicle-profile">
      <div className="vehicle-profile-art">
        {Object.values(vehicle.upgrades).some((tier) => tier > 0) ? (
          <VehiclePreview vehicle={vehicle} />
        ) : (
          <VehicleThumb kind={vehicle.kind} />
        )}
        <span>{v.tool}</span>
      </div>
      <div className="vehicle-profile-info">
        <span className="profile-eyebrow">
          {v.role} · #{vehicle.id}
        </span>
        <h3>{v.name}</h3>
        <p>
          {armorLabel(vehicle)} · {stats.range} m tool reach
          {vehicle.kind === 'crane' && vehicle.upgrades.unique === 5
            ? ' · Tower travels at half speed'
            : ''}
        </p>
        <div
          className="height-coverage"
          aria-label={`Height coverage ${stats.min} to ${stats.max} meters`}
        >
          <div className="height-coverage-label">
            <span>
              <MoveUpRight size={12} /> HEIGHT COVERAGE
            </span>
            <strong>
              {stats.min}–{stats.max} m
            </strong>
          </div>
          <div className="height-track">
            <span
              style={{
                left: `${(stats.min / 14) * 100}%`,
                width: `${((stats.max - stats.min) / 14) * 100}%`,
              }}
            />
          </div>
          <div className="height-axis">
            <span>GROUND · 0 m</span>
            <span>HIGH · 14 m</span>
          </div>
        </div>
      </div>
      <div className="profile-stats">
        <div>
          <Crosshair size={16} />
          <span>DAMAGE / HIT</span>
          <strong>{stats.damage.toFixed(1)}</strong>
        </div>
        <div>
          <Gauge size={16} />
          <span>MOVE SPEED</span>
          <strong>
            {stats.speed.toFixed(1)} <small>m/s</small>
          </strong>
        </div>
        <div>
          <Shield size={16} />
          <span>TERRAIN GRIP</span>
          <strong>
            {Math.round(stats.traction * 100)}
            <small>%</small>
          </strong>
        </div>
      </div>
    </div>
  );
}
