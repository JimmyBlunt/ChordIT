/**
 * Per-style preferred root movements (semitone deltas from current root)
 * and preferred chord colour ids. Used by the Propose scoring engine.
 */
import type { HarmonicStyle } from "../progressions/progressionTypes";

export type StyleMovements = {
  preferredDeltas: number[]; // semitone deltas from current root
  preferredColours: string[];
};

// Helper: build deltas from roman numeral changes in a minor key (0=i, 2=ii, 3=III, 5=iv, 7=v, 8=VI, 10=VII)
const MINOR = { i: 0, II: 2, III: 3, iv: 5, v: 7, VI: 8, VII: 10, bII: 1, bVI: 8, bVII: 10 };
const MAJOR = { I: 0, ii: 2, iii: 4, IV: 5, V: 7, vi: 9, vii: 11 };

export const STYLE_MOVEMENTS: Record<HarmonicStyle, StyleMovements> = {
  DancePop: {
    // I→V, I→vi, vi→IV, IV→I, IV→V, V→vi, vi→V
    preferredDeltas: [
      MAJOR.V, MAJOR.vi, // from I
      MAJOR.IV - MAJOR.vi + 12, // vi→IV: 5-9 = -4 → 8
      -MAJOR.IV + 12, // IV→I: -5 → 7
      MAJOR.V - MAJOR.IV, // IV→V: 2
      MAJOR.vi - MAJOR.V + 12, // V→vi: 2
      MAJOR.V - MAJOR.vi + 12, // vi→V: -2 → 10
    ],
    preferredColours: ["maj", "min", "add9", "maj6", "sus2", "maj9"],
  },
  TechHouse: {
    // i→bVII, i→iv, i→v, i→bVI, bVII→i, iv→i
    preferredDeltas: [
      MINOR.VII, MINOR.iv, MINOR.v, MINOR.VI,
      (-MINOR.VII + 12) % 12, (-MINOR.iv + 12) % 12,
    ],
    preferredColours: ["min7", "dom7", "sus7", "min9", "pow"],
  },
  Minimal: {
    // i→i, i→bVII, i→bVI, i→iv (small / no movement)
    preferredDeltas: [0, MINOR.VII, MINOR.VI, MINOR.iv],
    preferredColours: ["min", "min7", "pow", "sus2"],
  },
  MelodicTechno: {
    // i→VI, i→VII, i→iv, VI→VII, VII→i, iv→VI, i→III
    preferredDeltas: [
      MINOR.VI, MINOR.VII, MINOR.iv, MINOR.III,
      (MINOR.VII - MINOR.VI + 12) % 12,
      (-MINOR.VII + 12) % 12,
      (MINOR.VI - MINOR.iv + 12) % 12,
    ],
    preferredColours: ["min9", "min7", "sus2add9", "maj9", "add9"],
  },
  DeepHouse: {
    preferredDeltas: [
      MINOR.VI, MINOR.VII, MINOR.iv, MINOR.III,
      (-MINOR.VII + 12) % 12,
    ],
    preferredColours: ["min7", "min9", "maj7", "maj9", "dom7"],
  },
  Electro: {
    // i→bII, i→bVII, i→tritone, i→Pow
    preferredDeltas: [MINOR.bII, MINOR.VII, 6, 0],
    preferredColours: ["pow", "pow9", "dim7_tension", "sus7", "min", "min7"],
  },
  Techno: {
    preferredDeltas: [0, MINOR.VII, MINOR.VI, MINOR.iv, 6],
    preferredColours: ["min", "pow", "min7", "dim7_tension"],
  },
  Pop: {
    preferredDeltas: [MAJOR.V, MAJOR.vi, MAJOR.IV, MAJOR.iii],
    preferredColours: ["maj", "min", "add9", "maj6"],
  },
  Indie: {
    preferredDeltas: [MINOR.VI, MINOR.III, MINOR.VII, MINOR.iv],
    preferredColours: ["add9", "maj9", "sus2", "min9"],
  },
  Cinematic: {
    preferredDeltas: [MINOR.VI, MINOR.iv, MINOR.III, MINOR.bII],
    preferredColours: ["min", "min7", "pow", "sus2"],
  },
};
