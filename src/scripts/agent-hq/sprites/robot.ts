// H.E.R.B.I.E.: a cream shell with teal trim, a dark visor with two lenses and a striped chest.
// He floats, so instead of legs his body ends in a rounded base with a hover light.

import type { Grid, Palette } from '../engine/grid.ts';
import { POSES, armsUp, blank, finish, paintArms, type Face, type Frame, type Pose } from './body.ts';

const R = {
  shell: '#efe5cf',
  shellShade: '#cdbd9c',
  teal: '#2f8ea8',
  tealDark: '#1d6176',
  visor: '#2a2e37',
  visorLight: '#3f4552',
  orange: '#f08a3c',
  glow: '#7fe3f0',
  red: '#e0533b',
  yellow: '#f6c25a',
};

const ARMS: Palette = { A: R.shell, a: R.shellShade, K: '#8b919c', k: '#5f6570' };

function head(g: Grid, b: number, blink: boolean, face?: Face): void {
  const ins = [3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3];
  const y0 = 3 + b;
  ins.forEach((n, j) => {
    for (let x = 5 + n; x <= 26 - n; x++) {
      const edge = x >= 25 - n || j >= 13;
      g.set(x, y0 + j, edge ? R.shellShade : R.shell);
    }
  });
  // teal trim along the top-left and bottom-right corners
  for (let j = 0; j < 4; j++) g.set(5 + ins[j], y0 + j, R.teal);
  g.rect(8, y0, 7, 1, R.teal);
  g.rect(18, y0 + 14, 7, 1, R.tealDark);
  g.set(26 - ins[12], y0 + 12, R.tealDark);
  g.set(26 - ins[11], y0 + 11, R.tealDark);
  // visor
  g.rect(8, y0 + 3, 16, 9, R.visor);
  g.rect(8, y0 + 3, 1, 1, R.shell);
  g.rect(23, y0 + 3, 1, 1, R.shell);
  g.rect(8, y0 + 11, 1, 1, R.shellShade);
  g.rect(23, y0 + 11, 1, 1, R.shellShade);
  g.rect(9, y0 + 3, 14, 1, R.visorLight);
  if (blink) {
    g.rect(10, y0 + 7, 5, 1, '#8a8f99');
    g.rect(17, y0 + 7, 5, 1, '#f2f2f0');
  } else if (face?.look === 'happy') {
    // both lenses squint into arches
    for (const [x, c] of [[10, '#8a8f99'], [17, '#f2f2f0']] as const) {
      g.rect(x + 1, y0 + 6, 3, 1, c);
      g.set(x, y0 + 7, c);
      g.set(x + 4, y0 + 7, c);
    }
  } else if (face?.look === 'serious') {
    g.rect(10, y0 + 7, 5, 2, '#8a8f99');
    g.rect(11, y0 + 7, 3, 1, '#0f1114');
    g.rect(17, y0 + 7, 5, 2, '#f2f2f0');
    g.set(19, y0 + 7, R.visor);
  } else {
    // left lens: dark camera
    g.rect(11, y0 + 5, 3, 5, '#8a8f99');
    g.rect(10, y0 + 6, 5, 3, '#8a8f99');
    g.rect(11, y0 + 6, 3, 3, '#0f1114');
    g.set(11, y0 + 6, '#6d7480');
    // right lens: white reel
    g.rect(18, y0 + 5, 3, 5, '#f2f2f0');
    g.rect(17, y0 + 6, 5, 3, '#f2f2f0');
    g.set(19, y0 + 7, R.visor);
    g.set(18, y0 + 6, '#b9bcc2');
    g.set(20, y0 + 8, '#b9bcc2');
  }
  // the speaker grille under the lenses lights up while he talks
  const lit = face?.open || face?.look === 'surprised';
  [11, 13, 18, 20].forEach((x) => g.set(x, y0 + 10, lit ? R.glow : '#6d7480'));
  if (lit) g.rect(14, y0 + 10, 4, 1, R.glow);
  // neck
  g.rect(13, 18 + b, 6, 3, '#5f6570');
  g.rect(13, 19 + b, 6, 1, '#3f4450');
}

function body(g: Grid, b: number): void {
  const y0 = 21 + b;
  // torso
  g.rect(10, y0, 12, 9, R.shell);
  g.rect(21, y0, 1, 9, R.shellShade);
  g.rect(10, y0 + 8, 12, 1, R.shellShade);
  // chest panel stripes
  g.rect(12, y0 + 1, 8, 6, R.orange);
  g.rect(12, y0 + 1, 2, 6, R.red);
  g.rect(16, y0 + 1, 2, 6, R.yellow);
  g.rect(12, y0 + 6, 8, 1, '#c96a2c');
  g.rect(11, y0 + 1, 1, 6, R.teal);
  g.rect(20, y0 + 1, 1, 6, R.teal);
  // waist joint
  g.rect(12, y0 + 9, 8, 1, R.tealDark);
  // rounded base and the hover light underneath
  g.rect(12, y0 + 10, 8, 1, R.shell);
  g.rect(19, y0 + 10, 1, 1, R.shellShade);
  g.rect(13, y0 + 11, 6, 1, R.shellShade);
  g.rect(15, y0 + 12, 2, 1, '#7fe3f0');
}

function arms(g: Grid, f: Frame): void {
  paintArms(g, f, ARMS);
  // teal shoulder joints when the arms hang down
  const y0 = 21 + f.b;
  const [left, right] = f.arms;
  if (left !== 'up' && left !== 'wave') g.rect(8, y0, 2, 2, R.teal);
  if (right !== 'up' && right !== 'wave') g.rect(22, y0, 2, 2, R.teal);
}

export function renderRobot(pose: Pose, frame: number, blink = false, face?: Face): Grid {
  const frames = POSES[pose];
  const f = frames[frame % frames.length];
  const g = blank();
  body(g, f.b);
  if (!armsUp(f)) arms(g, f);
  head(g, f.b, blink, face);
  if (armsUp(f)) arms(g, f);
  // no shadow of his own: the scene draws one on the floor below him
  return finish(g, f, false);
}
