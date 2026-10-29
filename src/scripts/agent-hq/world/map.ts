// The office map: tiles, furniture and the spots where the player can interact.
//
// Tiles: '#' wall, '.' office floor, ':' archive carpet, '~' study carpet,
// '_' lobby tiles, 'd' open door, 'L' locked door, 'X' exit door, ' ' outside.

import type { AgentId } from '../../../data/agents.ts';
import type { VitrinaId } from '../../../data/archive.ts';

export const TILE = 16;

const ROWS = [
  '############################################',
  '############################################',
  '############################################',
  '#:::::::::::#......................#~~~~~~~#',
  '#:::::::::::#......................#~~~~~~~#',
  '#:::::::::::#......................#~~~~~~~#',
  '#:::::::::::#......................#~~~~~~~#',
  '#:::::::::::#......................#~~~~~~~#',
  '#:::::::::::#......................#~~~~~~~#',
  '#:::::::::::d......................L~~~~~~~#',
  '#:::::::::::d......................L~~~~~~~#',
  '#:::::::::::#......................#~~~~~~~#',
  '#:::::::::::#......................#~~~~~~~#',
  '#:::::::::::#......................#~~~~~~~#',
  '#:::::::::::#......................#~~~~~~~#',
  '#############......................#########',
  '            #______________________#        ',
  '            #______________________#        ',
  '            #______________________#        ',
  '            #______________________#        ',
  '            ###########XX###########        ',
  '                                            ',
];

export interface Point {
  x: number;
  y: number;
}
export interface Tile {
  tx: number;
  ty: number;
}
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type Dir = 'down' | 'up' | 'left' | 'right';
export type DeskAgent = Exclude<AgentId, 'herbie'>;

/** Furniture, placed by the tile its base sits on. */
export type Prop =
  | { kind: 'desk'; agent: DeskAgent; tx: number; ty: number }
  | { kind: 'vitrina'; id: VitrinaId; tx: number; ty: number; from: 'above' | 'below' }
  | { kind: 'plant'; tx: number; ty: number }
  | { kind: 'rack'; tx: number; ty: number }
  | { kind: 'shelf'; tx: number; ty: number }
  | { kind: 'study'; tx: number; ty: number };

export type Target = { kind: 'agent'; agent: AgentId } | { kind: 'vitrina'; id: VitrinaId } | { kind: 'door'; id: 'study' | 'exit' };

export interface Interactable {
  target: Target;
  /** Where the player stands to interact, at their feet. */
  spot: Point;
  /** The tile a path aims for. */
  tile: Tile;
  /** Which way the player looks while interacting. */
  face: Dir;
  /** How far from the spot, in pixels, the player can still interact. */
  reach: { x: number; y: number };
  /** Click and tap area. */
  box: Box;
}

export const PROPS: Prop[] = [
  // office: J.A.R.V.I.S. in the middle, two rows of desks around him
  { kind: 'desk', agent: 'jarvis', tx: 23, ty: 6 },
  { kind: 'desk', agent: 'edith', tx: 15, ty: 10 },
  { kind: 'desk', agent: 'friday', tx: 19, ty: 10 },
  { kind: 'desk', agent: 'arnim', tx: 28, ty: 10 },
  { kind: 'desk', agent: 'sentinel', tx: 32, ty: 10 },
  { kind: 'desk', agent: 'u', tx: 15, ty: 15 },
  { kind: 'desk', agent: 'dume', tx: 19, ty: 15 },
  { kind: 'desk', agent: 'ultron', tx: 28, ty: 15 },
  { kind: 'rack', tx: 32, ty: 15 },
  { kind: 'plant', tx: 13, ty: 3 },
  { kind: 'plant', tx: 34, ty: 3 },
  { kind: 'plant', tx: 13, ty: 19 },
  { kind: 'plant', tx: 34, ty: 19 },
  // archive: one display case per stage of the career, clockwise in time
  { kind: 'vitrina', id: 'education', tx: 1, ty: 4, from: 'below' },
  { kind: 'vitrina', id: 'freelance', tx: 4, ty: 4, from: 'below' },
  { kind: 'vitrina', id: 'nutrilieve', tx: 7, ty: 4, from: 'below' },
  { kind: 'vitrina', id: 'telefonica-aura', tx: 10, ty: 4, from: 'below' },
  { kind: 'vitrina', id: 'telefonica-5gnow', tx: 2, ty: 13, from: 'above' },
  { kind: 'vitrina', id: 'mango', tx: 5, ty: 13, from: 'above' },
  { kind: 'vitrina', id: 'referent', tx: 8, ty: 13, from: 'above' },
  { kind: 'plant', tx: 11, ty: 14 },
  // Sergio's study
  { kind: 'study', tx: 38, ty: 7 },
  { kind: 'shelf', tx: 40, ty: 3 },
  { kind: 'plant', tx: 36, ty: 3 },
  { kind: 'plant', tx: 42, ty: 14 },
];

