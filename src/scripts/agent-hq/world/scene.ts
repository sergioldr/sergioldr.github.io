// Draws the game every frame: the background and the ring marking where a tap is headed,
// then furniture and characters sorted by how far down the screen they stand, then the
// pointer. Agents at their desks idle and type on their own; the game can override that
// with a wave or a cheer.
//
// The canvas has as many pixels as the screen. Sprites keep their big square pixels,
// but anything that moves is placed to the nearest screen pixel, not the nearest sprite
// pixel, so walking and floating glide instead of jumping several screen pixels at a time.

import { agentById, type AgentId } from '../../../data/agents.ts';
import { education, roles } from '../../../data/experience.ts';
import type { Game } from '../core/game.ts';
import { SpriteCache, frameAt } from '../engine/canvas.ts';
import { text, textWidth } from '../engine/font.ts';
import { Grid } from '../engine/grid.ts';
import { renderCharacter, type CharacterId } from '../sprites/cast.ts';
import type { Facing, Pose } from '../sprites/body.ts';
import { propKey, renderProp } from '../sprites/props.ts';
import { TILE, type DeskAgent, type Interactable, type Point, type Prop } from './map.ts';
import { VOID, drawClockHands, drawRoom } from './room.ts';

const INK = '#1d1521';
const FPS: Record<Pose, number> = { idle: 3, walk: 8, work: 8, cheer: 8, wave: 5 };
/** Pixels walked per frame of the walk cycle, so the feet keep pace with the ground. */
export const STRIDE = 9;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Radii of the destination ring: it lands wide and closes in, then breathes until arrival. */
const LANDING: [number, number][] = [[10, 4], [8, 3]];
const BREATH: [number, number][] = [[7, 3], [6, 3]];

/**
 * A gold ring lying on the floor, flattened like the shadows. The ink outline is on the
 * outside only, so the floor shows through the middle; lit from above like the plaques.
 */
function ring(rx: number, ry: number): Grid {
  const g = new Grid(rx * 2 + 3, ry * 2 + 3);
  const inside = (x: number, y: number) => ((x - rx - 1) / (rx + 0.5)) ** 2 + ((y - ry - 1) / (ry + 0.5)) ** 2 <= 1;
  const touches = (x: number, y: number, side: boolean) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inside(x + dx, y + dy) === side);
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      if (!inside(x, y)) {
        if (touches(x, y, true)) g.set(x, y, INK);
      } else if (touches(x, y, false)) {
        g.set(x, y, y === 1 ? '#f8df92' : y === g.h - 2 ? '#c99a2e' : '#f2c95c');
      }
    }
  }
  return g;
}

/** First year of each display case, for the plate on its cabinet. */
const YEARS: Record<string, number> = {
  ...Object.fromEntries(roles.map((r) => [r.id, r.since])),
  education: Math.min(...education.map((e) => Number(e.years.slice(0, 4)))),
};

interface Ambient {
  mode: 'idle' | 'work';
  since: number;
  until: number;
  blinkAt: number;
}

interface Drawable {
  /** Where it touches the floor; larger is drawn later, in front. */
  base: number;
  draw(): void;
}

export class Scene {
  /** CSS pixels per sprite pixel: a whole number of screen pixels, so the pixel art stays even. */
  scale = 3;
  /** Canvas pixels per sprite pixel (the zoom times the screen's pixel ratio). */
  private ratio = 3;
  /** Viewport in sprite pixels. */
  vw = 320;
  vh = 180;
  readonly cam: Point = { x: 0, y: 0 };
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private game: Game;
  private reduce: boolean;
  private room: HTMLCanvasElement;
  private sprites = new SpriteCache();
  private plates = new Map<string, HTMLCanvasElement>();
  private ambient = new Map<DeskAgent, Ambient>();
  private herbieEyes = { blinkAt: 0 };
  /** The destination the ring is marking and when it was tapped, for the landing. */
  private landing: { dest: Point | null; at: number } = { dest: null, at: 0 };
  /** Camera offset for this frame, already on the screen-pixel grid. */
  private ox = 0;
  private oy = 0;

