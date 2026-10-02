import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { Bounds } from '@react-three/drei';
import type { WebGLRenderer } from 'three';
import { VehicleModel } from '../src/render/models';
import { PATHS, VEHICLES, type VehicleKind, type PathName } from '../src/sim/data';
import { STOCK_UPGRADES, type VehicleUpgrades } from '../src/render/vehicle-appearance';

function bakeIcon(renderer: WebGLRenderer | null) {
  if (!renderer) return '';
  const source = renderer.domElement;
  const copy = document.createElement('canvas');
  copy.width = source.width;
  copy.height = source.height;
  const ctx = copy.getContext('2d')!;
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
  let left = copy.width,
    top = copy.height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < copy.height; y++) {
    for (let x = 0; x < copy.width; x++) {
      if (pixels[(y * copy.width + x) * 4 + 3] > 0) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left) return '';
  // Fit the visible silhouette, so long tools do not leave oversized empty margins.
  const output = document.createElement('canvas');
  output.width = 768;
  output.height = 640;
  const width = right - left + 1,
    height = bottom - top + 1;
  const scale = Math.min((output.width - 48) / width, (output.height - 48) / height);
  output
    .getContext('2d')!
    .drawImage(
      copy,
      left,
      top,
      width,
      height,
      (output.width - width * scale) / 2,
      (output.height - height * scale) / 2,
      width * scale,
      height * scale,
    );
  return output.toDataURL('image/png');
}

// Development-only asset studio: the game displays baked images, not extra WebGL canvases.
function IconPreview({ kind, upgrades }: { kind: VehicleKind; upgrades: VehicleUpgrades }) {
  const renderer = useRef<WebGLRenderer | null>(null);
  const [png, setPng] = useState('');
  return (
    <article>
      <h2>{VEHICLES[kind].short}</h2>
      <div className="preview">
        <Canvas
          shadows
          orthographic
          dpr={2}
          camera={{ position: [10, 8, 12], zoom: 35, near: 0.1, far: 100 }}
          gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
          onCreated={({ gl }) => {
            renderer.current = gl;
            gl.setClearColor(0x000000, 0);
          }}
        >
          <ambientLight intensity={1.15} />
          <hemisphereLight args={['#e3f4ff', '#8d7657', 1.4]} />
          <directionalLight
            position={[-5, 10, 8]}
            intensity={3.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={10}
            shadow-camera-bottom={-8}
            shadow-normalBias={0.035}
          />
          <directionalLight position={[6, 4, -5]} intensity={1} color="#c9eaff" />
          <Bounds key={JSON.stringify(upgrades)} fit clip margin={1.16} maxDuration={0}>
            <VehicleModel kind={kind} upgrades={upgrades} />
          </Bounds>
        </Canvas>
      </div>
      <button onClick={() => setPng(bakeIcon(renderer.current))}>
        Bake {VEHICLES[kind].short}
      </button>
      {png && (
        <a href={png} download={`${kind}.png`}>
          Save {VEHICLES[kind].short} PNG
        </a>
      )}
    </article>
  );
}

function Studio() {
  const [path, setPath] = useState<PathName>('unique');
  const [tier, setTier] = useState(0);
  const [secondary, setSecondary] = useState<PathName>('speed');
  const [secondaryTier, setSecondaryTier] = useState(0);
  const upgrades = {
    ...STOCK_UPGRADES,
    [path]: tier,
    ...(secondary !== path ? { [secondary]: secondaryTier } : {}),
  };
  return (
    <>
      <div className="controls">
        <label>
          Primary path{' '}
          <select
            aria-label="Primary path"
            value={path}
            onChange={(e) => setPath(e.target.value as PathName)}
          >
            {PATHS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Primary tier{' '}
          <select
            aria-label="Primary tier"
            value={tier}
            onChange={(e) => setTier(Number(e.target.value))}
          >
            {[0, 1, 2, 3, 4, 5].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Secondary path{' '}
          <select
            aria-label="Secondary path"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value as PathName)}
          >
            {PATHS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Secondary tier{' '}
          <select
            aria-label="Secondary tier"
            value={secondaryTier}
            onChange={(e) => setSecondaryTier(Number(e.target.value))}
          >
            {[0, 1, 2].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <main>
        {(Object.keys(VEHICLES) as VehicleKind[]).map((kind) => (
          <IconPreview key={kind} kind={kind} upgrades={upgrades} />
        ))}
      </main>
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Studio />);
