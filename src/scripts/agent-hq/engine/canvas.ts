// Browser side of the sprite engine: grids become canvases once and are reused every frame.

import type { Grid } from './grid.ts';

export function toCanvas(g: Grid): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = g.w;
  c.height = g.h;
  const ctx = c.getContext('2d')!;
  g.px.forEach((row, y) => row.forEach((col, x) => {
    if (!col) return;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 1, 1);
  }));
  return c;
}

/** Canvases by key, drawn the first time they are asked for. */
export class SpriteCache {
  private map = new Map<string, HTMLCanvasElement>();

  get(key: string, draw: () => Grid): HTMLCanvasElement {
    let c = this.map.get(key);
    if (!c) {
      c = toCanvas(draw());
      this.map.set(key, c);
    }
    return c;
  }
}

/** Which frame of an animation to show. rAF timestamps can come before `since`, so clamp at zero. */
export const frameAt = (now: number, since: number, fps: number, n: number): number =>
  Math.floor(Math.max(0, now - since) / (1000 / fps)) % n;

/**
 * Run `tick` every animation frame while `el` is on screen and the tab is visible.
 * The next frame is requested before drawing, so one bad frame can never stop the loop.
 */
export function loop(el: Element, tick: (now: number, dt: number) => void): void {
  let visible = true;
  let running = false;
  let last = 0;
  const frame = (now: number) => {
    if (!visible || document.hidden) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, Math.max(0, now - last) / 1000) : 0;
    last = now;
    tick(now, dt);
  };
  const resume = () => {
    if (running || !visible || document.hidden) return;
    running = true;
    last = 0;
    requestAnimationFrame(frame);
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    resume();
  }).observe(el);
  document.addEventListener('visibilitychange', resume);
  resume();
}
