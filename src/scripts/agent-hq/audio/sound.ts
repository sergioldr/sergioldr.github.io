// The game's sound: the office music, the effects and a voice for each agent, with the
// player's settings kept in this browser. Browsers only allow sound after a tap or a key
// press, so nothing is made until `unlock` runs inside one.

import type { AgentId } from '../../../data/agents.ts';
import { Sequencer, jingle } from './music.ts';
import { card, fanfare, freq, office } from './songs.ts';
import { LEVELS, Mixer, type Wave } from './synth.ts';

const KEY = 'agent-hq:sound';

interface Settings {
  muted: boolean;
  music: boolean;
  sfx: boolean;
}

/** The two switches in the menu. */
export type Switch = 'music' | 'sfx';

/** How an agent sounds while their line types out: one short syllable per couple of letters. */
interface Voice {
  wave: Wave;
  freq: number;
  vol: number;
  /** Random pitch either way, in semitones. */
  spread: number;
  /** Glide over each syllable, as a ratio. */
  slide: number;
  dur: number;
}

const VOICES: Record<AgentId, Voice> = {
  herbie: { wave: 'square', freq: 740, vol: 0.14, spread: 2, slide: 1.12, dur: 0.045 },
  jarvis: { wave: 'pulse25', freq: 196, vol: 0.14, spread: 1, slide: 1, dur: 0.06 },
  friday: { wave: 'triangle', freq: 392, vol: 0.16, spread: 3, slide: 0.96, dur: 0.055 },
  edith: { wave: 'pulse12', freq: 466, vol: 0.18, spread: 0, slide: 1, dur: 0.04 },
  arnim: { wave: 'pulse25', freq: 294, vol: 0.15, spread: 1.5, slide: 1, dur: 0.05 },
  u: { wave: 'square', freq: 880, vol: 0.16, spread: 3, slide: 1.05, dur: 0.035 },
  dume: { wave: 'triangle', freq: 165, vol: 0.15, spread: 7, slide: 0.85, dur: 0.07 },
  ultron: { wave: 'sawtooth', freq: 147, vol: 0.16, spread: 1, slide: 0.98, dur: 0.055 },
  sentinel: { wave: 'pulse12', freq: 220, vol: 0.17, spread: 0, slide: 1, dur: 0.045 },
};

let foot = false;

const EFFECTS = {
  /** A line moves on. */
  next(m: Mixer, bus: AudioNode, t: number) {
    m.tone(bus, { wave: 'pulse12', freq: 1320, at: t, dur: 0.03, vol: 0.1, sustain: 0 });
  },
  /** A window opens: two notes up. */
  open(m: Mixer, bus: AudioNode, t: number) {
    m.tone(bus, { wave: 'pulse25', freq: freq('C5'), at: t, dur: 0.05, vol: 0.11, sustain: 0.3 });
    m.tone(bus, { wave: 'pulse25', freq: freq('G5'), at: t + 0.05, dur: 0.08, vol: 0.11, sustain: 0 });
  },
  /** And closes: two notes down. */
  close(m: Mixer, bus: AudioNode, t: number) {
    m.tone(bus, { wave: 'pulse25', freq: freq('G5'), at: t, dur: 0.05, vol: 0.1, sustain: 0.3 });
    m.tone(bus, { wave: 'pulse25', freq: freq('C5'), at: t + 0.05, dur: 0.08, vol: 0.1, sustain: 0 });
  },
  select(m: Mixer, bus: AudioNode, t: number) {
    m.tone(bus, { wave: 'triangle', freq: freq('C6'), at: t, dur: 0.04, vol: 0.14, sustain: 0 });
  },
  /** The right agent for the job. */
  ok(m: Mixer, bus: AudioNode, t: number) {
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) =>
      m.tone(bus, { wave: 'square', freq: freq(n), at: t + i * 0.06, dur: i === 3 ? 0.25 : 0.08, vol: 0.16, sustain: 0.3, echo: i === 3 ? 0.3 : 0 }),
    );
  },
  /** The wrong one. */
  bad(m: Mixer, bus: AudioNode, t: number) {
    m.tone(bus, { wave: 'sawtooth', freq: 233, to: 117, at: t, dur: 0.28, vol: 0.15, sustain: 0.6 });
    m.tone(bus, { wave: 'square', freq: 220, to: 110, at: t, dur: 0.28, vol: 0.09, sustain: 0.6 });
  },
  /** D.U.M.-E. tried anyway. */
  crash(m: Mixer, bus: AudioNode, t: number) {
    m.noise(bus, { at: t, dur: 0.45, vol: 0.2, filter: 'lowpass', freq: 5000, to: 500 });
    for (let i = 0; i < 5; i++) {
      m.tone(bus, { wave: 'square', freq: 500 + Math.random() * 1200, at: t + 0.04 + i * 0.07 + Math.random() * 0.03, dur: 0.05, vol: 0.04, sustain: 0 });
    }
    m.tone(bus, { wave: 'sine', freq: 120, to: 40, at: t + 0.35, dur: 0.18, vol: 0.4, sustain: 0 });
  },
  /** A card for the Agentdex. */
  card(m: Mixer, bus: AudioNode, t: number) {
    jingle(m, bus, card, t);
  },
  /** The sheet comes off a display case. */
  uncover(m: Mixer, bus: AudioNode, t: number) {
    m.noise(bus, { at: t, dur: 0.45, vol: 0.16, filter: 'bandpass', freq: 300, to: 3000, q: 1.2 });
    m.tone(bus, { wave: 'triangle', freq: freq('C6'), at: t + 0.4, dur: 0.3, vol: 0.14, sustain: 0, echo: 0.4 });
    m.tone(bus, { wave: 'triangle', freq: freq('G6'), at: t + 0.48, dur: 0.3, vol: 0.12, sustain: 0, echo: 0.4 });
  },
  /** A footstep, left and right a little apart. */
  step(m: Mixer, bus: AudioNode, t: number) {
    foot = !foot;
    m.noise(bus, { at: t, dur: 0.035, vol: 0.3, filter: 'bandpass', freq: foot ? 260 : 330, q: 2 });
  },
} satisfies Record<string, (m: Mixer, bus: AudioNode, t: number) => void>;

