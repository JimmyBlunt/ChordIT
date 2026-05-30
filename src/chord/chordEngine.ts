import {
  CHORD_TYPE_INTERVALS,
  EXTENSION_INTERVALS,
  type ChordExtension,
  type ChordType,
} from "./chordTypes";

/**
 * Build a chord as MIDI note numbers from a root, type and active extensions.
 * - Always sorted ascending
 * - Deduplicated
 */
export function buildChord(
  rootMidi: number,
  type: ChordType,
  extensions: ChordExtension[],
): number[] {
  const intervals = [...CHORD_TYPE_INTERVALS[type]];
  for (const ext of extensions) {
    intervals.push(EXTENSION_INTERVALS[ext]);
  }
  const notes = intervals.map((i) => rootMidi + i);
  return Array.from(new Set(notes)).sort((a, b) => a - b);
}

export function sortExtensions(exts: ChordExtension[]): ChordExtension[] {
  const order: ChordExtension[] = ["6", "m7", "M7", "9"];
  return [...new Set(exts)].sort(
    (a, b) => order.indexOf(a) - order.indexOf(b),
  );
}
