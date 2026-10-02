import { blocked, clearPosition, grip, type Arena } from './data';
export function findPath(
  arena: Arena,
  sx: number,
  sz: number,
  tx: number,
  tz: number,
  traction: number,
  occupied: Set<number> = new Set(),
  reach = 0,
  radius = 0.45,
): [number, number][] {
  const w = arena.width,
    d = arena.depth,
    start = Math.floor(sz) * w + Math.floor(sx),
    goal = Math.floor(tz) * w + Math.floor(tx);
  const score = new Float64Array(w * d).fill(Infinity),
    parent = new Int32Array(w * d).fill(-1),
    closed = new Uint8Array(w * d);
  const open = [start];
  score[start] = 0;
  const h = (id: number) =>
    reach > 0
      ? Math.max(0, Math.hypot((id % w) + 0.5 - tx, Math.floor(id / w) + 0.5 - tz) - reach)
      : Math.abs((id % w) - (goal % w)) + Math.abs(Math.floor(id / w) - Math.floor(goal / w));
  let closest = start;
  let reached = -1;
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++)
      if (score[open[i]] + h(open[i]) < score[open[bi]] + h(open[bi])) bi = i;
    const id = open.splice(bi, 1)[0];
    if (closed[id]) continue;
    closed[id] = 1;
    if (h(id) < h(closest)) closest = id;
    if (reach > 0 ? h(id) === 0 : id === goal) {
      reached = id;
      break;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = (id % w) + dx,
        z = Math.floor(id / w) + dz,
        n = z * w + x;
      if (
        (radius === 0.45
          ? blocked(arena, x, z)
          : !clearPosition(arena, x + 0.5, z + 0.5, radius)) ||
        closed[n] ||
        occupied.has(n)
      )
        continue;
      const cost = score[id] + 1 / Math.min(1, grip(arena, x, z) + 0.5 * traction);
      if (cost < score[n]) {
        score[n] = cost;
        parent[n] = id;
        open.push(n);
      }
    }
  }
  const result: [number, number][] = [];
  // The vehicle may be near a cell edge while that cell's center is in tool range.
  if (reached === start && reach > 0 && Math.hypot(sx - tx, sz - tz) > reach)
    return [[(start % w) + 0.5, Math.floor(start / w) + 0.5]];
  let id = reached >= 0 ? reached : closest;
  while (id !== start && id >= 0) {
    result.unshift([(id % w) + 0.5, Math.floor(id / w) + 0.5]);
    id = parent[id];
  }
  return result;
}
// One terrain-weighted distance field serves every candidate in a selection pass.
export function pathCosts(
  arena: Arena,
  sx: number,
  sz: number,
  traction: number,
  radius = 0.45,
): Float64Array {
  const w = arena.width,
    dist = new Float64Array(w * arena.depth).fill(Infinity),
    heap: [number, number][] = [];
  const start = Math.floor(sz) * w + Math.floor(sx);
  dist[start] = 0;
  function push(id: number, cost: number) {
    heap.push([id, cost]);
    let i = heap.length - 1;
    while (i) {
      const p = (i - 1) >> 1;
      if (heap[p][1] <= heap[i][1]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  }
  function pop() {
    const root = heap[0],
      last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1,
          r = l + 1;
        let j = i;
        if (l < heap.length && heap[l][1] < heap[j][1]) j = l;
        if (r < heap.length && heap[r][1] < heap[j][1]) j = r;
        if (j === i) break;
        [heap[i], heap[j]] = [heap[j], heap[i]];
        i = j;
      }
    }
    return root;
  }
  push(start, 0);
  while (heap.length) {
    const [id, cost] = pop();
    if (cost > dist[id]) continue;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = (id % w) + dx,
        z = Math.floor(id / w) + dz,
        n = z * w + x;
      if (radius === 0.45 ? blocked(arena, x, z) : !clearPosition(arena, x + 0.5, z + 0.5, radius))
        continue;
      const next = cost + 1 / Math.min(1, grip(arena, x, z) + 0.5 * traction);
      if (next < dist[n]) {
        dist[n] = next;
        push(n, next);
      }
    }
  }
  return dist;
}
