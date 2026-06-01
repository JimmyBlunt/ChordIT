/**
 * Electronic Mode types — separate from the original ChordIT chord types so
 * the classical Standard Mode keeps its strict notation, while Electronic Mode
 * uses a performance-oriented palette (Min/Maj/Sus2/Sus4/Pow/Dim + colour pads).
 */
import type { ChordExtension } from "../chord/chordTypes";

export type ElectronicChordType =
  | "Min"
  | "Maj"
  | "Sus2"
  | "Sus4"
  | "Pow"
  | "Dim";

export type ElectronicColourPad = "Deep" | "Air" | "Warm" | "Dream";

export const ELECTRONIC_CHORD_INTERVALS: Record<ElectronicChordType, number[]> = {
  Min: [0, 3, 7],
  Maj: [0, 4, 7],
  Sus2: [0, 2, 7],
  Sus4: [0, 5, 7],
  Pow: [0, 7],
  Dim: [0, 3, 6],
};

export const COLOUR_PAD_TO_EXTENSION: Record<ElectronicColourPad, ChordExtension> = {
  Deep: "m7",
  Air: "9",
  Warm: "6",
  Dream: "M7",
};

export const COLOUR_PAD_INTERVAL: Record<ElectronicColourPad, number> = {
  Deep: 10,
  Air: 14,
  Warm: 9,
  Dream: 11,
};

export const ALL_ELECTRONIC_CHORD_TYPES: ElectronicChordType[] = [
  "Min",
  "Maj",
  "Sus2",
  "Sus4",
  "Pow",
  "Dim",
];

export const ALL_COLOUR_PADS: ElectronicColourPad[] = [
  "Deep",
  "Air",
  "Warm",
  "Dream",
];

/**
 * Build electronic chord intervals from a chord type + optional colour pads.
 * Returns sorted unique intervals starting at 0.
 */
export function buildElectronicIntervals(
  chordType: ElectronicChordType,
  pads: ElectronicColourPad[],
): number[] {
  const set = new Set<number>(ELECTRONIC_CHORD_INTERVALS[chordType]);
  for (const p of pads) set.add(COLOUR_PAD_INTERVAL[p]);
  return [...set].sort((a, b) => a - b);
}

/**
 * Build electronic chord MIDI notes from a root MIDI note.
 */
export function buildElectronicChord(
  rootMidi: number,
  chordType: ElectronicChordType,
  pads: ElectronicColourPad[],
): number[] {
  return buildElectronicIntervals(chordType, pads).map((i) => rootMidi + i);
}
