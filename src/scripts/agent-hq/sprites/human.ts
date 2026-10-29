// Human characters on the 32x45 grid, built in layers: hair, head, torso, arms, legs
// and accessories. Every agent faces the viewer; walking characters also have back
// and side views.

import { Grid, curl, fit, shade, type Ink, type Palette } from '../engine/grid.ts';
import { POSES, SKIN, SKIN_SHADE, armsUp, blank, finish, paintArms, type Face, type Facing, type Frame, type Pose } from './body.ts';

const EYE = '#2a1b17';
const BLUSH = '#f2a6a0';
const GLINT = '#ffffff';
const MOUTH = '#9c4a44';
const MOUTH_IN = '#4a1f24';

const HX = 7; // head origin; the head is 18x15
const HY = 6;
const HEAD_INSET = [4, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 4];

// ---------- hair (24 wide, origin = head - (3,4)) ----------
const HAIR = {
  neat: [
    '........######..........',
    '.....############.......',
    '....###############.....',
    '...#################....',
    '..###################...',
    '..####################..',
    '..####################..',
    '..####################..',
    '..####..##############..',
    '..###......###########..',
    '..##..........########..',
    '..##..............####..',
    '..##...............###..',
    '..##...............###..',
    '...#................#...',
  ],
  parted: [
    '........................',
    '......##########........',
    '....###############.....',
    '...#################....',
    '..###################...',
    '..####d###############..',
    '..###d################..',
    '..###d################..',
    '..##d###..############..',
    '..##d.......##########..',
    '..##..........######d#..',
    '..##..............###...',
    '..##...............##...',
    '..##...............##...',
    '...#................#...',
  ],
  swept: [
    '.........########.......',
    '......#############.....',
    '....################....',
    '...##################...',
    '..###################...',
    '..####################..',
    '..######...###########..',
    '..###.........########..',
    '..##.............#####..',
    '..##...............##...',
    '..##...............##...',
    '..##................#...',
    '..##................#...',
    '...#................#...',
  ],
  messy: [
    '.....#..##.##.#.........',
    '....##########.##.......',
    '...################.....',
    '..##################....',
    '..###################...',
    '..####################..',
    '..####################..',
    '..#####################.',
    '..##.##.######.##.####..',
    '..##...#..#.#.....####..',
    '..##...............###..',
    '..##................##..',
    '..##................##..',
    '..##................##..',
    '..##................##..',
  ],
  curly: [
    '......##.##.##.#........',
    '....###############.....',
    '...#################....',
    '..###################...',
    '.#####################..',
    '.######################.',
    '..#####################.',
    '.######################.',
    '.##.###.###.###.###.###.',
    '..#..#...#...#...#..##..',
    '..##................##..',
    '..##................##..',
    '..#.................##..',
    '....................#...',
  ],
  longCenter: [
    '........########........',
    '......#####d######......',
    '.....######d#######.....',
    '....#######d########....',
    '...########d#########...',
    '..#######......#######..',
    '..######........######..',
    '..#####..........#####..',
    '.#####............#####.',
    '.####..............####.',
    '.#####............#####.',
    '..####............####..',
    '..####............####..',
    '.#####............#####.',
    '.####..............####.',
    '.####..............####.',
    '..####............####..',
    '..####............####..',
    '.####..............####.',
    '.####..............####.',
    '..####............####..',
    '..###..............###..',
    '..#.#..............#.#..',
  ],
  longSide: [
    '........########........',
    '......######d#####......',
    '.....#####d#########....',
    '....#####d###########...',
    '...#####d#############..',
    '..#####d.....#########..',
    '..####d.........######..',
    '..#####..........#####..',
    '.#####............#####.',
    '.####..............####.',
    '.#####............#####.',
    '..####............####..',
    '..####............####..',
    '.#####............#####.',
    '.####..............####.',
    '.####..............####.',
    '..####............####..',
    '..####............####..',
    '.####..............####.',
    '.####..............####.',
    '..####............####..',
    '..###..............###..',
    '..#.#..............#.#..',
  ],
  wisps: [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '..##................##..',
    '.###................###.',
    '####................####',
    '####................####',
    '.###................###.',
    '####................####',
    '.##..................##.',
  ],
};
export type HairStyle = keyof typeof HAIR;

