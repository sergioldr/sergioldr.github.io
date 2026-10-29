// Moving around the office: keyboard steering that slides along walls, and
// tap-to-walk along the shortest tile path.

import { TILE, type Dir, type Point, type Tile, type World } from './map.ts';

/** Shortest 4-way path between two walkable tiles, excluding the start. Null if unreachable. */
export function findPath(world: World, from: Tile, to: Tile): Tile[] | null {
  if (world.solid(to.tx, to.ty)) return null;
  const key = (t: Tile) => t.ty * world.w + t.tx;
  const prev = new Map<number, Tile | null>([[key(from), null]]);
  const queue: Tile[] = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.tx === to.tx && cur.ty === to.ty) {
      const path: Tile[] = [];
      for (let t: Tile | null = cur; t && key(t) !== key(from); t = prev.get(key(t)) ?? null) path.unshift(t);
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { tx: cur.tx + dx, ty: cur.ty + dy };
      if (world.solid(next.tx, next.ty) || prev.has(key(next))) continue;
      prev.set(key(next), cur);
      queue.push(next);
    }
  }
  return null;
}

/** The walkable tile closest to `t`, searching outwards ring by ring. */
export function nearestWalkable(world: World, t: Tile): Tile | null {
  for (let r = 0; r < 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (!world.solid(t.tx + dx, t.ty + dy)) return { tx: t.tx + dx, ty: t.ty + dy };
      }
    }
  }
  return null;
}

// Collision box around the feet.
const HALF_W = 5;
const HEIGHT = 5;

export class Walker {
  x: number;
  y: number;
  facing: Dir = 'down';
  moving = false;
  /** Waypoints left on the current path. */
  path: Point[] = [];
  speed = 74;
  /** Total distance walked, in pixels; drives the walk cycle. */
  walked = 0;

  constructor(at: Point) {
    this.x = at.x;
    this.y = at.y;
  }

  private blocked(world: World, x: number, y: number): boolean {
    const x0 = Math.floor((x - HALF_W) / TILE);
    const x1 = Math.floor((x + HALF_W - 0.01) / TILE);
    const y0 = Math.floor((y - HEIGHT) / TILE);
    const y1 = Math.floor((y - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (world.solid(tx, ty)) return true;
    return false;
  }

  /** Move with a direction from the keyboard, sliding along whatever blocks one axis. */
  steer(dt: number, dx: number, dy: number, world: World): void {
    this.path = [];
    const len = Math.hypot(dx, dy) || 1;
    const step = this.speed * dt;
    const nx = this.x + (dx / len) * step;
    const ny = this.y + (dy / len) * step;
    const from = { x: this.x, y: this.y };
    if (!this.blocked(world, nx, this.y)) this.x = nx;
    if (!this.blocked(world, this.x, ny)) this.y = ny;
    const moved = Math.hypot(this.x - from.x, this.y - from.y);
    this.walked += moved;
    this.look(dx, dy);
    // pushing against a wall turns to face it without walking on the spot
    this.moving = moved > 0.001;
  }

  /** Walk along the current path. */
  follow(dt: number): void {
    let budget = this.speed * dt;
    this.moving = this.path.length > 0;
    while (budget > 0 && this.path.length) {
      const next = this.path[0];
      const dx = next.x - this.x;
      const dy = next.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d <= budget) {
        this.x = next.x;
        this.y = next.y;
        this.walked += d;
        budget -= d;
        this.path.shift();
      } else {
        this.x += (dx / d) * budget;
        this.y += (dy / d) * budget;
        this.walked += budget;
        budget = 0;
      }
      if (d > 0.01) this.look(dx, dy);
    }
  }

  look(dx: number, dy: number): void {
    if (Math.abs(dx) > Math.abs(dy)) this.facing = dx > 0 ? 'right' : 'left';
    else if (dy !== 0) this.facing = dy > 0 ? 'down' : 'up';
  }
}
