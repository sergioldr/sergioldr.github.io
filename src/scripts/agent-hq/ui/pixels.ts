// The pixel look of the HTML interface: palette, nine-slice frames, icons and cursor, all
// drawn from ASCII patterns like the font. No DOM, so the page inlines them at build time.

import { VOID } from '../world/room.ts';

/** The plaques on the office walls, paper from the Archive and gold for what matters. */
export const PALETTE = {
  void: VOID,
  ink: '#1d1521',
  plaque: '#2b2735',
  plaqueHi: '#4a4458',
  plaqueEdge: '#6a6378',
  plaqueShade: '#221e2b',
  /** Top of the dialog and window gradient, which ends in `plaque`. */
  boxTop: '#1c1923',
  cream: '#f6f3ee',
  creamDim: '#b9b3a6',
  gold: '#f2c95c',
  goldHi: '#f8df92',
  goldShade: '#c99a2e',
  goldDim: '#8a7638',
  goldInk: '#7a5a12',
  paper: '#efe5cf',
  paperShade: '#d8cdb8',
  paperInk: '#6b5f52',
  green: '#5fd38a',
  greenInk: '#256b3d',
  red: '#c23a3a',
  redHi: '#d85a5a',
  redShade: '#8f2626',
} as const;

/** Pattern letters; '#' is `currentColor` and '.' is see-through. */
const COLORS: Record<string, string> = {
  K: PALETTE.ink,
  P: PALETTE.plaque,
  H: PALETTE.plaqueHi,
  E: PALETTE.plaqueEdge,
  S: PALETTE.plaqueShade,
  C: PALETTE.cream,
  c: PALETTE.creamDim,
  G: PALETTE.gold,
  Y: PALETTE.goldHi,
  g: PALETTE.goldShade,
  o: PALETTE.goldDim,
  W: PALETTE.paper,
  D: PALETTE.paperShade,
  R: PALETTE.red,
  Q: PALETTE.redHi,
  r: PALETTE.redShade,
};

/** An SVG of a pattern, one rect per run of the same colour on a row. */
export function pixelSvg(rows: readonly string[], zoom = 1): string {
  const w = rows[0].length;
  const h = rows.length;
  let rects = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < w; ) {
      const ch = row[x];
      let n = 1;
      while (row[x + n] === ch) n++;
      if (ch !== '.') rects += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${ch === '#' ? 'currentColor' : COLORS[ch]}"/>`;
      x += n;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * zoom}" height="${h * zoom}" shape-rendering="crispEdges">${rects}</svg>`;
}

/**
 * Nine-slice frames, light from the top left. The CSS cuts 3 pixels from each side of the
 * 7×7 ones and 2 from the 5×5 ones; the corners stay, the edges and middle stretch.
 */
const FRAMES: Record<string, string[]> = {
  // the dialog and window border: ink, then a thin line of old gold; the CSS paints the inside
  box: ['KKKKK', 'KoooK', 'Ko.oK', 'KoooK', 'KKKKK'],
  notice: ['.KKKKK.', 'KYGGGGK', 'KGPPPgK', 'KGPPPgK', 'KGPPPgK', 'KgggggK', '.KKKKK.'],
  button: ['.KKK.', 'KHHHK', 'KHPSK', 'KSSSK', '.KKK.'],
  pressed: ['.KKK.', 'KSSSK', 'KSPPK', 'KPPPK', '.KKK.'],
  gold: ['.KKK.', 'KYYYK', 'KYGgK', 'KgggK', '.KKK.'],
  'gold-pressed': ['.KKK.', 'KgggK', 'KgGGK', 'KGGGK', '.KKK.'],
  red: ['.KKK.', 'KQQQK', 'KQRrK', 'KrrrK', '.KKK.'],
  paper: ['.KKK.', 'KWWWK', 'KWWDK', 'KDDDK', '.KKK.'],
  chosen: ['.KKK.', 'KGGGK', 'KGWGK', 'KGGGK', '.KKK.'],
  key: ['.KKK.', 'KCCCK', 'KCCcK', 'KcccK', '.KKK.'],
};