// Long hair also has a mass behind the head and shoulders.
const BACK_HAIR = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '...##################...',
  '..####################..',
  '..####################..',
  '.######################.',
  '.######################.',
  '########################',
  '.######################.',
  '.######################.',
  '########################',
  '.######################.',
  '.######################.',
  '########################',
  '########################',
  '.######################.',
  '#######################.',
  '.######################.',
  '..####################..',
  '.#####################..',
  '..###################...',
  '..####.##########.##....',
  '...##...########...#....',
];

// ---------- beards (18 wide, head-relative) ----------
const BEARD = {
  full: {
    y: 5,
    rows: [
      '#................#',
      '#................#',
      '##..............##',
      '##..............##',
      '##..............##',
      '###............###',
      '####..........####',
      '#####.######.#####',
      '.################.',
      '..##############..',
      '...############...',
      '.....########.....',
    ],
  },
  wizard: {
    y: 9,
    rows: [
      '#................#',
      '##..............##',
      '###.##########.###',
      '####d########d####',
      '##################',
      '##################',
      '.################.',
      '.################.',
      '..##############..',
      '..##############..',
      '...############...',
      '....##########....',
      '.....########.....',
      '......######......',
    ],
  },
};

// ---------- torsos (12x10 at x=10) ----------
const TORSO = {
  vest: ['.IIiiiiiiII.', 'IMMMITTIMMMI', 'IMMMMTTMMMMI', 'IMMMMTTMMMMI', 'IMMMMtTMMMMI', 'IMMMMMMMMMmI', 'IMMMMXMMMMmI', 'IMMMMMMMMMmI', 'IMMMMXMMMMmI', 'mmmmmmmmmmmm'],
  suit: ['.OOoIIIIoOO.', 'OOOoIIIIoOOO', 'OOOOoIIoOOXO', 'OOOOOooOOOOO', 'OOOOOOoOOOOO', 'OOOOOOoOOOOO', 'OOOOOOoOOOOO', 'OOOOOOoOOOOO', 'OOOOOOoOOOoO', 'ooooooooooo.'],
  labcoat: ['.OOoITTIoOO.', 'OOOoMTTMoOOO', 'OOOoMTTMoXOO', 'OOOoMTTMoOOO', 'OOOoMMMMoOOO', 'OOOoMMMMoOOO', 'OOOoMMMMoOOO', 'OOOoMMMMoOOO', 'OOOoMMMMoOOO', 'OOOommmmoOOO'],
  jumpsuit: ['.LLoIIIIoLL.', 'OLLoIIIIoLLO', 'OOOOoIIoOOOO', 'OoooOoOOoooO', 'OOOOOoOOOOOO', 'OOOOOoOOOOOO', 'OOOOOoOOOOOO', 'OOOOOoOOOOOO', 'OOOOOoOOOOOO', 'oooooooooooo'],
  flannel: ['.PPpIiiIpPP.', 'PPPpIIIIpPPP', 'PPPpIIIIpPPP', 'PPPpIIIIpPPP', 'PPPpIIIIpPPP', 'PPPpIIIIpPPP', 'PPPpIIIIpPPP', 'PPPpIIIIpPPP', 'PPPpiiiipPPP', 'PPPpiiiipPPP'],
  blazer: ['.OOoTTTToOO.', 'OOOoIIIIoOOO', 'OOOOoIIoOOOO', 'OOOOOooOOOOO', 'OOOOOOoOOOOO', 'OOOOOOXOOOOO', 'OOOOOOoOOOOO', 'OOOOOOoOOOOO', 'OOOOOOoOOOoO', 'ooooooooooo.'],
  frock: ['.OOoTTTToOO.', 'OOOoMTTMoOOO', 'OOOoMttMoOOO', 'OOOoMMMMoOOO', 'OOOoMXXMoOOO', 'OOOoMMMXoOOO', 'OOOoMMMMoOOO', 'OOOoMMMMoOOO', 'OOOoMMMMoOOO', 'OOOommmmoOOO'],
  // hoodie with a lanyard (R) and a visitor badge (B, b)
  hoodie: ['.OOoRIIRoOO.', 'OOOoRIIRoOOO', 'OOOOoRRoOOOO', 'OOOOOBBOOOOO', 'OOOOObbOOOOO', 'OOOOOOOOOOOo', 'OOOooooooOOo', 'OOOoOOOOoOOo', 'OOOoOOOOoOOo', 'oooooooooooo'],
};
export type Outfit = keyof typeof TORSO;
const TAIL_ROW = 'OOOo....oOOO';

