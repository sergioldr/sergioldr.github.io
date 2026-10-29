// Pixel grids: every sprite frame is drawn on a grid of CSS colors (null = transparent)
// from hand-placed ASCII templates, then outlined and cached as a canvas.

export type Color = string | null;
/** A palette entry is a color, or a function for procedural patterns such as plaid. */
export type Ink = string | ((x: number, y: number) => string);
export type Palette = Record<string, Ink | undefined>;

export const OUTLINE = '#1d1521';
export const SHADOW = 'rgba(20,10,30,0.28)';

export class Grid {
  w: number;
  h: number;
  /** Headroom above the drawing origin, so jumps and hats never clip. */
  oy: number;
  px: Color[][];

  constructor(w: number, h: number, oy = 0) {
    this.w = w;
    this.h = h;
    this.oy = oy;
    this.px = Array.from({ length: h }, () => Array<Color>(w).fill(null));
  }

  set(x: number, y: number, c: Color | undefined): void {
    y += this.oy;
    if (c && x >= 0 && x < this.w && y >= 0 && y < this.h) this.px[y][x] = c;
  }

  rect(x: number, y: number, w: number, h: number, c: string): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  /** Stamp a template; `pal` turns chars into colors. `mirror` flips around the grid's center line. */
  paint(rows: string[], ox: number, oy: number, pal: Palette, mirror = false): void {
    rows.forEach((row, j) => {
      [...row].forEach((ch, i) => {
        const ink = pal[ch];
        if (!ink) return;
        const x = mirror ? this.w - 1 - (ox + i) : ox + i;
        this.set(x, oy + j, typeof ink === 'function' ? ink(x, oy + j + this.oy) : ink);
      });
    });
  }

  /** A copy with a one-pixel outline around everything drawn. */
  outlined(color = OUTLINE): Grid {
    const out = this.copy();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.px[y][x]) continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => this.px[y + dy]?.[x + dx]);
        if (near) out.px[y][x] = color;
      }
    }
    return out;
  }

  /** Soft oval shadow under the feet, only where nothing is drawn. */
  shadow(cx: number, y: number, half: number): void {
    for (const [dy, hw] of [[0, half], [1, half - 2]]) {
      for (let x = cx - hw; x < cx + hw; x++) {
        const row = this.px[y + dy + this.oy];
        if (row && !row[x]) row[x] = SHADOW;
      }
    }
  }

  /** Shift everything up by n pixels (for jumps). */
  lifted(n: number): Grid {
    if (!n) return this;
    const out = new Grid(this.w, this.h, this.oy);
    out.px = [...this.px.slice(n).map((r) => r.slice()), ...Array.from({ length: n }, () => Array<Color>(this.w).fill(null))];
    return out;
  }

  copy(): Grid {
    const out = new Grid(this.w, this.h, this.oy);
    out.px = this.px.map((r) => r.slice());
    return out;
  }
}

/** Auto-shade a '#' mass: dark under bottom and right edges, a light arc under the top edge. */
export function shade(rows: string[]): string[] {
  const filled = (i: number, j: number) => j >= 0 && j < rows.length && i >= 0 && i < rows[j].length && rows[j][i] !== '.';
  let minX = Infinity;
  let maxX = -1;
  rows.forEach((r) => [...r].forEach((ch, i) => {
    if (ch !== '.') {
      minX = Math.min(minX, i);
      maxX = Math.max(maxX, i);
    }
  }));
  const w = maxX - minX + 1;
  const lo = minX + Math.round(w * 0.18);
  const hi = minX + Math.round(w * 0.55);
  return rows.map((row, j) => [...row].map((ch, i) => {
    if (ch !== '#') return ch;
    if (!filled(i, j + 1)) return 'd';
    if (!filled(i + 1, j) && i > (minX + maxX) / 2) return 'd';
    if (filled(i, j - 1) && !filled(i, j - 2) && i >= lo && i <= hi) return 'l';
    return '#';
  }).join(''));
}

/** Curly texture: scatter light and dark specks through the mass. */
export function curl(rows: string[]): string[] {
  return rows.map((row, j) => [...row].map((ch, i) => {
    if (ch !== '#') return ch;
    const k = (i * 3 + j * 2) % 7;
    return k === 0 ? 'l' : k === 4 ? 'd' : '#';
  }).join(''));
}

/** Pad or cut every row to the same width. */
export const fit = (rows: string[], w: number): string[] => rows.map((r) => r.padEnd(w, '.').slice(0, w));
