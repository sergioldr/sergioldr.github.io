// The office background, drawn once: floors, walls seen from three quarters above,
// doors, rugs and what hangs on the walls. Moving things are drawn by the scene.

import { text, textWidth } from '../engine/font.ts';
import { MAP_ROWS, TILE, type World } from './map.ts';

/** Outside the building: dark, so the office floats like a room in a classic RPG. */
export const VOID = '#17121c';
const INK = '#1d1521';
const CAP = '#4a4458';
const CAP_EDGE = '#6a6378';

const FLOORS = '.:~_d';
const isFloor = (ch: string) => FLOORS.includes(ch);

/** Wall colour by the room it faces. */
const FACE: Record<string, [string, string]> = {
  '.': ['#c5cfd9', '#bac5d0'],
  d: ['#c5cfd9', '#bac5d0'],
  ':': ['#d8cdb8', '#cdc1aa'],
  '~': ['#c9d3e6', '#bdc8dd'],
  _: ['#c5cfd9', '#bac5d0'],
};

type Ctx = CanvasRenderingContext2D;
const px = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
};

function circle(ctx: Ctx, cx: number, cy: number, r: number, fill: string, rim: string): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y);
      if (d <= r + 0.3) px(ctx, cx + x, cy + y, 1, 1, d > r - 1 ? rim : fill);
    }
  }
}

function floor(ctx: Ctx, ch: string, x0: number, y0: number): void {
  if (ch === '.' || ch === 'd') {
    // long, narrow boards running left to right
    for (let y = y0; y < y0 + TILE; y++) {
      const r = Math.floor(y / 6);
      px(ctx, x0, y, TILE, 1, y % 6 === 5 ? '#9a6d45' : ['#bb8c5f', '#b38458', '#b98a5c'][r % 3]);
      if (y % 6 === 5) continue;
      for (let x = x0; x < x0 + TILE; x++) if ((x + r * 37) % 80 === 0) px(ctx, x, y, 1, 1, '#9a6d45');
    }
  } else if (ch === ':' || ch === '~') {
    const [base, dot] = ch === ':' ? ['#3f5c4f', '#4b6b5c'] : ['#3b4a6b', '#47587e'];
    px(ctx, x0, y0, TILE, TILE, base);
    for (let y = y0; y < y0 + TILE; y += 4) for (let x = x0 + ((y / 4) % 2) * 2; x < x0 + TILE; x += 4) px(ctx, x, y, 1, 1, dot);
  } else if (ch === '_') {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) px(ctx, x0 + i * 8, y0 + j * 8, 8, 8, (i + j) % 2 ? '#d2cab9' : '#ddd6c8');
  }
}

function wall(ctx: Ctx, world: World, tx: number, ty: number): void {
  const x = tx * TILE;
  const y = ty * TILE;
  const below = world.at(tx, ty + 1);
  const below2 = world.at(tx, ty + 2);
  if (isFloor(below)) {
    // lower half of a wall face, with the skirting board
    const [face, stripe] = FACE[below];
    px(ctx, x, y, TILE, TILE, face);
    for (let i = 4; i < TILE; i += 10) px(ctx, x + ((i + tx * 6) % TILE), y, 1, TILE - 4, stripe);
    px(ctx, x, y + TILE - 4, TILE, 4, '#7b8594');
    px(ctx, x, y + TILE - 4, TILE, 1, '#98a2b0');
  } else if (below === '#' && isFloor(below2)) {
    // upper half of a wall face, capped
    const [face, stripe] = FACE[below2];
    px(ctx, x, y, TILE, TILE, face);
    for (let i = 4; i < TILE; i += 10) px(ctx, x + ((i + tx * 6) % TILE), y + 5, 1, TILE - 5, stripe);
    px(ctx, x, y, TILE, 4, CAP);
    px(ctx, x, y + 4, TILE, 1, CAP_EDGE);
  } else {
    // the top of a wall, seen from above
    px(ctx, x, y, TILE, TILE, CAP);
    if (isFloor(world.at(tx - 1, ty))) px(ctx, x, y, 1, TILE, CAP_EDGE);
    if (isFloor(world.at(tx + 1, ty))) px(ctx, x + TILE - 1, y, 1, TILE, CAP_EDGE);
    if (world.at(tx, ty - 1) === ' ' || isFloor(world.at(tx, ty - 1))) px(ctx, x, y, TILE, 1, CAP_EDGE);
  }
}