  constructor(canvas: HTMLCanvasElement, game: Game, reduce: boolean) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.game = game;
    this.reduce = reduce;
    const hour = new Date().getHours();
    this.room = drawRoom(game.world, hour >= 20 || hour < 7);
    const now = performance.now();
    game.world.props.forEach((p, i) => {
      if (p.kind !== 'desk') return;
      const working = reduce ? i % 3 === 1 : Math.random() < 0.4;
      this.ambient.set(p.agent, { mode: working ? 'work' : 'idle', since: now, until: now + rand(1500, 6000), blinkAt: now + rand(800, 4000) });
    });
    this.follow(0, true);
    this.warm();
  }

  /**
   * Draw the frames the game is about to need a few at a time while the browser is idle,
   * so the first step in a new direction or a new pose never stalls a frame.
   */
  private warm(): void {
    const jobs: (() => void)[] = [];
    for (const facing of ['side', 'up', 'down'] as const) {
      for (const pose of ['walk', 'idle'] as const) for (let f = 0; f < 4; f++) jobs.push(() => this.character('operator', pose, f, false, facing));
    }
    for (const id of [...this.ambient.keys(), 'herbie' as const]) {
      for (const pose of ['idle', 'work', 'wave', 'cheer'] as const) {
        for (let f = 0; f < 4; f++) for (const blink of [false, true]) jobs.push(() => this.character(id, pose, f, blink));
      }
    }
    const later = (fn: (d: IdleDeadline) => void) =>
      'requestIdleCallback' in window ? requestIdleCallback(fn) : setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 6 }), 40);
    const run = (d: IdleDeadline) => {
      while (jobs.length && d.timeRemaining() > 2) jobs.shift()!();
      if (jobs.length) later(run);
    };
    later(run);
  }

  /**
   * Fit the canvas to its box: as many sprite pixels as fit at a whole-number zoom, rounded
   * to whole screen pixels (a 150% screen at zoom 3 gets 5 screen pixels, not 4.5), and
   * centred on the screen-pixel grid so the canvas is never resampled.
   */
  resize(cssW: number, cssH: number): void {
    const dpr = window.devicePixelRatio || 1;
    const zoom = Math.max(2, Math.min(6, Math.floor(Math.min(cssW / 300, cssH / 170))));
    this.ratio = Math.max(1, Math.round(zoom * dpr));
    this.scale = this.ratio / dpr;
    this.vw = Math.ceil(cssW / this.scale);
    this.vh = Math.ceil(cssH / this.scale);
    this.canvas.width = this.vw * this.ratio;
    this.canvas.height = this.vh * this.ratio;
    this.canvas.style.width = `${this.vw * this.scale}px`;
    this.canvas.style.height = `${this.vh * this.scale}px`;
    this.canvas.style.left = `${Math.round(((cssW - this.vw * this.scale) / 2) * dpr) / dpr}px`;
    this.canvas.style.top = `${Math.round(((cssH - this.vh * this.scale) / 2) * dpr) / dpr}px`;
    this.follow(0, true);
  }

  /** Screen position (client pixels) to map position. */
  toWorld(clientX: number, clientY: number): Point {
    const r = this.canvas.getBoundingClientRect();
    return { x: (clientX - r.left) / this.scale + this.cam.x, y: (clientY - r.top) / this.scale + this.cam.y };
  }

  /** The front-most interactable under a map position. */
  hit(p: Point): Interactable | null {
    const under = this.game.interactables().filter((t) => p.x >= t.box.x && p.x < t.box.x + t.box.w && p.y >= t.box.y && p.y < t.box.y + t.box.h);
    under.sort((a, b) => b.box.y + b.box.h - (a.box.y + a.box.h));
    return under[0] ?? null;
  }

  /** Round to the nearest canvas pixel. */
  private snap(v: number): number {
    return Math.round(v * this.ratio) / this.ratio;
  }

  /** Keep the operator in view: snap on resize, otherwise glide at the same pace at any frame rate. */
  private follow(dt: number, snap = false): void {
    const { player } = this.game;
    const mapW = this.game.world.w * TILE;
    const mapH = this.game.world.h * TILE;
    const clamp = (v: number, size: number, view: number) => (view >= size ? (size - view) / 2 : Math.max(0, Math.min(size - view, v)));
    const tx = clamp(player.x - this.vw / 2, mapW, this.vw);
    const ty = clamp(player.y - 20 - this.vh / 2, mapH, this.vh);
    const k = snap || this.reduce ? 1 : 1 - Math.exp(-dt * 7);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
  }

  private character(id: CharacterId, pose: Pose, frame: number, blink: boolean, facing: Facing = 'down'): HTMLCanvasElement {
    return this.sprites.get(`${id}|${pose}|${facing}|${frame}|${blink}`, () => renderCharacter(id, pose, frame, blink, facing));
  }

  /** A small label in the pixel font, drawn once and reused. */
  private plate(label: string, bg: string, fg: string, w = textWidth(label) + 4): HTMLCanvasElement {
    const key = `${label}|${bg}|${fg}|${w}`;
    let c = this.plates.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = w;
      c.height = 7;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, 7);
      text(ctx, label, Math.round((w - textWidth(label)) / 2), 1, fg);
      this.plates.set(key, c);
    }
    return c;
  }

  private blinking(a: { blinkAt: number }, now: number): boolean {
    if (this.reduce) return false;
    if (now > a.blinkAt + 140) a.blinkAt = now + rand(1800, 5200);
    return now > a.blinkAt;
  }

  /** A wave or cheer the game asked for, with its frame. */
  private mood(agent: AgentId): { pose: Pose; frame: number } | null {
    const m = this.game.moods.get(agent);
    if (!m || this.game.time >= m.until) return null;
    return { pose: m.pose, frame: this.reduce ? 0 : frameAt(this.game.time * 1000, m.since * 1000, FPS[m.pose], 4) };
  }

  /** What an agent at a desk is doing: the game's mood if any, otherwise idling or typing. */
  private agentFrame(agent: DeskAgent, now: number): { pose: Pose; frame: number } {
    const mood = this.mood(agent);
    if (mood) return mood;
    const a = this.ambient.get(agent)!;
    if (!this.reduce && now > a.until) {
      a.mode = a.mode === 'work' ? 'idle' : Math.random() < 0.55 ? 'work' : 'idle';
      a.since = now;
      a.until = now + (a.mode === 'work' ? rand(4000, 9000) : rand(1500, 5000));
    }
    return { pose: a.mode, frame: this.reduce ? 0 : frameAt(now, a.since, FPS[a.mode], 4) };
  }

  private drawProp(p: Prop, now: number, near: Interactable | null): Drawable {
    const ctx = this.ctx;
    const base = (p.ty + 1) * TILE;
    const x = p.tx * TILE - this.ox;
    const y = base - this.oy;
    const open = p.kind === 'vitrina' ? this.game.isCaseOpen(p.id) : true;
    const img = this.sprites.get(propKey(p, { open }), () => renderProp(p, { open }));
    return {
      base,
      draw: () => {
        if (p.kind === 'desk') {
          const { pose, frame } = this.agentFrame(p.agent, now);
          ctx.drawImage(this.character(p.agent, pose, frame, this.blinking(this.ambient.get(p.agent)!, now)), x, y - 44);
          ctx.drawImage(img, x, y - 44);
          const hot = near?.target.kind === 'agent' && near.target.agent === p.agent;
          const agent = agentById[p.agent];
          const plate = this.plate(agent.short, hot ? agent.accent : 'rgba(29,21,33,0.78)', '#f6f3ee');
          ctx.drawImage(plate, x + 16 - Math.ceil(plate.width / 2), y - 8);
          if (this.game.playing && !this.game.state.agentdex.includes(p.agent)) this.bubble(x + 16, y - 50, now);
        } else if (p.kind === 'vitrina') {
          ctx.drawImage(img, x, y - img.height);
          ctx.drawImage(this.plate(String(YEARS[p.id] ?? ''), 'rgba(29,21,33,0.85)', open ? '#f2c95c' : '#b9b3a6', 19), x + 7, y - 8);
        } else if (p.kind === 'study') {
          ctx.drawImage(img, x, y - 44);
        } else {
          ctx.drawImage(img, x, y - img.height);
          if (p.kind === 'rack') this.leds(x, y - img.height, now);
        }
      },
    };
  }

  /** Blinking lights on the server rack. */
  private leds(x: number, y: number, now: number): void {
    for (let k = 0; k < 5; k++) {
      for (let i = 0; i < 3; i++) {
        const on = this.reduce || Math.sin(now / (180 + i * 70 + k * 23) + k * 1.7 + i) > -0.2;
        this.ctx.fillStyle = on ? ['#5fd38a', '#5fd38a', '#f2c95c'][i] : '#1f2a24';
        this.ctx.fillRect(x + 8 + i * 2, y + 7 + k * 7, 1, 2);
      }
    }
  }

  /** Gentle up-and-down for markers and H.E.R.B.I.E., on the screen-pixel grid. */
  private bob(now: number, period: number, amount: number): number {
    return this.reduce ? 0 : this.snap(Math.sin(now / period) * amount);
  }

  /** A "!" bubble over someone waiting to meet the operator. */
  private bubble(cx: number, y: number, now: number): void {
    const ctx = this.ctx;
    const by = y + this.bob(now, 220, 1.5);
    ctx.fillStyle = INK;
    ctx.fillRect(cx - 4, by - 1, 9, 11);
    ctx.fillRect(cx - 5, by, 11, 9);
    ctx.fillStyle = '#f2c95c';
    ctx.fillRect(cx - 4, by, 9, 9);
    ctx.fillStyle = INK;
    ctx.fillRect(cx, by + 2, 1, 4);
    ctx.fillRect(cx, by + 7, 1, 1);
    ctx.fillRect(cx - 1, by + 10, 3, 1);
    ctx.fillRect(cx, by + 11, 1, 1);
  }

  /** A small arrow over whatever the operator can interact with. */
  private pointer(t: Interactable, now: number): void {
    const cx = this.snap(t.box.x + t.box.w / 2 - this.ox);
    const y = this.snap(t.box.y - this.oy) - 7 + this.bob(now, 180, 1);
    const ctx = this.ctx;
    ctx.fillStyle = INK;
    ctx.fillRect(cx - 4, y - 1, 9, 4);
    ctx.fillRect(cx - 3, y + 3, 7, 1);
    ctx.fillRect(cx - 2, y + 4, 5, 1);
    ctx.fillRect(cx - 1, y + 5, 3, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 3, y, 7, 2);
    ctx.fillRect(cx - 2, y + 2, 5, 1);
    ctx.fillRect(cx - 1, y + 3, 3, 1);
  }

  /** The ring on the floor where a tap sent the operator. */
  private marker(dest: Point, now: number): void {
    if (dest !== this.landing.dest) this.landing = { dest, at: now };
    const step = Math.floor(Math.max(0, now - this.landing.at) / 70);
    const [rx, ry] = this.reduce ? BREATH[0] : LANDING[step] ?? BREATH[frameAt(now, this.landing.at + 140, 3, 2)];
    const img = this.sprites.get(`ring|${rx}|${ry}`, () => ring(rx, ry));
    this.ctx.drawImage(img, this.snap(dest.x - this.ox - img.width / 2), this.snap(dest.y - this.oy - img.height / 2));
  }

  draw(now: number, dt: number): void {
    const { ctx, game } = this;
    this.follow(dt);
    this.ox = this.snap(this.cam.x);
    this.oy = this.snap(this.cam.y);
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = VOID;
    ctx.fillRect(0, 0, this.vw, this.vh);
    ctx.drawImage(this.room, -this.ox, -this.oy);
    ctx.save();
    ctx.translate(-this.ox, -this.oy);
    drawClockHands(ctx, new Date());
    ctx.restore();
    // on the floor, under everything, so whoever walks onto it is drawn over it
    if (game.dest && game.player.path.length) this.marker(game.dest, now);

    const near = game.nearest();
    const items: Drawable[] = game.world.props.map((p) => this.drawProp(p, now, near));

    // the operator: the walk cycle follows the distance walked, so feet and floor agree
    const { player } = game;
    if (game.playing) {
      const pose: Pose = player.moving ? 'walk' : 'idle';
      const facing: Facing = player.facing === 'left' || player.facing === 'right' ? 'side' : player.facing;
      const f = player.moving ? Math.floor(player.walked / STRIDE) % 4 : this.reduce ? 0 : frameAt(now, 0, FPS.idle, 4);
      const img = this.character('operator', pose, f, false, facing);
      items.push({
        base: player.y,
        draw: () => {
          const x = this.snap(player.x - 16 - this.ox);
          const y = this.snap(player.y - 42 - this.oy);
          if (player.facing === 'left') {
            ctx.save();
            ctx.translate(x + img.width, y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0);
            ctx.restore();
          } else ctx.drawImage(img, x, y);
        },
      });
    }

    // H.E.R.B.I.E. floats: no idle bob of his own, just a smooth hover.
    // Until play starts he is out front, on the title screen.
    if (game.playing) {
      const h = game.herbie;
      const hm = this.mood('herbie') ?? { pose: 'idle' as Pose, frame: 0 };
      const herbieImg = this.character('herbie', hm.pose, hm.frame, this.blinking(this.herbieEyes, now));
      items.push({
        base: h.y,
        draw: () => {
          const hx = this.snap(h.x - this.ox);
          const hy = this.snap(h.y - this.oy);
          ctx.fillStyle = 'rgba(20,10,30,0.22)';
          ctx.fillRect(hx - 6, hy - 2, 12, 2);
          ctx.drawImage(herbieImg, hx - 16, hy - 44 + this.bob(now, 380, 2));
        },
      });
    }

    items.sort((a, b) => a.base - b.base).forEach((d) => d.draw());

    if (near) this.pointer(near, now);
  }
}