const ICONS = {
  pin: ['.#####.', '##...##', '##...##', '##...##', '.##.##.', '..###..', '...#...'],
  cards: ['..#####', '..#...#', '#####.#', '#...#.#', '#...###', '#...#..', '#####..'],
  case: ['..###..', '..#.#..', '#######', '#.....#', '#######', '#.....#', '#######'],
  menu: ['#######', '.......', '#######', '.......', '#######'],
  close: ['##...##', '###.###', '.#####.', '..###..', '.#####.', '###.###', '##...##'],
  star: ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'],
  sound: ['..#..#.', '.##...#', '###.#.#', '###.#.#', '###.#.#', '.##...#', '..#..#.'],
  mute: ['..#....', '.##....', '###.#.#', '###..#.', '###.#.#', '.##....', '..#....'],
  full: ['###.###', '#.....#', '#.....#', '.......', '#.....#', '#.....#', '###.###'],
  alert: ['.KKKKKKK.', 'KGGGGGGGK', 'KGGGKGGGK', 'KGGGKGGGK', 'KGGGKGGGK', 'KGGGGGGGK', 'KGGGKGGGK', 'KGGGGGGGK', '.KKKKKKK.'],
  down: ['#####', '.###.', '..#..'],
  right: ['#..', '##.', '###', '##.', '#..'],
  left: ['..#', '.##', '###', '.##', '..#'],
  // the experience page's two extras: the CV coming down into a tray, and a speech bubble
  download: ['..###..', '..###..', '#######', '.#####.', '..###..', '...#...', '.......', '#######'],
  chat: ['.#######.', '#########', '##.#.#.##', '#########', '.#######.', '..##.....', '..#......'],
  // the title screen's two ways in: a plaque-coloured briefcase with a gold clasp, and a
  // controller in Herbie's shell colours with a red and a gold button
  briefcase: [
    '.....KKKKKK.....',
    '....KHHHHHHK....',
    '....KHKKKKHK....',
    '....KPK..KPK....',
    '.KKKKKKKKKKKKKK.',
    'KGHHHHHHHHHHHHGK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPKKKKPPPPPK',
    'KSSSSSKYGKSSSSSK',
    'KEEEEEKGgKEEEEEK',
    'KPPPPPKKKKPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KgSSSSSSSSSSSSgK',
    '.KKKKKKKKKKKKKK.',
  ],
  gamepad: [
    '..KKKKKKKKKKKKKK..',
    '.KCCCCCCCCCCCCCCK.',
    'KCWWWWWWWWWWWWWWDK',
    'KCWWWWWWWWWWWQRWDK',
    'KCWWKWWWWWWWWRrWDK',
    'KCWKKKWWEEWYGWWWDK',
    'KCWWKWWWWWWGgWWWDK',
    'KCWWWWWWWWWWWWWWDK',
    'KDDDDDDKKKKDDDDDDK',
    '.KDDDDK....KDDDDK.',
    '..KKKK......KKKK..',
  ],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICONS;

/** An inline icon; CSS sizes it at one interface pixel per pattern pixel. */
export function icon(name: IconName, cls = ''): string {
  const rows = ICONS[name];
  return pixelSvg(rows).replace(
    '<svg ',
    `<svg class="px-icon${cls ? ` ${cls}` : ''}" aria-hidden="true" focusable="false" style="--w:${rows[0].length};--h:${rows.length}" `,
  );
}

const CURSOR = [
  'K........',
  'KK.......',
  'KCK......',
  'KCCK.....',
  'KCCCK....',
  'KCCCCK...',
  'KCCCCCK..',
  'KCCCCCCK.',
  'KCCCCKKKK',
  'KCCKCK...',
  'KCK.KCK..',
  'KK..KCK..',
  'K....KCK.',
  '.....KCK.',
  '......K..',
];

const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** The palette, frames, CSS-drawn icons and cursor as `--hq-*` custom properties. */
export function hqCss(): string {
  const vars = [
    ...Object.entries(PALETTE).map(([k, v]) => `--hq-${kebab(k)}:${v}`),
    ...Object.entries(FRAMES).map(([k, rows]) => `--hq-frame-${k}:${url(pixelSvg(rows))}`),
    `--hq-icon-right:${url(pixelSvg(ICONS.right))}`,
    `--hq-cursor:${url(pixelSvg(CURSOR, 2))} 0 0, pointer`,
  ];
  return `:root{${vars.join(';')}}`;
}
