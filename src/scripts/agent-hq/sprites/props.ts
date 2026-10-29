// Office furniture drawn on grids like the characters: desks, display cases with the
// object of each career stage, plants, the server rack and the study.

import { agentById } from '../../../data/agents.ts';
import { vitrinas, type ArchiveObject } from '../../../data/archive.ts';
import { Grid } from '../engine/grid.ts';
import type { Prop } from '../world/map.ts';
import { H, OY, W } from './body.ts';

/** Desk and laptop, on the same grid as the character standing behind it. */
function desk(accent: string): Grid {
  const g = new Grid(W, H, OY);
  // laptop lid (its back faces the viewer)
  g.rect(12, 25, 8, 5, '#c4c8d0');
  g.rect(19, 25, 1, 5, '#9da2ad');
  g.rect(12, 25, 8, 1, '#dde0e6');
  g.rect(15, 27, 2, 1, accent);
  // desk
  g.rect(0, 30, 32, 1, '#c99463');
  g.rect(0, 31, 32, 1, '#a8754a');
  g.rect(1, 32, 30, 8, '#83573a');
  g.rect(1, 32, 30, 1, '#6a452d');
  g.rect(3, 34, 26, 1, '#94653f');
  return g.outlined();
}

/** Sergio's desk: a monitor instead of a laptop and an empty chair behind it. */
function study(): Grid {
  const g = new Grid(W, H, OY);
  // chair back
  g.rect(9, 16, 14, 12, '#3a3845');
  g.rect(10, 17, 12, 1, '#55526a');
  // monitor
  g.rect(9, 20, 14, 9, '#2b2735');
  g.rect(10, 21, 12, 7, '#5b8cff');
  g.rect(10, 21, 12, 2, '#86a9ff');
  g.rect(15, 29, 2, 1, '#2b2735');
  // desk
  g.rect(0, 30, 32, 1, '#c99463');
  g.rect(0, 31, 32, 1, '#a8754a');
  g.rect(1, 32, 30, 8, '#83573a');
  g.rect(1, 32, 30, 1, '#6a452d');
  g.rect(3, 34, 26, 1, '#94653f');
  return g.outlined();
}

// ---------- display cases (32x34) ----------
const OBJECTS: Record<ArchiveObject, (g: Grid) => void> = {
  diploma(g) {
    g.rect(9, 9, 14, 12, '#8a5a2b');
    g.rect(10, 10, 12, 10, '#f3e6c4');
    g.rect(12, 12, 8, 1, '#b9a68a');
    g.rect(12, 14, 8, 1, '#b9a68a');
    g.rect(12, 16, 5, 1, '#b9a68a');
    g.rect(18, 16, 3, 3, '#c23a3a');
    g.rect(19, 19, 1, 2, '#c23a3a');
  },
  laptop(g) {
    g.rect(8, 10, 14, 9, '#3a3845');
    g.rect(9, 11, 12, 7, '#1b1825');
    g.rect(10, 12, 6, 1, '#5fd38a');
    g.rect(10, 14, 8, 1, '#5fd38a');
    g.rect(12, 16, 5, 1, '#f2c95c');
    g.rect(6, 19, 18, 2, '#9da2ad');
    g.rect(6, 19, 18, 1, '#c4c8d0');
    // a coin for the wallet integrations
    g.rect(23, 15, 4, 5, '#e2b84a');
    g.rect(22, 16, 6, 3, '#e2b84a');
    g.rect(24, 16, 2, 3, '#c79a2e');
  },
  phone(g) {
    g.rect(11, 7, 10, 15, '#2b2735');
    g.rect(12, 8, 8, 12, '#f6f3ee');
    g.rect(13, 9, 5, 2, '#d8d6d0');
    g.rect(15, 12, 4, 2, '#47b26b');
    g.rect(13, 15, 5, 2, '#d8d6d0');
    g.rect(15, 21, 2, 1, '#55526a');
    // an apple for the nutrition app
    g.rect(23, 16, 5, 5, '#d64545');
    g.rect(24, 15, 1, 1, '#47b26b');
    g.rect(24, 17, 1, 1, '#f08a8a');
  },
  tv(g) {
    g.rect(6, 8, 20, 12, '#2b2735');
    g.rect(7, 9, 18, 10, '#5b8cff');
    g.rect(7, 9, 18, 3, '#86a9ff');
    g.rect(14, 13, 4, 3, '#f6f3ee');
    g.rect(15, 20, 2, 1, '#2b2735');
    g.rect(11, 21, 10, 1, '#2b2735');
    // remote
    g.rect(22, 18, 3, 4, '#55526a');
    g.rect(23, 19, 1, 1, '#e05561');
  },
  antenna(g) {
    g.rect(15, 7, 2, 15, '#8b919c');
    for (let j = 0; j < 7; j++) {
      g.set(14 - Math.floor(j / 2), 15 + j, '#8b919c');
      g.set(17 + Math.floor(j / 2), 15 + j, '#8b919c');
    }
    g.rect(13, 12, 6, 1, '#8b919c');
    g.rect(15, 5, 2, 2, '#e05561');
    // signal
    g.rect(10, 8, 1, 3, '#5b8cff');
    g.rect(21, 8, 1, 3, '#5b8cff');
    g.rect(8, 7, 1, 5, '#86a9ff');
    g.rect(23, 7, 1, 5, '#86a9ff');
  },
  terminal(g) {
    // a card going in
    g.rect(13, 6, 7, 5, '#d64545');
    g.rect(13, 7, 7, 1, '#2b2735');
    g.rect(11, 10, 11, 12, '#3a3845');
    g.rect(12, 11, 9, 4, '#a2d5f3');
    g.rect(13, 12, 4, 1, '#2b2735');
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) g.rect(12 + i * 3, 16 + j * 2, 2, 1, '#cfcabf');
  },
  model(g) {
    // a scale model of this office
    g.rect(7, 12, 18, 9, '#efe5cf');
    g.rect(7, 10, 18, 2, '#5a5266');
    g.rect(9, 8, 14, 2, '#5a5266');
    g.rect(9, 14, 3, 3, '#a2d5f3');
    g.rect(14, 14, 4, 7, '#2f8ea8');
    g.rect(20, 14, 3, 3, '#a2d5f3');
    g.rect(6, 21, 20, 1, '#47b26b');
  },
};

