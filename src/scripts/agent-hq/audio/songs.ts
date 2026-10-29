// The music, written out like the sprites: one string per bar, sixteen steps of a
// sixteenth note each. A note (C4, F#3, Bb2) starts on its step, `-` holds the note
// before it and `.` is silence. Drums use k for the kick, s for the snare and h for the
// hi-hat. Everything here is original and plain data, so the smoke bot can read it.

export type Channel = 'lead' | 'harmony' | 'bass' | 'drums';

export interface Song {
  bpm: number;
  bars: Partial<Record<Channel, string[]>>;
}

export interface Note {
  /** Step the note starts on, counted from the start of the song. */
  step: number;
  /** A pitch like `C4`, or a drum letter. */
  note: string;
  /** Steps it lasts. */
  len: number;
}

export const STEPS_PER_BAR = 16;

/** The notes of one channel, holds joined across bar lines. */
export function parse(bars: string[]): Note[] {
  const notes: Note[] = [];
  let held: Note | null = null;
  bars.flatMap((bar) => bar.trim().split(/\s+/)).forEach((token, step) => {
    if (token === '-') {
      if (held) held.len++;
    } else if (token === '.') {
      held = null;
    } else {
      held = { step, note: token, len: 1 };
      notes.push(held);
    }
  });
  return notes;
}

const SEMITONES: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

/** Hertz for a pitch like `A4` (440), `F#3` or `Bb2`; NaN if it isn't one. */
export function freq(note: string): number {
  const m = /^([A-G])([#b]?)(\d)$/.exec(note);
  if (!m) return NaN;
  const n = SEMITONES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * 2 ** (n / 12);
}

export const DRUMS = ['k', 's', 'h'];

// ---------- Office: the loop that plays while you walk around ----------

// A: Fmaj7 G Em7 Am twice. B: Dm7 G Cmaj7 Am7, then Dm7 G Fmaj7 E, which leads back to A.
const CHORDS = 'F G Em Am F G Em Am Dm G C Am Dm G F E'.split(' ');

/** Rolling eighth notes over each chord, up and back down. */
const ROLL: Record<string, string> = {
  F: 'F3 - A3 - C4 - E4 - C4 - A3 - F3 - A3 -',
  G: 'G3 - B3 - D4 - G4 - D4 - B3 - G3 - B3 -',
  Em: 'E3 - G3 - B3 - D4 - B3 - G3 - E3 - G3 -',
  Am: 'A3 - C4 - E4 - A4 - E4 - C4 - A3 - C4 -',
  Dm: 'D3 - F3 - A3 - C4 - A3 - F3 - D3 - F3 -',
  C: 'C4 - E4 - G4 - B4 - G4 - E4 - C4 - E4 -',
  E: 'E3 - G#3 - B3 - E4 - B3 - G#3 - E3 - G#3 -',
};

/** Root, octave and fifth in a 3-3-2 swing. */
const BASS: Record<string, string> = {
  F: 'F2 - - F3 - - C3 - F2 - - F3 - - C3 -',
  G: 'G2 - - G3 - - D3 - G2 - - G3 - - D3 -',
  Em: 'E2 - - E3 - - B2 - E2 - - E3 - - B2 -',
  Am: 'A2 - - A3 - - E3 - A2 - - A3 - - E3 -',
  Dm: 'D2 - - D3 - - A2 - D2 - - D3 - - A2 -',
  C: 'C3 - - C4 - - G3 - C3 - - C4 - - G3 -',
  E: 'E2 - - E3 - - B2 - G#2 - - B2 - - E3 -',
};

const BEAT = 'k . h . s . h . k . h k s . h .';

export const office: Song = {
  bpm: 100,
  bars: {
    lead: [
      'E5 - - - C5 - A4 - C5 - - - D5 - E5 -',
      'D5 - - - B4 - G4 - B4 - - - C5 - D5 -',
      'B4 - - - G4 - E4 - G4 - - - A4 - B4 -',
      'C5 - - - B4 - A4 - - - - - . . . .',
      'E5 - - - C5 - A4 - C5 - - - D5 - E5 -',
      'D5 - - - B4 - G4 - D5 - - - E5 - F5 -',
      'G5 - - - E5 - D5 - B4 - - - D5 - - -',
      'C5 - - - B4 - - - A4 - - - - - . .',
      'A4 - . A4 C5 - D5 - F5 - - - E5 - D5 -',
      'B4 - . B4 D5 - G5 - F5 - - - D5 - - -',
      'E5 - - - - - D5 - C5 - - - G4 - - -',
      'A4 - - - C5 - E5 - G5 - - - E5 - - -',
      'F5 - - - E5 - D5 - C5 - - - D5 - - -',
      'B4 - - - D5 - G5 - F5 - - - D5 - B4 -',
      'A4 - - - C5 - E5 - F5 - - - E5 - C5 -',
      'B4 - - - G#4 - - - E4 - - - G#4 - B4 -',
    ],
    harmony: CHORDS.map((c) => ROLL[c]),
    bass: CHORDS.map((c) => BASS[c]),
    drums: CHORDS.map((_, i) =>
      i === 7 ? 'k . h . s . h . k . h . s . s s' : i === 15 ? 'k . h . s . h . k . s . s s s s' : BEAT,
    ),
  },
};

// ---------- jingles ----------

/** A card for the Agentdex. */
export const card: Song = {
  bpm: 220,
  bars: {
    lead: ['G5 C6 E6 G6 - - - - . . . . . . . .'],
    harmony: ['E5 G5 C6 E6 - - - - . . . . . . . .'],
  },
};

/** Mission complete: up the chord, a turn and a long C. */
export const fanfare: Song = {
  bpm: 160,
  bars: {
    lead: ['G4 . C5 . E5 . G5 - - - E5 - F5 - G5 -', 'C6 - - - - - - - - - - - . . . .'],
    harmony: ['E4 . G4 . C5 . E5 - - - C5 - D5 - E5 -', 'G5 - - - - - - - - - - - . . . .'],
    bass: ['C3 - - - . . . . G2 - - - . . . .', 'C3 - - - - - - - . . . . . . . .'],
    drums: ['k . . . s . . . k . . . s . s s', 'k . . . . . . . . . . . . . . .'],
  },
};