export type Effect = keyof typeof EFFECTS;

/** Rising pings over the end of the fanfare, one per star. */
const STARS = ['E6', 'G6', 'C7'];

function load(): Settings {
  const fallback = { muted: false, music: true, sfx: true };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

class Sound {
  private settings = load();
  private mixer: Mixer | null = null;
  private music: Sequencer | null = null;

  /** Anything can be heard: the speaker button shows this. */
  get on(): boolean {
    const { muted, music, sfx } = this.settings;
    return !muted && (music || sfx);
  }

  /** Whether the music or the effects can be heard, for the menu. */
  hears(which: Switch): boolean {
    return !this.settings.muted && this.settings[which];
  }

  /** Make the chip, or wake it. Call it from a tap or key press; true once sound can play. */
  async unlock(): Promise<boolean> {
    if (typeof AudioContext === 'undefined') return true;
    if (!this.mixer) {
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      this.mixer = new Mixer(ctx);
      this.music = new Sequencer(this.mixer, office);
      document.addEventListener('visibilitychange', () => void (document.hidden ? ctx.suspend() : ctx.resume()));
      this.apply();
    }
    const ctx = this.mixer.ctx as AudioContext;
    try {
      await ctx.resume();
    } catch {
      /* not allowed yet */
    }
    return ctx.state === 'running';
  }

  /** The speaker button and M: silence everything, or bring it back. */
  toggle(): void {
    if (this.on) this.set({ muted: true });
    else if (this.settings.music || this.settings.sfx) this.set({ muted: false });
    else this.set({ muted: false, music: true, sfx: true });
  }

  /** The menu's switches: turning one on also lifts the mute. */
  flip(which: Switch): void {
    if (this.hears(which)) this.set({ [which]: false });
    else this.set({ [which]: true, muted: false });
  }

  play(effect: Effect): void {
    const m = this.effects();
    if (m) EFFECTS[effect](m, m.sfx, m.ctx.currentTime);
  }

  /** One syllable of `agent`'s voice. */
  blip(agent: AgentId): void {
    const m = this.effects();
    if (!m) return;
    const v = VOICES[agent];
    const f = v.freq * 2 ** (((Math.random() * 2 - 1) * v.spread) / 12);
    m.tone(m.sfx, { wave: v.wave, freq: f, to: f * v.slide, at: m.ctx.currentTime, dur: v.dur, vol: v.vol, sustain: 0.2 });
  }

  /** Mission complete: the music steps back for the fanfare and a ping for every star. */
  fanfare(stars: number): void {
    const m = this.effects();
    if (!m) return;
    const t = m.ctx.currentTime;
    const length = jingle(m, m.sfx, fanfare, t);
    STARS.slice(0, stars).forEach((n, i) =>
      m.tone(m.sfx, { wave: 'pulse25', freq: freq(n), at: t + 1.75 + i * 0.2, dur: 0.12, vol: 0.05, sustain: 0, echo: 0.4 }),
    );
    const duck = m.duck.gain;
    duck.cancelScheduledValues(t);
    duck.setValueAtTime(duck.value, t);
    duck.setTargetAtTime(0.15, t, 0.05);
    duck.setTargetAtTime(1, t + length, 0.4);
  }

  /** The chip, if it's running and the effects are on. */
  private effects(): Mixer | null {
    const m = this.mixer;
    return m && (m.ctx as AudioContext).state === 'running' && this.hears('sfx') ? m : null;
  }

  private set(change: Partial<Settings>): void {
    Object.assign(this.settings, change);
    try {
      localStorage.setItem(KEY, JSON.stringify(this.settings));
    } catch {
      /* private mode or storage disabled */
    }
    this.apply();
  }

  /** Bring the chip in line with the settings. */
  private apply(): void {
    const m = this.mixer;
    if (!m) return;
    const t = m.ctx.currentTime;
    m.master.gain.setTargetAtTime(this.settings.muted ? 0 : LEVELS.master, t, 0.03);
    m.music.gain.setTargetAtTime(this.settings.music ? LEVELS.music : 0, t, 0.03);
    m.sfx.gain.setTargetAtTime(this.settings.sfx ? LEVELS.sfx : 0, t, 0.03);
    if (this.hears('music')) this.music?.start();
    else this.music?.stop();
  }
}

export const sound = new Sound();
