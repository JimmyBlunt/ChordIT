export type ChordType = "Dim" | "Min" | "Maj" | "Sus";
export type ChordExtension = "6" | "m7" | "M7" | "9";

export type VoicingMode = "Split" | "Octave";

export type PerformanceMode =
  | "Off"
  | "Strum"
  | "Strum2Octaves"
  | "Slop"
  | "Arpeggiate"
  | "Arpeggiate2Octaves"
  | "Pattern"
  | "Harp";

export const CHORD_TYPE_INTERVALS: Record<ChordType, number[]> = {
  Maj: [0, 4, 7],
  Min: [0, 3, 7],
  Sus: [0, 5, 7],
  Dim: [0, 3, 6],
};

export const EXTENSION_INTERVALS: Record<ChordExtension, number> = {
  "6": 9,
  m7: 10,
  M7: 11,
  "9": 14,
};

// Canonical sort order for multi-extension notation.
export const EXTENSION_ORDER: ChordExtension[] = ["6", "m7", "M7", "9"];

export const ALL_CHORD_TYPES: ChordType[] = ["Dim", "Min", "Maj", "Sus"];
export const ALL_EXTENSIONS: ChordExtension[] = ["6", "m7", "M7", "9"];