/** Tiles a prop blocks, as [tx, ty, w, h]. Desks also block the spot behind them. */
function footprint(p: Prop): [number, number, number, number] {
  switch (p.kind) {
    case 'desk':
    case 'study':
    case 'rack':
      return [p.tx, p.ty - 1, 2, 2];
    case 'vitrina':
      return [p.tx, p.ty, 2, 1];
    case 'shelf':
      return [p.tx, p.ty, 3, 1];
    case 'plant':
      return [p.tx, p.ty, 1, 1];
  }
}

const centre = (tx: number, ty: number): Point => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });

function interactableFor(p: Prop): Interactable | null {
  const base = (p.ty + 1) * TILE;
  if (p.kind === 'desk') {
    // stand a step back from the desk, so the agent behind it stays in view
    return {
      target: { kind: 'agent', agent: p.agent },
      spot: { x: (p.tx + 1) * TILE, y: base + 18 },
      tile: { tx: p.tx, ty: p.ty + 2 },
      face: 'up',
      reach: { x: 18, y: 14 },
      box: { x: p.tx * TILE, y: base - 44, w: 32, h: 44 },
    };
  }
  if (p.kind === 'vitrina') {
    const ty = p.from === 'below' ? p.ty + 1 : p.ty - 1;
    return {
      target: { kind: 'vitrina', id: p.id },
      spot: { x: (p.tx + 1) * TILE, y: ty * TILE + TILE / 2 },
      tile: { tx: p.tx, ty },
      face: p.from === 'below' ? 'up' : 'down',
      reach: { x: 18, y: 12 },
      box: { x: p.tx * TILE, y: base - 32, w: 32, h: 32 },
    };
  }
  return null;
}

export class World {
  readonly w = ROWS[0].length;
  readonly h = ROWS.length;
  readonly props = PROPS;
  readonly spawn: Point = { x: 24 * TILE, y: 18 * TILE + 8 };
  readonly herbieSpawn: Point = { x: 26 * TILE + 4, y: 18 * TILE };
  readonly spots: Interactable[];
  private blocked: boolean[];

  constructor() {
    this.blocked = ROWS.flatMap((row) => [...row].map((ch) => '#LX '.includes(ch)));
    for (const p of PROPS) {
      const [x, y, w, h] = footprint(p);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.blocked[(y + j) * this.w + x + i] = true;
    }
    this.spots = [
      ...PROPS.map(interactableFor).filter((i): i is Interactable => i !== null),
      {
        target: { kind: 'door', id: 'study' },
        spot: { x: 34 * TILE + 8, y: 10 * TILE },
        tile: { tx: 34, ty: 9 },
        face: 'right',
        reach: { x: 18, y: 12 },
        box: { x: 35 * TILE, y: 8 * TILE, w: TILE, h: 3 * TILE },
      },
      {
        target: { kind: 'door', id: 'exit' },
        spot: { x: 24 * TILE, y: 19 * TILE + 8 },
        tile: { tx: 23, ty: 19 },
        face: 'down',
        reach: { x: 18, y: 12 },
        box: { x: 23 * TILE, y: 20 * TILE, w: 2 * TILE, h: TILE },
      },
    ];
  }

  /** The tile character at (tx, ty); outside the map is ' '. */
  at(tx: number, ty: number): string {
    return ROWS[ty]?.[tx] ?? ' ';
  }

  solid(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return true;
    return this.blocked[ty * this.w + tx];
  }

  tileAt(p: Point): Tile {
    return { tx: Math.floor(p.x / TILE), ty: Math.floor((p.y - 1) / TILE) };
  }

  centre(t: Tile): Point {
    return centre(t.tx, t.ty);
  }

  /** The static interactable for a target, if it has one. */
  find(target: Target): Interactable | undefined {
    return this.spots.find((s) => JSON.stringify(s.target) === JSON.stringify(target));
  }
}

/** Rows of the map, for drawing the floor and walls. */
export const MAP_ROWS: readonly string[] = ROWS;
