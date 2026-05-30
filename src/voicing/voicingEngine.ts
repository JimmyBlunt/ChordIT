import type { VoicingMode } from "../chord/chordTypes";

function sorted(notes: number[]): number[] {
  return [...notes].sort((a, b) => a - b);
}

/** Voice up: take lowest note, shift it +12, re-sort. */
export function voiceUp(notes: number[]): number[] {
  if (notes.length === 0) return notes;
  const s = sorted(notes);
  const [low, ...rest] = s;
  return sorted([...rest, low + 12]);
}

/** Voice down: take highest note, shift it -12, re-sort. */
export function voiceDown(notes: number[]): number[] {
  if (notes.length === 0) return notes;
  const s = sorted(notes);
  const high = s[s.length - 1];
  const rest = s.slice(0, -1);
  return sorted([...rest, high - 12]);
}

/**
 * Split mode: notes below splitKey are shifted up an octave so the chord
 * voicing stays grouped near the split key. Notes at or above splitKey
 * stay as-is.
 */
export function applySplit(notes: number[], splitKey: number): number[] {
  return sorted(notes.map((n) => (n < splitKey ? n + 12 : n)));
}

/**
 * Octave mode: fold every note into the 12-semitone range
 * [octaveBase, octaveBase + 11].
 */
export function applyOctave(notes: number[], octaveBase: number): number[] {
  return sorted(
    notes.map((n) => {
      let x = n;
      while (x < octaveBase) x += 12;
      while (x > octaveBase + 11) x -= 12;
      return x;
    }),
  );
}

export function applyVoicingMode(
  notes: number[],
  mode: VoicingMode,
  splitKey: number,
  octaveBase: number,
): number[] {
  return mode === "Split"
    ? applySplit(notes, splitKey)
    : applyOctave(notes, octaveBase);
}