function doors(ctx: Ctx): void {
  // archive: an open doorway with the frame's posts
  px(ctx, 12 * TILE, 9 * TILE, TILE, 2, CAP);
  px(ctx, 12 * TILE, 11 * TILE - 2, TILE, 2, CAP);
  // study: a locked wooden door seen edge on
  px(ctx, 35 * TILE + 3, 9 * TILE, 10, 2 * TILE, '#83573a');
  px(ctx, 35 * TILE + 3, 9 * TILE, 10, 1, '#a8754a');
  px(ctx, 35 * TILE + 5, 9 * TILE + 2, 6, 2 * TILE - 4, '#6a452d');
  px(ctx, 35 * TILE + 7, 10 * TILE - 1, 2, 3, '#e2b84a');
  // exit: glass doors in the lobby wall, a mat in front
  const ex = 23 * TILE;
  const ey = 20 * TILE;
  px(ctx, ex, ey, 2 * TILE, TILE, '#5d6676');
  px(ctx, ex + 2, ey + 2, TILE - 3, TILE - 4, '#a2d5f3');
  px(ctx, ex + TILE + 1, ey + 2, TILE - 3, TILE - 4, '#a2d5f3');
  px(ctx, ex + 4, ey + 3, 1, 6, '#e8f6ff');
  px(ctx, ex + TILE + 3, ey + 3, 1, 6, '#e8f6ff');
  px(ctx, ex + 2, 19 * TILE + 5, 2 * TILE - 4, 10, '#7b4a3a');
  for (let i = 0; i < 4; i++) px(ctx, ex + 4, 19 * TILE + 7 + i * 2, 2 * TILE - 8, 1, '#946052');
}

function rugs(ctx: Ctx): void {
  // archive rug
  px(ctx, 3 * TILE, 7 * TILE + 4, 6 * TILE, 3 * TILE, '#8c2f39');
  px(ctx, 3 * TILE + 2, 7 * TILE + 6, 6 * TILE - 4, 3 * TILE - 4, '#a33a45');
  px(ctx, 3 * TILE + 4, 7 * TILE + 8, 6 * TILE - 8, 3 * TILE - 8, '#8c2f39');
  // office rug in the open space between the two rows of desks
  const rx = 21 * TILE + 8;
  const ry = 11 * TILE + 6;
  px(ctx, rx, ry, 5 * TILE, 2 * TILE + 4, '#41607a');
  px(ctx, rx + 3, ry + 3, 5 * TILE - 6, 2 * TILE - 2, '#5a7d9a');
  px(ctx, rx + 6, ry + 6, 5 * TILE - 12, 2 * TILE - 8, '#6b8eab');
  for (let x = rx + 10; x < rx + 5 * TILE - 10; x += 8) px(ctx, x, ry + 2 * TILE / 2 + 1, 4, 2, '#41607a');
}

function windowPane(ctx: Ctx, wx: number, wy: number, ww: number, wh: number, night: boolean): void {
  px(ctx, wx - 3, wy - 3, ww + 6, wh + 6, '#5d6676');
  px(ctx, wx - 2, wy - 2, ww + 4, wh + 4, '#f2f4f7');
  px(ctx, wx, wy, ww, wh, night ? '#202650' : '#a2d5f3');
  if (night) {
    [[4, 3], [13, 7], [22, 2], [31, 5], [44, 9], [8, 10], [37, 2]].forEach(([x, y]) => x < ww && px(ctx, wx + x, wy + y, 1, 1, '#f5f1d0'));
  } else {
    px(ctx, wx + 6, wy + 5, 10, 3, '#ffffff');
    px(ctx, wx + 9, wy + 3, 5, 2, '#ffffff');
  }
  const skyline = [[0, 16, 8], [8, 11, 10], [18, 18, 7], [25, 13, 9], [34, 19, 8], [42, 14, 7], [49, 17, 7]];
  skyline.forEach(([dx, top, bw], k) => {
    if (dx >= ww) return;
    const w = Math.min(bw, ww - dx);
    px(ctx, wx + dx, wy + top, w, wh - top, night ? '#141834' : '#7c90b1');
    for (let y = wy + top + 2; y < wy + wh - 1; y += 3) {
      for (let x = wx + dx + 1; x < wx + dx + w - 1; x += 2) {
        if (night ? (x * 7 + y * 3 + k) % 5 < 2 : (x + y + k) % 4 === 0) px(ctx, x, y, 1, 1, night ? '#f2c95c' : '#9aaccb');
      }
    }
  });
  px(ctx, wx + Math.floor(ww / 2) - 1, wy, 2, wh, '#f2f4f7');
}

