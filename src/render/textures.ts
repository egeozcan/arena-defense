import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { Random } from '../sim/data';

type Surface = 'soil' | 'wood' | 'hay' | 'grass' | 'concrete';
const cache = new Map<Surface, CanvasTexture>();
// Seeded, seamless material detail generated locally; no asset downloads.
export function surfaceTexture(surface: Surface) {
  const cached = cache.get(surface);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const rng = new Random(219 + surface.length * 97);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3500; i++) {
    const x = rng.next() * 256,
      y = rng.next() * 256;
    ctx.fillStyle = `rgba(45,35,22,${0.025 + rng.next() * 0.075})`;
    const elongated = surface === 'wood' || surface === 'hay';
    ctx.fillRect(
      x,
      y,
      elongated ? 8 + rng.next() * 30 : 1 + rng.next() * 3,
      elongated ? 0.5 : 1 + rng.next() * 2,
    );
  }
  if (surface === 'wood') {
    for (let y = 0; y < 256; y += 32) {
      ctx.fillStyle = '#7c705c';
      ctx.fillRect(0, y, 256, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, y + 1, 256, 1);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(
    surface === 'soil' || surface === 'grass' ? 8 : surface === 'concrete' ? 4 : 1,
    surface === 'soil' || surface === 'grass' ? 6 : 1,
  );
  texture.colorSpace = SRGBColorSpace;
  cache.set(surface, texture);
  return texture;
}