// Back and side views, used by characters that walk around the office.
const BACK_TORSO = ['.OOooooooOO.', 'OOOoOOOOoOOO', 'OOOOooooOOOO', 'OOOOOOOOOOOo', 'OOOOOOOOOOOo', 'OOOOOOOOOOOo', 'OOOOOOOOOOOo', 'OOOOOOOOOOOo', 'OOOOOOOOOOOo', 'oooooooooooo'];
const SIDE_TORSO = ['.oOOOOO.', 'oOOOOORO', 'oOOOOOOR', 'oOOOOOOB', 'oOOOOOOb', 'oOOOOOOO', 'oOOOOOOO', 'oOOOOOOO', 'oOOOOOOO', 'oooooooo'];

// Head in profile facing right, 18 wide at the head origin.
const SIDE_HEAD = [
  '.....#######......',
  '...###########....',
  '..##############..',
  '.################.',
  '.################.',
  '.##########KKKKK#.',
  '.########KKKKKKKK.',
  '.#######KKKKKKKKK.',
  '.######KKKKKKEEKK.',
  '.#####kkKKKKKEEKKK',
  '.#####kkKKKKKEEKK.',
  '..####KKKKKKKbbKK.',
  '...###KKKKKKKKKKk.',
  '....##kKKKKKKKKk..',
  '......kkkkkkkkk...',
];

const SIDE_ARM = {
  down: { x: 14, rows: ['AA', 'AA', 'AA', 'Aa', 'Aa', 'Aa', 'Aa', 'KK', 'Kk'] },
  forward: { x: 14, rows: ['AA..', 'AA..', 'AAa.', '.AA.', '.AAa', '..Aa', '..KK', '..Kk'] },
  back: { x: 11, rows: ['...AA', '...AA', '..aAA', '..AA.', '.aA..', '.Aa..', 'KK...', 'Kk...'] },
};

// Legs in profile, 14 wide at x=9 from y=31: standing and mid-stride.
const SIDE_LEGS = {
  stand: ['....PPPPPP....', '....PPPPPP....', '.....PPPP.....', '.....PPPP.....', '.....PPPP.....', '.....PPPP.....', '.....FFFFFf...', '.....SSSSSS...'],
  stride: ['....PPPPPP....', '...pPPPPPPP...', '...ppp.PPPP...', '..ppp...PPPP..', '..pp.....PPP..', '.ppp.....PPP..', 'FFFf......FFFf', 'SSSS......SSSS'],
};

// ---------- look ----------
export interface HumanLook {
  kind: 'human';
  hair: HairStyle;
  hairColor: Palette;
  outfit: Outfit;
  /** Outfit colors by template char. P/p are trousers, F/f/S shoes, A/a sleeves. */
  pal: Palette;
  beard?: keyof typeof BEARD;
  beardColor?: Palette;
  blush?: boolean;
  glasses?: string;
  hat?: boolean;
  book?: boolean;
  /** Coat tails below the torso, in rows. */
  tails?: number;
}

const solid = (ink: Ink | undefined, fallback: string): string => (typeof ink === 'string' ? ink : fallback);
const skinMap: Palette = { K: SKIN, k: SKIN_SHADE };

// ---------- body parts ----------
function legs(g: Grid, a: HumanLook, lift: [number, number]): void {
  const pants = solid(a.pal.Pa ?? a.pal.P, '#2a262f');
  const dark = solid(a.pal.pa ?? a.pal.p, '#18151c');
  const shoe = solid(a.pal.F, '#1a1416');
  g.rect(11, 31, 10, 3, pants);
  g.rect(15, 33, 2, 1, dark);
  ([[11, 14, 10, lift[0]], [17, 17, 17, lift[1]]] as const).forEach(([x, inner, shoeX, l], side) => {
    g.rect(x, 34, 4, 3 - l, pants);
    for (let y = 32; y < 37 - l; y++) g.set(inner, y, dark);
    g.rect(shoeX, 37 - l, 5, 2, shoe);
    if (typeof a.pal.S === 'string') g.rect(shoeX, 38 - l, 5, 1, a.pal.S);
    g.set(side ? shoeX + 3 : shoeX + 1, 37 - l, solid(a.pal.f, shoe));
  });
}

