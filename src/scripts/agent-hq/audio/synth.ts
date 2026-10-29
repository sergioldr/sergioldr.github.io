// The chip: a few oscillators, a noise source and two echoes, played through a music bus
// and an effects bus into one master volume. Every sound in the game is made here.

export type Wave = 'pulse12' | 'pulse25' | 'square' | 'triangle' | 'sawtooth' | 'sine';

export interface Tone {
  wave: Wave;
  freq: number;
  /** Glide to this frequency over the note. */
  to?: number;
  /** When to start, in the context's time. */
  at: number;
  dur: number;
  vol: number;
  attack?: number;
  /** How much of `vol` is left when the note ends: 0 plucks, 1 holds. */
  sustain?: number;
  /** A little wobble once the note has settled, for long notes. */
  vibrato?: boolean;
  /** How much goes to the bus's echo. */
  echo?: number;
}

export interface Noise {
  at: number;
  dur: number;
  vol: number;
  filter: BiquadFilterType;
  /** Filter frequency, and where it sweeps to. */
  freq: number;
  to?: number;
  q?: number;
}

/** Bus volumes when they're on. */
export const LEVELS = { master: 0.8, music: 0.5, sfx: 0.8 };

const RELEASE = 0.03;
const SILENT = 0.0001;

/** A pulse wave of the given duty cycle, as a Fourier series. */
function pulse(ctx: BaseAudioContext, duty: number): PeriodicWave {
  const n = 64;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) {
    real[k] = Math.sin(2 * Math.PI * k * duty) / (Math.PI * k);
    imag[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (Math.PI * k);
  }
  return ctx.createPeriodicWave(real, imag);
}

export class Mixer {
  readonly ctx: BaseAudioContext;
  readonly master: GainNode;
  readonly music: GainNode;
  /** Pulled down while a jingle plays over the music. */
  readonly duck: GainNode;
  readonly sfx: GainNode;
  private pulses: Partial<Record<Wave, PeriodicWave>> = {};
  private echoes = new Map<AudioNode, AudioNode>();
  private white: AudioBuffer;

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    comp.connect(ctx.destination);
    this.master = this.gain(comp, LEVELS.master);
    this.duck = this.gain(this.master, 1);
    this.music = this.gain(this.duck, LEVELS.music);
    this.sfx = this.gain(this.master, LEVELS.sfx);
    this.white = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.white.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  private gain(to: AudioNode, value: number): GainNode {
    const g = this.ctx.createGain();
    g.gain.value = value;
    g.connect(to);
    return g;
  }

  /** A feedback delay into `bus`, made the first time a sound on that bus asks for it. */
  private echo(bus: AudioNode): AudioNode {
    let input = this.echoes.get(bus);
    if (!input) {
      const delay = this.ctx.createDelay(1);
      delay.delayTime.value = bus === this.music ? 0.3 : 0.12;
      const tone = this.ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 2400;
      delay.connect(tone);
      tone.connect(this.gain(delay, 0.3));
      tone.connect(bus);
      input = delay;
      this.echoes.set(bus, input);
    }
    return input;
  }

  /** Fade in to `vol`, ease down to `sustain`, then a short release so nothing clicks. */
  private envelope(out: AudioNode, at: number, dur: number, vol: number, attack: number, sustain: number): GainNode {
    const g = this.ctx.createGain();
    const a = Math.min(attack, dur / 2);
    g.gain.setValueAtTime(SILENT, at);
    g.gain.linearRampToValueAtTime(vol, at + a);
    g.gain.exponentialRampToValueAtTime(Math.max(SILENT, vol * sustain), at + dur);
    g.gain.linearRampToValueAtTime(0, at + dur + RELEASE);
    g.connect(out);
    return g;
  }

  tone(bus: AudioNode, t: Tone): void {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    if (t.wave === 'pulse12' || t.wave === 'pulse25') {
      osc.setPeriodicWave((this.pulses[t.wave] ??= pulse(ctx, t.wave === 'pulse12' ? 0.125 : 0.25)));
    } else {
      osc.type = t.wave;
    }
    osc.frequency.setValueAtTime(t.freq, t.at);
    if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, t.at + t.dur);
    const env = this.envelope(bus, t.at, t.dur, t.vol, t.attack ?? 0.005, t.sustain ?? 0.5);
    osc.connect(env);
    if (t.echo) env.connect(this.gain(this.echo(bus), t.echo));
    const end = t.at + t.dur + RELEASE + 0.01;
    if (t.vibrato && t.dur > 0.3) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.5;
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(0, t.at);
      depth.gain.linearRampToValueAtTime(12, t.at + 0.25);
      lfo.connect(depth);
      depth.connect(osc.detune);
      lfo.start(t.at);
      lfo.stop(end);
    }
    osc.start(t.at);
    osc.stop(end);
  }

  noise(bus: AudioNode, n: Noise): void {
    const { ctx } = this;
    const src = ctx.createBufferSource();
    src.buffer = this.white;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = n.filter;
    filter.Q.value = n.q ?? 1;
    filter.frequency.setValueAtTime(n.freq, n.at);
    if (n.to) filter.frequency.exponentialRampToValueAtTime(n.to, n.at + n.dur);
    src.connect(filter);
    filter.connect(this.envelope(bus, n.at, n.dur, n.vol, 0.002, 0));
    src.start(n.at, Math.random() * 0.9);
    src.stop(n.at + n.dur + RELEASE + 0.01);
  }
}
