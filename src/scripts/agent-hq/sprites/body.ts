// Frame size, poses and arms shared by every character sprite.

import { Grid, fit, type Palette } from '../engine/grid.ts';

export const W = 32;
export const H = 45;
/** Headroom above the drawing origin, so jumps and hats never clip. */
export const OY = 3;

export const SKIN = '#f7dcc0';
export const SKIN_SHADE = '#e9bd9a';

export type Pose = 'idle' | 'walk' | 'work' | 'cheer' | 'wave';
/** Side frames face right; the scene mirrors them for left. */
export type Facing = 'down' | 'up' | 'side';

/**
 * A face for the big splash art next to the dialog: an expression and whether the mouth is
 * open mid-word. The small office sprites leave it out and keep their mouthless faces.
 */
export interface Face {
  look: 'calm' | 'happy' | 'surprised' | 'serious';
  open: boolean;
}
export type ArmName = keyof typeof ARM;

export interface Frame {
  /** Body bob in pixels. */
  b: number;
  /** Leg lift, left and right. */
  legs?: [number, number];
  arms: [ArmName, ArmName];
  /** Typing at a desk. */
  desk?: boolean;
  jump?: number;
}

export const blank = (): Grid => new Grid(W, H, OY);

// Left arm templates; the right arm is the same template mirrored.
export const ARM = {
  down: { x: 8, dy: 0, rows: ['.AA', 'AAa', 'AAa', 'AAa', 'AAa', 'AAa', 'AAa', 'KKk', 'KKk'] },
  swing: { x: 8, dy: 0, rows: ['.AA', 'AAa', 'AAa', 'AAa', 'AAa', 'AAa', 'KKk', 'KKk'] },
  type: { x: 8, dy: 0, rows: ['.AA.', 'AAa.', 'AAa.', 'AAa.', 'AAa.', '.AAa', '.AAa', '..KK', '..KK'] },
  typeUp: { x: 8, dy: 0, rows: ['.AA.', 'AAa.', 'AAa.', 'AAa.', 'AAa.', '.AAa', '.AAa', '..KK'] },
  up: {
    x: 3,
    dy: -9,
    rows: ['KK......', 'KKk.....', 'AAa.....', 'AAa.....', '.AAa....', '.AAa....', '..AAa...', '...AAa..', '....AAa.', '.....AAa', '......Aa'],
  },
  wave: {
    x: 3,
    dy: -9,
    rows: ['.KK.....', '.KKk....', '.AAa....', 'AAa.....', '.AAa....', '.AAa....', '..AAa...', '...AAa..', '....AAa.', '.....AAa', '......Aa'],
  },
};

export const armsUp = (f: Frame): boolean => f.arms.some((a) => ARM[a].dy < 0);

/** Paint both arms; `map` must resolve A/a (sleeve) and K/k (hand). */
export function paintArms(g: Grid, f: Frame, map: Palette): void {
  const [left, right] = f.arms.map((a) => ARM[a]);
  const y0 = 21 + f.b;
  g.paint(fit(left.rows, left.rows[0].length), left.x, y0 + left.dy, map);
  g.paint(fit(right.rows, right.rows[0].length), right.x, y0 + right.dy, map, true);
}

export const POSES: Record<Pose, Frame[]> = {
  idle: [
    { b: 0, arms: ['down', 'down'] },
    { b: 0, arms: ['down', 'down'] },
    { b: 1, arms: ['down', 'down'] },
    { b: 1, arms: ['down', 'down'] },
  ],
  walk: [
    { b: 1, legs: [0, 0], arms: ['down', 'down'] },
    { b: 0, legs: [2, 0], arms: ['down', 'swing'] },
    { b: 1, legs: [0, 0], arms: ['down', 'down'] },
    { b: 0, legs: [0, 2], arms: ['swing', 'down'] },
  ],
  work: [
    { b: 0, arms: ['type', 'typeUp'], desk: true },
    { b: 0, arms: ['typeUp', 'type'], desk: true },
    { b: 0, arms: ['type', 'typeUp'], desk: true },
    { b: 0, arms: ['type', 'type'], desk: true },
  ],
  cheer: [
    { b: 1, arms: ['down', 'down'] },
    { b: 0, arms: ['up', 'up'], jump: 2 },
    { b: 0, arms: ['up', 'up'], jump: 3 },
    { b: 0, arms: ['up', 'up'], jump: 1 },
  ],
  wave: [
    { b: 0, arms: ['down', 'up'] },
    { b: 0, arms: ['down', 'wave'] },
    { b: 1, arms: ['down', 'up'] },
    { b: 1, arms: ['down', 'wave'] },
  ],
};

/** Outline, jump and floor shadow: the last steps of every character frame. */
export function finish(g: Grid, f: Frame, shadow = true): Grid {
  const jump = f.jump ?? 0;
  const out = g.outlined().lifted(jump);
  if (shadow) out.shadow(16, 39, jump > 1 ? 5 : jump > 0 ? 6 : 7);
  return out;
}
