import type { ChordExtension } from "../chord/chordTypes";
import type { ElectronicChordType } from "./electronicTypes";
import type { HarmonicStyle, MoodTarget } from "../progressions/progressionTypes";

export type ElectronicChordPreset = {
  id: string;
  name: string;
  chordType: ElectronicChordType;
  extensions: ChordExtension[];
  intervals: number[];
  bestFor: HarmonicStyle[];
  moodTags: MoodTarget[];
  description: string;
};

export const electronicChordPresets: ElectronicChordPreset[] = [
  {
    id: "min",
    name: "Min",
    chordType: "Min",
    extensions: [],
    intervals: [0, 3, 7],
    bestFor: ["Minimal", "Techno", "TechHouse", "MelodicTechno", "DeepHouse"],
    moodTags: ["Dark", "Deep", "Minimal"],
    description:
      "Basic minor triad for dark and emotional electronic progressions.",
  },
  {
    id: "min7",
    name: "Min7",
    chordType: "Min",
    extensions: ["m7"],
    intervals: [0, 3, 7, 10],
    bestFor: ["TechHouse", "DeepHouse", "MelodicTechno"],
    moodTags: ["Deep", "Dark"],
    description: "Classic deep house and melodic techno colour.",
  },
  {
    id: "min9",
    name: "Min9",
    chordType: "Min",
    extensions: ["m7", "9"],
    intervals: [0, 3, 7, 10, 14],
    bestFor: ["DeepHouse", "MelodicTechno", "DancePop"],
    moodTags: ["Deep", "Dreamy", "Melancholic"],
    description: "Emotional minor colour with air and depth.",
  },
  {
    id: "maj",
    name: "Maj",
    chordType: "Maj",
    extensions: [],
    intervals: [0, 4, 7],
    bestFor: ["DancePop"],
    moodTags: ["Resolved", "Uplifting"],
    description: "Simple resolved major chord.",
  },
  {
    id: "maj6",
    name: "Maj6",
    chordType: "Maj",
    extensions: ["6"],
    intervals: [0, 4, 7, 9],
    bestFor: ["DancePop", "DeepHouse"],
    moodTags: ["Warm", "Resolved"],
    description: "Warm pop and house colour.",
  },
  {
    id: "maj9",
    name: "Maj9",
    chordType: "Maj",
    extensions: ["9"],
    intervals: [0, 4, 7, 14],
    bestFor: ["DancePop", "MelodicTechno", "DeepHouse"],
    moodTags: ["Dreamy", "Uplifting"],
    description: "Open and emotional major colour.",
  },
  {
    id: "dom7",
    name: "Dom7",
    chordType: "Maj",
    extensions: ["m7"],
    intervals: [0, 4, 7, 10],
    bestFor: ["TechHouse", "Electro"],
    moodTags: ["Groovy", "Tension"],
    description: "Funky dominant chord for tech house stabs.",
  },
  {
    id: "sus2",
    name: "Sus2",
    chordType: "Sus2",
    extensions: [],
    intervals: [0, 2, 7],
    bestFor: ["Minimal", "MelodicTechno", "DancePop"],
    moodTags: ["Dreamy", "Minimal"],
    description: "Open suspended second chord.",
  },
  {
    id: "sus2add9",
    name: "Sus2add9",
    chordType: "Sus2",
    extensions: ["9"],
    intervals: [0, 2, 7, 14],
    bestFor: ["MelodicTechno", "DeepHouse"],
    moodTags: ["Dreamy", "Uplifting"],
    description: "Wide airy suspended chord.",
  },
  {
    id: "sus7",
    name: "Sus7",
    chordType: "Sus4",
    extensions: ["m7"],
    intervals: [0, 5, 7, 10],
    bestFor: ["TechHouse", "Minimal"],
    moodTags: ["Tension", "Deep"],
    description: "Suspended dominant colour for house and techno.",
  },
  {
    id: "pow",
    name: "Pow",
    chordType: "Pow",
    extensions: [],
    intervals: [0, 7],
    bestFor: ["Techno", "Electro", "Minimal"],
    moodTags: ["Dark", "Minimal"],
    description: "No-third power chord for ambiguous heavy electronic harmony.",
  },
  {
    id: "pow9",
    name: "Pow+9",
    chordType: "Pow",
    extensions: ["9"],
    intervals: [0, 7, 14],
    bestFor: ["Electro", "MelodicTechno"],
    moodTags: ["Dark", "Dreamy"],
    description: "Power chord with airy extension.",
  },
  {
    id: "dim7_tension",
    name: "Dim7 Tension",
    chordType: "Dim",
    extensions: ["m7"],
    intervals: [0, 3, 6, 10],
    bestFor: ["Electro", "Techno"],
    moodTags: ["Tension", "Dark"],
    description: "Tension colour used sparingly.",
  },
];
