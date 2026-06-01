import type { PerformanceMode } from "../chord/chordTypes";

export type HarmonicMode = "Standard" | "Electronic" | "Progression" | "Propose";

export type HarmonicStyle =
  | "Minimal"
  | "Techno"
  | "TechHouse"
  | "Electro"
  | "DancePop"
  | "MelodicTechno"
  | "DeepHouse"
  | "Pop"
  | "Indie"
  | "Cinematic";

export type MoodTarget =
  | "Deep"
  | "Dark"
  | "Uplifting"
  | "Tension"
  | "Resolved"
  | "Dreamy"
  | "Minimal"
  | "Pop"
  | "Groovy"
  | "Warm"
  | "Love"
  | "Sad"
  | "Melancholic"
  | "Serious"
  | "Euphoric"
  | "Bittersweet"
  | "Joyful";

export type ScaleContext =
  | "major"
  | "minor"
  | "naturalMinor"
  | "anyMajor"
  | "anyMinor";

export type VoicingRecipeName =
  | "Close"
  | "Open"
  | "Smooth"
  | "BassLow"
  | "PedalTop"
  | "PedalBass"
  | "TopLine"
  | "Drop2"
  | "OctaveSpread"
  | "NoDiminishedSubstitute";

export type ProgressionPreset = {
  id: string;
  number: number;
  name: string;
  scaleContext: ScaleContext;
  romanNumerals: string[];
  emotion: string;
  exampleKey: string;
  exampleChords: string[];
  preferredChordColours: string[];
  preferredVoicingRecipes: VoicingRecipeName[];
  preferredPerformanceModes: PerformanceMode[];
  preferredStyles: HarmonicStyle[];
  avoidDiminished: boolean;
  notes: string;
};

export const ALL_HARMONIC_MODES: HarmonicMode[] = [
  "Standard",
  "Electronic",
  "Progression",
  "Propose",
];

export const ALL_HARMONIC_STYLES: HarmonicStyle[] = [
  "Minimal",
  "Techno",
  "TechHouse",
  "Electro",
  "DancePop",
  "MelodicTechno",
  "DeepHouse",
  "Pop",
  "Indie",
  "Cinematic",
];

export const ALL_MOOD_TARGETS: MoodTarget[] = [
  "Deep",
  "Dark",
  "Uplifting",
  "Tension",
  "Resolved",
  "Dreamy",
  "Minimal",
  "Pop",
  "Groovy",
  "Warm",
  "Love",
  "Sad",
  "Melancholic",
  "Serious",
  "Euphoric",
  "Bittersweet",
  "Joyful",
];
