import { Object3D } from 'three';

export const TRACK_LINK_COUNT = 32;
export const TRACK_HALF_LENGTH = 0.85;
export const TRACK_RADIUS = 0.34;
export const TRACK_PERIMETER = 4 * TRACK_HALF_LENGTH + 2 * Math.PI * TRACK_RADIUS;

export interface TrackLinkPose {
  y: number;
  z: number;
  tilt: number;
}

// Write into a reusable pose so animating the belt does not allocate per link.
export function trackLinkPose(index: number, travel: number, pose: TrackLinkPose) {
  let t =
    ((((index * TRACK_PERIMETER) / TRACK_LINK_COUNT - travel) % TRACK_PERIMETER) +
      TRACK_PERIMETER) %
    TRACK_PERIMETER;
  pose.y = TRACK_RADIUS;
  pose.z = -TRACK_HALF_LENGTH;
  pose.tilt = 0;
  if (t < 2 * TRACK_HALF_LENGTH) pose.z += t;
  else if ((t -= 2 * TRACK_HALF_LENGTH) < Math.PI * TRACK_RADIUS) {
    const angle = t / TRACK_RADIUS;
    pose.y = TRACK_RADIUS * Math.cos(angle);
    pose.z = TRACK_HALF_LENGTH + TRACK_RADIUS * Math.sin(angle);
    pose.tilt = angle;
  } else if ((t -= Math.PI * TRACK_RADIUS) < 2 * TRACK_HALF_LENGTH) {
    pose.y = -TRACK_RADIUS;
    pose.z = TRACK_HALF_LENGTH - t;
    pose.tilt = Math.PI;
  } else {
    const angle = (t - 2 * TRACK_HALF_LENGTH) / TRACK_RADIUS + Math.PI;
    pose.y = TRACK_RADIUS * Math.cos(angle);
    pose.z = -TRACK_HALF_LENGTH + TRACK_RADIUS * Math.sin(angle);
    pose.tilt = angle;
  }
  return pose;
}

export function wheelDetailMatrices(radius: number, outside: number) {
  const object = new Object3D();
  const treads = Array.from({ length: 32 }, (_, i) => {
    const angle = (Math.floor(i / 2) * Math.PI) / 8;
    const side = i % 2 ? 1 : -1;
    object.position.set(
      Math.cos(angle) * (radius - 0.015),
      side * 0.09,
      -Math.sin(angle) * (radius - 0.015),
    );
    object.rotation.set(0, angle, 0);
    object.rotateX(side * 0.48);
    object.updateMatrix();
    return object.matrix.clone();
  });
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * Math.PI) / 3;
    object.position.set(
      Math.cos(angle) * radius * 0.26,
      outside * 0.252,
      Math.sin(angle) * radius * 0.26,
    );
    object.rotation.set(0, -angle, 0);
    object.updateMatrix();
    return object.matrix.clone();
  });
  const chains = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    object.position.set(Math.cos(angle) * radius, 0, -Math.sin(angle) * radius);
    object.rotation.set(0, angle, 0);
    object.updateMatrix();
    return object.matrix.clone();
  });
  return { treads, spokes, chains };
}
