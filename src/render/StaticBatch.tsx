import { useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Object3D,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type Batchable = MeshStandardMaterial | MeshBasicMaterial | MeshLambertMaterial;

// Material settings other than color, which is baked into vertex colors.
function materialKey(m: Batchable) {
  const lit = m instanceof MeshStandardMaterial;
  const physical = m instanceof MeshPhysicalMaterial;
  return [
    m.type,
    m.map?.uuid,
    m.side,
    m.alphaTest,
    m instanceof MeshBasicMaterial ? '' : m.emissive.getHexString() + m.emissiveIntensity,
    lit ? `${m.roughness},${m.metalness},${m.flatShading}` : '',
    physical ? `${m.clearcoat},${m.clearcoatRoughness}` : '',
  ].join('|');
}

function batchable(material: Mesh['material']): material is Batchable {
  return (
    !Array.isArray(material) &&
    (material instanceof MeshStandardMaterial ||
      material instanceof MeshBasicMaterial ||
      material instanceof MeshLambertMaterial) &&
    !material.transparent &&
    !material.vertexColors &&
    !material.wireframe
  );
}

// Below this world height a slab sits on the floor and its shadow is not visible.
const FLAT = 0.05;

// Merges the static meshes rendered inside it into one mesh per material setup.
// Meshes under an object with userData.dynamic (animated parts), instanced
// meshes and transparent materials are left as they are. `deps` must change
// whenever the rendered children change so the batch is rebuilt.
export function StaticBatch({ children, deps }: { children: ReactNode; deps: readonly unknown[] }) {
  const root = useRef<Group>(null);
  useLayoutEffect(() => {
    const group = root.current;
    if (!group) return;
    group.updateWorldMatrix(true, true);
    const toLocal = new Matrix4().copy(group.matrixWorld).invert();
    const buckets = new Map<
      string,
      { material: Batchable; cast: boolean; receive: boolean; parts: BufferGeometry[] }
    >();
    const hidden: Mesh[] = [];
    const visit = (object: Object3D) => {
      if (object.userData.dynamic || !object.visible) return;
      const material = object instanceof Mesh ? object.material : null;
      if (object instanceof Mesh && !(object instanceof InstancedMesh) && batchable(material)) {
        const source: BufferGeometry = object.geometry;
        const part = source.index ? source.toNonIndexed() : source.clone();
        for (const name of Object.keys(part.attributes))
          if (name !== 'position' && name !== 'normal' && name !== 'uv') part.deleteAttribute(name);
        const count = part.attributes.position.count;
        if (!part.attributes.normal) part.computeVertexNormals();
        if (!part.attributes.uv)
          part.setAttribute('uv', new BufferAttribute(new Float32Array(count * 2), 2));
        part.applyMatrix4(new Matrix4().multiplyMatrices(toLocal, object.matrixWorld));
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) material.color.toArray(colors, i * 3);
        part.setAttribute('color', new BufferAttribute(colors, 3));
        part.computeBoundingBox();
        const box = part.boundingBox!;
        const cast = object.castShadow && box.max.y - box.min.y > FLAT;
        const key = `${materialKey(material)}|${cast}|${object.receiveShadow}`;
        let bucket = buckets.get(key);
        if (!bucket) {
          bucket = { material, cast, receive: object.receiveShadow, parts: [] };
          buckets.set(key, bucket);
        }
        bucket.parts.push(part);
        object.visible = false;
        hidden.push(object);
        return;
      }
      for (const child of object.children) visit(child);
    };
    for (const child of group.children) visit(child);
    const merged: Mesh[] = [];
    for (const bucket of buckets.values()) {
      const geometry = mergeGeometries(bucket.parts);
      for (const part of bucket.parts) part.dispose();
      if (!geometry) continue;
      const material = bucket.material.clone();
      material.vertexColors = true;
      material.color.set(0xffffff);
      const mesh = new Mesh(geometry, material);
      mesh.castShadow = bucket.cast;
      mesh.receiveShadow = bucket.receive;
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
      merged.push(mesh);
    }
    return () => {
      for (const mesh of merged) {
        group.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as Batchable).dispose();
      }
      for (const mesh of hidden) mesh.visible = true;
    };
  }, deps);
  return <group ref={root}>{children}</group>;
}
