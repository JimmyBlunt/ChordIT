import { isInScale, majorScalePitchClasses, type KeyName } from "./scales";

/**
 * Snap a MIDI note down to the nearest in-scale pitch.
 * If the note's pitch class is already in scale, return unchanged.
 * Otherwise step down by 1 semitone at a time until in scale.
 */
export function snapDown(midi: number, key: KeyName): number {
  if (isInScale(midi, key)) return midi;
  let n = midi;
  for (let i = 0; i < 12; i++) {
    n -= 1;
    if (isInScale(n, key)) return n;
  }
  return midi; // unreachable
}

/**
 * Force every note in the chord to belong to the selected scale.
 * Sorted ascending, deduped.
 */
export function constrainToKey(notes: number[], key: KeyName): number[] {
  const snapped = notes.map((n) => snapDown(n, key));
  return Array.from(new Set(snapped)).sort((a, b) => a - b);
}

export { majorScalePitchClasses, isInScale };
