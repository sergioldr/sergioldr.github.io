// Playing the songs: an instrument for each channel, a sequencer that loops the office
// tune a few notes ahead of time, and one-off jingles scheduled all at once.

import { STEPS_PER_BAR, freq, parse, type Channel, type Song } from './songs.ts';
import type { Mixer } from './synth.ts';

/** How often the sequencer wakes up, and how far ahead it schedules. */
const TICK_MS = 25;
const AHEAD = 0.12;

const stepLength = (song: Song) => 60 / song.bpm / 4;

interface Cue {
  channel: Channel;
  note: string;
  len: number;
}

/** One note on one channel. Drums are a letter; everything else is a pitch. */
function play(mixer: Mixer, bus: AudioNode, channel: Channel, note: string, at: number, dur: number): void {
  if (channel === 'drums') {
    if (note === 'k') mixer.tone(bus, { wave: 'sine', freq: 140, to: 45, at, dur: 0.14, vol: 0.5, sustain: 0 });
    if (note === 's') {
      mixer.noise(bus, { at, dur: 0.12, vol: 0.16, filter: 'bandpass', freq: 1800, q: 0.7 });
      mixer.tone(bus, { wave: 'triangle', freq: 190, to: 120, at, dur: 0.06, vol: 0.12, sustain: 0 });
    }
    if (note === 'h') mixer.noise(bus, { at, dur: 0.03, vol: 0.05, filter: 'highpass', freq: 7000 });
    return;
  }
  const f = freq(note);
  if (channel === 'lead') mixer.tone(bus, { wave: 'pulse25', freq: f, at, dur, vol: 0.25, attack: 0.01, sustain: 0.6, vibrato: true, echo: 0.3 });
  if (channel === 'harmony') mixer.tone(bus, { wave: 'pulse12', freq: f, at, dur: Math.min(dur, 0.25), vol: 0.2, sustain: 0.1, echo: 0.2 });
  if (channel === 'bass') mixer.tone(bus, { wave: 'triangle', freq: f, at, dur, vol: 0.22, sustain: 0.7 });
}

/** Every note of a song, grouped by the step it starts on. */
function score(song: Song): { steps: Cue[][]; length: number } {
  const length = Math.max(...Object.values(song.bars).map((bars) => bars.length)) * STEPS_PER_BAR;
  const steps = Array.from({ length }, (): Cue[] => []);
  for (const [channel, bars] of Object.entries(song.bars) as [Channel, string[]][]) {
    for (const n of parse(bars)) steps[n.step].push({ channel, note: n.note, len: n.len });
  }
  return { steps, length };
}

/** Play a short song once, starting at `at`. Returns how long it lasts. */
export function jingle(mixer: Mixer, bus: AudioNode, song: Song, at = mixer.ctx.currentTime): number {
  const step = stepLength(song);
  const { steps, length } = score(song);
  steps.forEach((notes, i) => notes.forEach((n) => play(mixer, bus, n.channel, n.note, at + i * step, n.len * step)));
  return length * step;
}

/** Loops a song on the music bus, scheduling a little ahead so timers never make it stumble. */
export class Sequencer {
  private mixer: Mixer;
  private song: Song;
  private steps: Cue[][];
  private length: number;
  private step = 0;
  private next = 0;
  private timer = 0;

  constructor(mixer: Mixer, song: Song) {
    this.mixer = mixer;
    this.song = song;
    ({ steps: this.steps, length: this.length } = score(song));
  }

  /** Start from the top. */
  start(): void {
    if (this.timer) return;
    this.step = 0;
    this.next = this.mixer.ctx.currentTime + 0.05;
    this.timer = window.setInterval(() => this.pump(), TICK_MS);
    this.pump();
  }

  stop(): void {
    window.clearInterval(this.timer);
    this.timer = 0;
  }

  private pump(): void {
    const { mixer } = this;
    const now = mixer.ctx.currentTime;
    // if the page stalled, pick up from now instead of firing every note that was missed
    if (this.next < now) this.next = now + 0.02;
    const step = stepLength(this.song);
    while (this.next < now + AHEAD) {
      for (const n of this.steps[this.step]) play(mixer, mixer.music, n.channel, n.note, this.next, n.len * step);
      this.step = (this.step + 1) % this.length;
      this.next += step;
    }
  }
}