function plaque(ctx: Ctx, label: string, cx: number, y: number): void {
  const w = textWidth(label) + 6;
  const x = cx - Math.ceil(w / 2);
  px(ctx, x - 1, y - 1, w + 2, 11, INK);
  px(ctx, x, y, w, 9, '#2b2735');
  text(ctx, label, x + 3, y + 2, '#f2c95c');
}

function wallDecor(ctx: Ctx, night: boolean): void {
  // office
  windowPane(ctx, 14 * TILE + 2, 19, 54, 24, night);
  // kanban board
  const kx = 21 * TILE;
  px(ctx, kx, 18, 7 * TILE, 28, '#4a3324');
  px(ctx, kx + 1, 19, 7 * TILE - 2, 26, '#7a5638');
  px(ctx, kx + 3, 21, 7 * TILE - 6, 22, '#f6f6f1');
  const colW = Math.floor((7 * TILE - 6) / 3);
  ['TO DO', 'DOING', 'DONE'].forEach((label, i) => {
    const x = kx + 3 + i * colW;
    if (i) px(ctx, x, 22, 1, 20, '#d6d6cf');
    text(ctx, label, x + Math.round((colW - textWidth(label)) / 2), 23, '#3a3845');
  });
  const notes: [number, number, string][] = [[0, 0, '#f2d266'], [1, 0, '#f2d266'], [0, 1, '#f2d266'], [3, 0, '#5b8cff'], [4, 0, '#e05561'], [6, 0, '#47b26b'], [7, 0, '#e0894b'], [6, 1, '#d64545']];
  notes.forEach(([i, j, c]) => {
    const col = Math.floor(i / 3);
    const x = kx + 5 + col * colW + (i % 3) * 11;
    const y = 30 + j * 7;
    px(ctx, x + 1, y + 1, 9, 5, 'rgba(40,30,50,0.18)');
    px(ctx, x, y, 9, 5, c);
    px(ctx, x + 1, y + 2, 5, 1, 'rgba(30,20,40,0.35)');
  });
  // monitor wall
  for (let i = 0; i < 3; i++) {
    const x = 29 * TILE + 2 + i * 26;
    px(ctx, x, 20, 24, 16, '#14151a');
    px(ctx, x + 1, 21, 22, 14, '#1d2a2a');
    for (let r = 0; r < 4; r++) px(ctx, x + 3, 23 + r * 3, 6 + ((i * 5 + r * 7) % 12), 1, r === 2 && i === 1 ? '#f2c95c' : '#5fd38a');
  }
  px(ctx, 29 * TILE + 2, 36, 76, 2, '#2d3039');
  // archive
  plaque(ctx, 'ARCHIVE', 6 * TILE, 26);
  for (const fx of [1 * TILE + 6, 9 * TILE + 4]) {
    px(ctx, fx, 20, 18, 16, '#8a5a2b');
    px(ctx, fx + 2, 22, 14, 12, '#efe5cf');
    px(ctx, fx + 4, 27, 10, 5, '#7c90b1');
    px(ctx, fx + 6, 24, 4, 3, '#f2c95c');
  }
  // study
  windowPane(ctx, 36 * TILE + 6, 19, 40, 24, night);
  plaque(ctx, 'SERGIO', 41 * TILE + 4, 26);
}

/** Draw the whole background once. `night` follows the visitor's clock. */
export function drawRoom(world: World, night: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = world.w * TILE;
  c.height = world.h * TILE;
  const ctx = c.getContext('2d')!;
  px(ctx, 0, 0, c.width, c.height, VOID);
  MAP_ROWS.forEach((row, ty) => [...row].forEach((ch, tx) => {
    if (isFloor(ch)) floor(ctx, ch, tx * TILE, ty * TILE);
    else if (ch !== ' ') wall(ctx, world, tx, ty);
  }));
  rugs(ctx);
  doors(ctx);
  wallDecor(ctx, night);
  circle(ctx, CLOCK.x, CLOCK.y, 7, '#fbfbf8', '#3a3845');
  return c;
}

const CLOCK = { x: 19 * TILE + 8, y: 30 };

/** The hands of the office clock, with the visitor's real time. The face is in the background. */
export function drawClockHands(ctx: Ctx, date: Date): void {
  const { x: cx, y: cy } = CLOCK;
  const ma = (date.getMinutes() / 60) * Math.PI * 2;
  const ha = ((date.getHours() % 12) / 12) * Math.PI * 2 + ma / 12;
  for (const [a, r, c] of [[ma, 5, '#3a3845'], [ha, 3, '#c23a3a']] as const) {
    const n = r;
    for (let i = 0; i <= n; i++) px(ctx, Math.round(cx + Math.sin(a) * i), Math.round(cy - Math.cos(a) * i), 1, 1, c);
  }
}
