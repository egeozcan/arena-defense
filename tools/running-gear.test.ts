import assert from 'node:assert/strict';
import test from 'node:test';
import { Matrix4, Object3D, Vector3 } from 'three';
import {
  TRACK_LINK_COUNT,
  TRACK_PERIMETER,
  trackLinkPose,
  wheelDetailMatrices,
} from '../src/render/running-gear';

const near = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} should equal ${expected}`);

test('instanced wheel treads preserve the nested group and lug transforms', () => {
  for (const radius of [0.43, 0.58, 0.696]) {
    const detail = wheelDetailMatrices(radius, 1);
    assert.equal(detail.treads.length, 32);
    assert.equal(detail.spokes.length, 6);
    assert.equal(detail.chains.length, 8);
    for (let i = 0; i < detail.treads.length; i++) {
      const angle = (Math.floor(i / 2) * Math.PI) / 8;
      const side = i % 2 ? 1 : -1;
      const lug = new Object3D();
      lug.position.set(radius - 0.015, side * 0.09, 0);
      lug.rotation.set(side * 0.48, 0, 0);
      lug.updateMatrix();
      const original = new Matrix4().makeRotationY(angle).multiply(lug.matrix);
      original.elements.forEach((n, index) => near(detail.treads[i].elements[index], n));
    }
    for (const outside of [-1, 1]) {
      for (const spoke of wheelDetailMatrices(radius, outside).spokes) {
        const position = new Vector3().setFromMatrixPosition(spoke);
        near(position.y, outside * 0.252);
        near(Math.hypot(position.x, position.z), radius * 0.26);
      }
    }
  }
});

test('track animation wraps in both directions and keeps every link in its culling envelope', () => {
  const pose = { y: 0, z: 0, tilt: 0 };
  for (const travel of [-100, -2.7, 0, 0.2, 100]) {
    for (let i = 0; i < TRACK_LINK_COUNT; i++) {
      const original = { ...trackLinkPose(i, travel, pose) };
      const wrapped = trackLinkPose(i, travel + TRACK_PERIMETER, pose);
      near(wrapped.y, original.y);
      near(wrapped.z, original.z);
      near(wrapped.tilt, original.tilt);
      // Include the widest cleat's local half-extents and offset.
      assert.ok(
        Math.hypot(Math.hypot(original.y, original.z) + 0.045 + Math.hypot(0.0275, 0.0225), 0.335) <
          1.5,
      );
    }
  }
});