function torso(g: Grid, a: HumanLook, b: number): void {
  const y0 = 21 + b;
  if (a.tails) {
    for (let j = 0; j < a.tails; j++) g.paint([TAIL_ROW], 10, y0 + 10 + j, { O: a.pal.O, o: a.pal.o });
  }
  g.paint(TORSO[a.outfit], 10, y0, a.pal);
}

function head(g: Grid, b: number, blink: boolean, blush: boolean, face?: Face): void {
  for (let j = 0; j < 15; j++) {
    const i0 = HEAD_INSET[j];
    const next = HEAD_INSET[j + 1] ?? 18;
    for (let i = i0; i < 18 - i0; i++) {
      const edge = i === 17 - i0 || j === 14 || i < next || i >= 18 - next;
      g.set(HX + i, HY + b + j, edge && i > 3 ? SKIN_SHADE : SKIN);
    }
  }
  const y = HY + b + 8;
  const eyes = [HX + 5, HX + 11];
  if (blink) {
    eyes.forEach((x) => g.rect(x, y + 2, 2, 1, EYE));
  } else if (face?.look === 'happy') {
    // eyes squeezed into little arches
    eyes.forEach((x) => {
      g.rect(x, y + 1, 2, 1, EYE);
      g.set(x - 1, y + 2, EYE);
      g.set(x + 2, y + 2, EYE);
    });
  } else if (face?.look === 'serious') {
    eyes.forEach((x) => g.rect(x, y + 1, 2, 2, EYE));
  } else {
    const tall = face?.look === 'surprised' ? 1 : 0;
    eyes.forEach((x) => {
      g.rect(x, y - tall, 2, 3 + tall, EYE);
      if (face) g.set(x, y - tall, GLINT);
    });
  }
  if (blush) {
    g.rect(HX + 3, y + 3, 2, 1, BLUSH);
    g.rect(HX + 13, y + 3, 2, 1, BLUSH);
  }
}

/** Splash art only: a small mouth that smiles, flattens or opens mid-word. Drawn over any beard. */
function mouth(g: Grid, b: number, face: Face): void {
  const x = HX + 8;
  const y = HY + b + 12;
  if (face.look === 'happy') {
    if (face.open) {
      g.rect(x - 1, y, 4, 1, MOUTH_IN);
      g.rect(x, y + 1, 2, 1, MOUTH);
    } else {
      g.set(x - 1, y, MOUTH);
      g.rect(x, y + 1, 2, 1, MOUTH);
      g.set(x + 2, y, MOUTH);
    }
  } else if (face.look === 'surprised' || face.open) {
    g.rect(x, y, 2, 2, MOUTH_IN);
  } else if (face.look === 'serious') {
    g.rect(x - 1, y, 4, 1, MOUTH);
  } else {
    g.rect(x, y, 2, 1, MOUTH);
  }
}

function glasses(g: Grid, b: number, color: string): void {
  const y = HY + b + 7;
  for (const ex of [HX + 4, HX + 10]) {
    g.rect(ex + 1, y, 2, 1, color);
    g.rect(ex + 1, y + 4, 2, 1, color);
    g.rect(ex, y + 1, 1, 3, color);
    g.rect(ex + 3, y + 1, 1, 3, color);
  }
  g.rect(HX + 8, y + 1, 2, 1, color);
  g.rect(HX + 1, y + 1, 3, 1, color);
  g.rect(HX + 14, y + 1, 3, 1, color);
}

function hat(g: Grid, b: number): void {
  g.rect(10, b, 12, 7, '#231c20');
  g.rect(11, b, 3, 5, '#3a3036');
  g.rect(10, b + 5, 12, 2, '#5c2626');
  g.rect(6, b + 7, 20, 1, '#231c20');
  g.rect(5, b + 8, 22, 1, '#18131a');
  g.rect(7, b + 7, 6, 1, '#3a3036');
}

function book(g: Grid, b: number): void {
  const y = 23 + b;
  g.rect(10, y, 5, 7, '#8a3b28');
  g.rect(10, y, 1, 7, '#5e2618');
  g.rect(11, y + 2, 3, 1, '#d9b36c');
  g.rect(14, y + 1, 1, 6, '#efe2cd');
  g.rect(8, y + 5, 3, 2, SKIN);
  g.rect(10, y + 5, 1, 2, SKIN_SHADE);
}

function hairRows(a: HumanLook): string[] {
  return a.hair === 'curly' ? curl(shade(HAIR[a.hair])) : shade(HAIR[a.hair]);
}