function vitrina(object: ArchiveObject, open: boolean): Grid {
  const g = new Grid(32, 34);
  // cabinet
  g.rect(1, 23, 30, 10, '#83573a');
  g.rect(1, 23, 30, 2, '#c99463');
  g.rect(3, 27, 26, 1, '#6a452d');
  if (!open) {
    // a sheet thrown over the glass
    g.rect(2, 5, 28, 19, '#f1eee6');
    g.rect(4, 3, 24, 2, '#f1eee6');
    g.rect(1, 18, 30, 7, '#f1eee6');
    for (const x of [7, 13, 19, 25]) g.rect(x, 8, 1, 17, '#d9d4c7');
    g.rect(2, 24, 28, 1, '#d9d4c7');
    g.rect(14, 12, 4, 2, '#cfc9ba');
    return g.outlined();
  }
  // glass case
  g.rect(2, 4, 28, 19, 'rgba(178,220,240,0.35)');
  g.rect(2, 4, 28, 1, '#5d6676');
  g.rect(2, 4, 1, 19, '#5d6676');
  g.rect(29, 4, 1, 19, '#5d6676');
  OBJECTS[object](g);
  // reflection on the glass
  g.rect(5, 6, 1, 6, 'rgba(255,255,255,0.7)');
  g.rect(6, 6, 1, 3, 'rgba(255,255,255,0.7)');
  return g.outlined();
}

function plant(): Grid {
  const g = new Grid(16, 30);
  g.rect(2, 18, 12, 11, '#b3603b');
  g.rect(2, 18, 12, 2, '#cf7a51');
  g.rect(11, 20, 3, 9, '#8f4a2c');
  ([[7, 0, 3, 18], [3, 4, 4, 10], [10, 3, 4, 12], [1, 9, 4, 6], [12, 8, 4, 8], [5, 2, 3, 8]] as const).forEach(([x, y, w, h], k) => {
    g.rect(x, y, w, h, k % 2 ? '#3f8a4f' : '#57a865');
  });
  g.rect(8, 1, 1, 14, '#2f6b3c');
  return g.outlined();
}

function rack(): Grid {
  const g = new Grid(32, 46);
  g.rect(3, 2, 26, 43, '#14151a');
  g.rect(4, 3, 24, 41, '#2d3039');
  for (let y = 6; y < 40; y += 7) {
    g.rect(6, y, 20, 5, '#3b3f4b');
    g.rect(6, y + 4, 20, 1, '#23252d');
    for (let x = 16; x < 25; x += 2) g.rect(x, y + 1, 1, 2, '#23252d');
  }
  return g.outlined();
}

function shelf(): Grid {
  const g = new Grid(48, 34);
  g.rect(1, 1, 46, 32, '#6a452d');
  g.rect(3, 3, 42, 28, '#3a2a20');
  const colors = ['#c23a3a', '#5b8cff', '#47b26b', '#e2b84a', '#efe5cf', '#b0413e', '#2f8ea8'];
  for (const y of [3, 17]) {
    g.rect(3, y + 13, 42, 1, '#83573a');
    for (let x = 4, k = y; x < 44; k++) {
      const w = 2 + (k % 3);
      const h = 9 + (k % 4);
      g.rect(x, y + 13 - h, w, h, colors[k % colors.length]);
      x += w + (k % 5 === 0 ? 2 : 0);
    }
  }
  return g.outlined();
}

export interface PropState {
  /** Display cases: uncovered or still under the sheet. */
  open: boolean;
}

export function renderProp(p: Prop, s: PropState): Grid {
  switch (p.kind) {
    case 'desk':
      return desk(agentById[p.agent].accent);
    case 'study':
      return study();
    case 'vitrina':
      return vitrina(vitrinas.find((v) => v.id === p.id)!.object, s.open);
    case 'plant':
      return plant();
    case 'rack':
      return rack();
    case 'shelf':
      return shelf();
  }
}

/** Cache key: a prop looks the same until its state changes. */
export const propKey = (p: Prop, s: PropState): string => `${p.kind}:${p.tx}:${p.ty}:${s.open}`;
