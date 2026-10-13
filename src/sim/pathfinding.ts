import { blocked, clearPosition, grip, type OwnedVehicle, type Arena } from './data';
import { hayContacts, hayHandling, hayRouteCost, touchesHay } from './hay';

const NEIGHBOR_X = [1, -1, 0, 0],
  NEIGHBOR_Z = [0, 0, 1, -1];

// Cache cell clearance and terrain costs within a search. Exact push validation
// is needed only at hay contact cells; open floor keeps the cheap grid query.
function routeProbe(arena: Arena, traction: number, radius: number, vehicle?: OwnedVehicle) {
  const loose = arena.obstacles.filter((o) => o.loose);
  const fixed = loose.length
    ? { ...arena, obstacles: arena.obstacles.filter((o) => !o.loose) }
    : arena;
  const cells = new Int8Array(arena.width * arena.depth);
  const costs = new Float64Array(cells.length);
  const handling = vehicle && hayHandling(vehicle);
  return {
    clear(sx: number, sz: number, x: number, z: number) {
      if (x < 0.5 || z < 0.5 || x >= arena.width || z >= arena.depth) return false;
      const id = Math.floor(z) * arena.width + Math.floor(x);
      if (!cells[id]) {
        const safe =
          radius === 0.45 ? !blocked(fixed, x - 0.5, z - 0.5) : clearPosition(fixed, x, z, radius);
        cells[id] = !safe ? -1 : loose.some((o) => touchesHay(o, x, z, radius)) ? 2 : 1;
      }
      if (cells[id] === -1) return false;
      if (cells[id] === 1) return true;
      if (!vehicle || handling?.mode === 'detour') return false;
      if (handling?.mode === 'crush') return true;
      return (
        hayContacts(arena, { id: vehicle.id, x: sx, z: sz, radius, vehicle }, x, z, []) !== null
      );
    },
    cost(x: number, z: number) {
      const id = z * arena.width + x;
      if (!costs[id])
        costs[id] = vehicle
          ? hayRouteCost(arena, vehicle, x + 0.5, z + 0.5, radius)
          : 1 / Math.min(1, grip(arena, x, z) + 0.5 * traction);
      return costs[id];
    },
  };
}

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
  firingPosition?: (x: number, z: number) => boolean,
  vehicle?: OwnedVehicle,
): [number, number][] {
  const probe = routeProbe(arena, traction, radius, vehicle);
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
    if (
      (reach > 0 ? h(id) === 0 : id === goal) &&
      (!firingPosition || firingPosition((id % w) + 0.5, Math.floor(id / w) + 0.5))
    ) {
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
        !probe.clear((id % w) + 0.5, Math.floor(id / w) + 0.5, x + 0.5, z + 0.5) ||
        closed[n] ||
        occupied.has(n)
      )
        continue;
      const cost = score[id] + probe.cost(x, z);
      if (cost < score[n]) {
        score[n] = cost;
        parent[n] = id;
        open.push(n);
      }
    }
  }
  const result: [number, number][] = [];
  // The vehicle may be near a cell edge while that cell's center is in tool range.
  if (
    reached === start &&
    reach > 0 &&
    (Math.hypot(sx - tx, sz - tz) > reach || (firingPosition && !firingPosition(sx, sz)))
  )
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
  vehicle?: OwnedVehicle,
): Float64Array {
  const probe = routeProbe(arena, traction, radius, vehicle);
  const w = arena.width,
    dist = new Float64Array(w * arena.depth).fill(Infinity);
  // Binary heap in parallel typed arrays; a cell is pushed at most once per
  // incoming edge, so four entries per cell is a hard upper bound.
  const heapIds = new Int32Array(dist.length * 4 + 1),
    heapCosts = new Float64Array(heapIds.length);
  let size = 0;
  const start = Math.floor(sz) * w + Math.floor(sx);
  dist[start] = 0;
  function push(id: number, cost: number) {
    let i = size++;
    while (i) {
      const p = (i - 1) >> 1;
      if (heapCosts[p] <= cost) break;
      heapIds[i] = heapIds[p];
      heapCosts[i] = heapCosts[p];
      i = p;
    }
    heapIds[i] = id;
    heapCosts[i] = cost;
  }
  // Removes the root; the caller reads it first.
  function pop() {
    const id = heapIds[--size],
      cost = heapCosts[size];
    if (!size) return;
    let i = 0;
    for (;;) {
      const l = i * 2 + 1,
        r = l + 1;
      let j = i,
        best = cost;
      if (l < size && heapCosts[l] < best) ((j = l), (best = heapCosts[l]));
      if (r < size && heapCosts[r] < best) j = r;
      if (j === i) break;
      heapIds[i] = heapIds[j];
      heapCosts[i] = heapCosts[j];
      i = j;
    }
    heapIds[i] = id;
    heapCosts[i] = cost;
  }
  push(start, 0);
  while (size) {
    const id = heapIds[0],
      cost = heapCosts[0];
    pop();
    if (cost > dist[id]) continue;
    const cx = id % w,
      cz = Math.floor(id / w);
    for (let k = 0; k < 4; k++) {
      const x = cx + NEIGHBOR_X[k],
        z = cz + NEIGHBOR_Z[k],
        n = z * w + x;
      if (!probe.clear(cx + 0.5, cz + 0.5, x + 0.5, z + 0.5)) continue;
      const next = cost + probe.cost(x, z);
      if (next < dist[n]) {
        dist[n] = next;
        push(n, next);
      }
    }
  }
  return dist;
}