function backHair(g: Grid, a: HumanLook, b: number): void {
  if (!a.hair.startsWith('long')) return;
  const back: Palette = { '#': a.hairColor.d, d: '#1a0f09', l: a.hairColor['#'] };
  g.paint(shade(BACK_HAIR), HX - 3, HY - 4 + b, back);
}

// ---------- views ----------
function front(a: HumanLook, f: Frame, blink: boolean, face?: Face): Grid {
  const g = blank();
  const arms: Palette = { ...a.pal, ...skinMap };
  backHair(g, a, f.b);
  legs(g, a, f.legs ?? [0, 0]);
  torso(g, a, f.b);
  if (!armsUp(f)) paintArms(g, f, arms);
  head(g, f.b, blink, a.blush !== false, face);
  if (a.beard) {
    const bd = BEARD[a.beard];
    g.paint(shade(bd.rows), HX, HY + f.b + bd.y, a.beardColor ?? a.hairColor);
  }
  if (face) mouth(g, f.b, face);
  g.paint(hairRows(a), HX - 3, HY - 4 + f.b, a.hairColor);
  if (a.book && f.arms[0] === 'down' && !f.desk) book(g, f.b);
  if (a.glasses) glasses(g, f.b, a.glasses);
  if (a.hat) hat(g, f.b);
  if (armsUp(f)) paintArms(g, f, arms);
  return g;
}

/** The back of the head: hair and skull merged into one mass, with ears showing. */
function backOfHead(a: HumanLook): string[] {
  const hair = HAIR[a.hair];
  const rows = Math.max(hair.length, 19);
  const out: string[] = [];
  for (let j = 0; j < rows; j++) {
    let row = '';
    for (let i = 0; i < 24; i++) {
      const inHair = (hair[j]?.[i] ?? '.') !== '.';
      const hj = j - 4;
      const hi = i - 3;
      const inHead = hj >= 0 && hj < 15 && hi >= HEAD_INSET[hj] && hi < 18 - HEAD_INSET[hj];
      row += inHair || inHead ? '#' : '.';
    }
    out.push(row);
  }
  return a.hair === 'curly' ? curl(shade(out)) : shade(out);
}

function back(a: HumanLook, f: Frame): Grid {
  const g = blank();
  legs(g, a, f.legs ?? [0, 0]);
  g.paint(BACK_TORSO, 10, 21 + f.b, a.pal);
  paintArms(g, f, { ...a.pal, ...skinMap });
  g.paint(backOfHead(a), HX - 3, HY - 4 + f.b, a.hairColor);
  for (const x of [HX - 1, HX + 18]) g.rect(x, HY + f.b + 8, 1, 2, SKIN_SHADE);
  backHair(g, a, f.b);
  return g;
}

function side(a: HumanLook, f: Frame, blink: boolean, step: number): Grid {
  const g = blank();
  const striding = step % 2 === 1;
  const legPal: Palette = { P: a.pal.Pa ?? a.pal.P, p: a.pal.pa ?? a.pal.p, F: a.pal.F, f: a.pal.f, S: a.pal.S ?? a.pal.F };
  g.paint(SIDE_LEGS[striding ? 'stride' : 'stand'], 9, 31, legPal);
  g.paint(SIDE_TORSO, 12, 21 + f.b, a.pal);
  const headRows = shade(SIDE_HEAD).map((r, j) => (blink && j >= 8 && j <= 9 ? r.replace(/E/g, 'K') : r));
  g.paint(headRows, HX, HY + f.b, { ...a.hairColor, ...skinMap, E: EYE, b: a.blush === false ? SKIN : BLUSH });
  const arm = !striding ? SIDE_ARM.down : step === 1 ? SIDE_ARM.forward : SIDE_ARM.back;
  g.paint(fit(arm.rows, arm.rows[0].length), arm.x, 21 + f.b, { ...a.pal, ...skinMap });
  return g;
}

export function renderHuman(a: HumanLook, pose: Pose, frame: number, blink = false, facing: Facing = 'down', face?: Face): Grid {
  const frames = POSES[pose];
  const f = frames[frame % frames.length];
  if (facing === 'up') return finish(back(a, f), f);
  if (facing === 'side') return finish(side(a, f, blink, pose === 'walk' ? frame % 4 : 0), f);
  return finish(front(a, f, blink, face), f);
}

