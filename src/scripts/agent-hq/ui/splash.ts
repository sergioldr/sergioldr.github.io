// The splash art standing on the dialog box: the speaker's own sprite, blown up and alive.
// It breathes and blinks, plays the pose for the line's mood, holds the expression and
// moves its mouth while the words type out. A new speaker steps in; a new mood hops.

import type { AgentId } from '../../../data/agents.ts';
import type { Mood } from '../../../data/missions.ts';
import { SpriteCache, frameAt } from '../engine/canvas.ts';
import { H, W, type Face, type Pose } from '../sprites/body.ts';
import { renderCharacter } from '../sprites/cast.ts';

/** What each mood looks like: a pose played for at least `hold` ms, then idling with the expression. */
const MOODS: Record<Mood, { pose: Pose; look: Face['look']; hold: number }> = {
  talk: { pose: 'idle', look: 'calm', hold: 0 },
  greet: { pose: 'wave', look: 'happy', hold: 2000 },
  happy: { pose: 'idle', look: 'happy', hold: 0 },
  proud: { pose: 'cheer', look: 'happy', hold: 1400 },
  surprised: { pose: 'idle', look: 'surprised', hold: 0 },
  serious: { pose: 'idle', look: 'serious', hold: 0 },
};

/** Each agent's usual temper, for lines that don't set a mood. */
const TEMPER: Record<AgentId, Mood> = {
  herbie: 'happy',
  jarvis: 'talk',
  friday: 'happy',
  edith: 'serious',
  arnim: 'talk',
  u: 'happy',
  dume: 'happy',
  ultron: 'serious',
  sentinel: 'serious',
};

const FPS: Record<Pose, number> = { idle: 3, walk: 8, work: 8, cheer: 8, wave: 5 };
/** How long the mouth stays open or shut while talking. */
const MOUTH_MS = 110;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class Splash {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private reduce: boolean;
  private sprites = new SpriteCache();
  private who: AgentId | null = null;
  private mood: Mood = 'talk';
  private since = 0;
  private blinkAt = 0;
  private talking = false;
  private drawn = '';
  private raf = 0;

  constructor(canvas: HTMLCanvasElement, reduce: boolean) {
    this.canvas = canvas;
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext('2d')!;
    this.reduce = reduce;
  }

  /** Show `who` in `mood`, or in their usual temper. */
  show(who: AgentId, mood?: Mood): void {
    const next = mood ?? TEMPER[who];
    const entrance = who !== this.who ? 'enter' : next !== this.mood ? 'hop' : '';
    this.who = who;
    this.mood = next;
    this.since = performance.now();
    if (entrance) {
      this.canvas.classList.remove('enter', 'hop');
      void this.canvas.offsetWidth;
      this.canvas.classList.add(entrance);
    }
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  /** The mouth moves while the line is being typed. */
  speak(on: boolean): void {
    this.talking = on;
  }

  hide(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.who = null;
    this.drawn = '';
  }

  private tick = (now: number): void => {
    // ask for the next frame first, so one bad frame never stops the loop
    this.raf = requestAnimationFrame(this.tick);
    this.draw(now);
  };

  private blinking(now: number): boolean {
    if (this.reduce) return false;
    if (now > this.blinkAt + 140) this.blinkAt = now + rand(1800, 4800);
    return now > this.blinkAt;
  }

  private draw(now: number): void {
    const who = this.who;
    if (!who) return;
    const m = MOODS[this.mood];
    // a wave or cheer lasts while the line is typing, and at least `hold`
    const posing = !this.reduce && m.hold > 0 && (this.talking || now - this.since < m.hold);
    const pose = posing ? m.pose : 'idle';
    const frame = this.reduce ? 0 : frameAt(now, posing ? this.since : 0, FPS[pose], 4);
    const blink = this.blinking(now);
    const face: Face = { look: m.look, open: !this.reduce && this.talking && Math.floor(now / MOUTH_MS) % 2 === 0 };
    const key = `${who}|${pose}|${frame}|${blink}|${face.look}|${face.open}`;
    if (key === this.drawn) return;
    this.drawn = key;
    const img = this.sprites.get(key, () => renderCharacter(who, pose, frame, blink, 'down', face));
    this.ctx.clearRect(0, 0, W, H);
    this.ctx.drawImage(img, 0, 0);
  }
}
