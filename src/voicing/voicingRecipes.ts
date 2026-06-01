/**
 * Voicing recipes. Each recipe is a pure function: (notes, context) => number[].
 * Outputs are always sorted ascending and deduplicated.
 */
import type { VoicingRecipeName } from "../progressions/progressionTypes";

export type VoicingContext = {
  previousChordNotes?: number[];
  rootMidiNote: number;
  splitKey: number;
  octaveBase: number;
  targetTopNote?: number;
  targetBassNote?: number;
  keyPitchClasses?: number[];
  /** When true, NoDiminishedSubstitute will swap to Sus2 intervals on root. */
  avoidDiminished?: boolean;
  /** Intervals of the input chord relative to its root, used by NoDiminishedSubstitute. */
  chordIntervals?: number[];
};

function clean(notes: number[]): number[] {
  return [...new Set(notes)].sort((a, b) => a - b);
}

function pc(n: number): number {
  return ((n % 12) + 12) % 12;
}

/** Close: minimise total span. Move notes by ±12 until span ≤ 12 if possible. */
function close(notes: number[]): number[] {
  if (notes.length === 0) return [];
  const sorted = clean(notes);
  const root = sorted[0];
  const out = [root];
  for (let i = 1; i < sorted.length; i++) {
    let n = sorted[i];
    // Bring within [root, root+11] when possible.
    while (n - root > 11) n -= 12;
    while (n < root) n += 12;
    out.push(n);
  }
  return clean(out);
}

/** Open: widen by lifting upper chord tones by an octave. */
function open(notes: number[]): number[] {
  if (notes.length <= 1) return clean(notes);
  const s = clean(notes);
  // Lift every note above the root by +12 if the resulting span stays ≤ 24.
  const out = [s[0]];
  for (let i = 1; i < s.length; i++) out.push(s[i] + 12);
  // Re-sort
  return clean(out);
}

/** Smooth: minimise total voice-leading distance to previousChordNotes. */
function smooth(notes: number[], ctx: VoicingContext): number[] {
  const prev = ctx.previousChordNotes;
  if (!prev || prev.length === 0) return clean(notes);
  // For each chord tone independently choose the octave shift in [-2..2]
  // that minimises distance to the nearest previous note.
  const out = notes.map((n) => {
    let best = n;
    let bestDist = Infinity;
    for (let shift = -2; shift <= 2; shift++) {
      const candidate = n + shift * 12;
      const dist = Math.min(...prev.map((p) => Math.abs(candidate - p)));
      if (dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }
    return best;
  });
  return clean(out);
}

/** BassLow: place root at/below splitKey, upper tones stay above. */
function bassLow(notes: number[], ctx: VoicingContext): number[] {
  if (notes.length === 0) return [];
  let bass = ctx.rootMidiNote;
  while (bass > ctx.splitKey) bass -= 12;
  const uppers = notes
    .filter((n) => pc(n) !== pc(bass))
    .map((n) => {
      let x = n;
      while (x <= ctx.splitKey) x += 12;
      return x;
    });
  return clean([bass, ...uppers]);
}

/** PedalTop: keep previous top note (or nearest chord tone with same pc) on top. */
function pedalTop(notes: number[], ctx: VoicingContext): number[] {
  const prev = ctx.previousChordNotes;
  if (!prev || prev.length === 0) return clean(notes);
  const prevTop = Math.max(...prev);
  const prevPc = pc(prevTop);
  // Find chord tone with same pc; if not present, pick closest pc.
  const hasPc = notes.some((n) => pc(n) === prevPc);
  if (hasPc) {
    // Place a copy of that tone at prevTop octave.
    const others = notes.filter((n) => pc(n) !== prevPc);
    return clean([...others, prevTop]);
  }
  // Pick chord tone whose pc minimises distance to prevTop within ±2 octaves.
  let best = notes[0];
  let bestShift = 0;
  let bestDist = Infinity;
  for (const n of notes) {
    for (let shift = -2; shift <= 2; shift++) {
      const c = n + shift * 12;
      const d = Math.abs(c - prevTop);
      if (d < bestDist) {
        bestDist = d;
        best = n;
        bestShift = shift;
      }
    }
  }
  const others = notes.filter((n) => n !== best);
  return clean([...others, best + bestShift * 12]);
}

/** PedalBass: keep previous bass pc as bass when possible. */
function pedalBass(notes: number[], ctx: VoicingContext): number[] {
  const prev = ctx.previousChordNotes;
  if (!prev || prev.length === 0) return clean(notes);
  const prevBass = Math.min(...prev);
  const prevPc = pc(prevBass);
  if (notes.some((n) => pc(n) === prevPc)) {
    const others = notes.filter((n) => pc(n) !== prevPc);
    return clean([prevBass, ...others.map((n) => (n <= prevBass ? n + 12 : n))]);
  }
  // Otherwise lowest chord note becomes bass.
  return clean(notes);
}

/** TopLine: prefer stepwise top movement (≤ 2 semitones) from previous top. */
function topLine(notes: number[], ctx: VoicingContext): number[] {
  const prev = ctx.previousChordNotes;
  if (!prev || prev.length === 0) return clean(notes);
  const prevTop = Math.max(...prev);
  let bestTop = notes[0];
  let bestShift = 0;
  let bestDist = Infinity;
  for (const n of notes) {
    for (let shift = -2; shift <= 2; shift++) {
      const c = n + shift * 12;
      const d = Math.abs(c - prevTop);
      if (d < bestDist) {
        bestDist = d;
        bestTop = n;
        bestShift = shift;
      }
    }
  }
  const others = notes.filter((n) => n !== bestTop);
  return clean([...others, bestTop + bestShift * 12]);
}

/** Drop2: drop the second-highest note an octave. */
function drop2(notes: number[]): number[] {
  if (notes.length < 4) return clean(notes);
  const s = clean(notes);
  const secondHighIdx = s.length - 2;
  const out = [...s];
  out[secondHighIdx] = s[secondHighIdx] - 12;
  return clean(out);
}

/** OctaveSpread: duplicate every chord tone +12. */
function octaveSpread(notes: number[]): number[] {
  if (notes.length === 0) return [];
  const s = clean(notes);
  return clean([...s, ...s.map((n) => n + 12)]);
}

/** NoDiminishedSubstitute: if chord intervals are [0,3,6,...], rebuild as Sus2 on root. */
function noDiminishedSubstitute(notes: number[], ctx: VoicingContext): number[] {
  if (!ctx.avoidDiminished) return clean(notes);
  const intervals = ctx.chordIntervals;
  const isDim = intervals
    ? intervals.includes(3) && intervals.includes(6)
    : false;
  if (!isDim) return clean(notes);
  // Sus2 on root: [0, 2, 7].
  return clean([0, 2, 7].map((i) => ctx.rootMidiNote + i));
}

export const voicingRecipes: Record<
  VoicingRecipeName,
  (notes: number[], ctx: VoicingContext) => number[]
> = {
  Close: close,
  Open: open,
  Smooth: smooth,
  BassLow: bassLow,
  PedalTop: pedalTop,
  PedalBass: pedalBass,
  TopLine: topLine,
  Drop2: drop2,
  OctaveSpread: octaveSpread,
  NoDiminishedSubstitute: noDiminishedSubstitute,
};

export function applyVoicingRecipe(
  recipe: VoicingRecipeName,
  notes: number[],
  ctx: VoicingContext,
): number[] {
  return voicingRecipes[recipe](notes, ctx);
}
