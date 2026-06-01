import type { PerformanceMode } from "../chord/chordTypes";
import type {
  HarmonicMode,
  HarmonicStyle,
  MoodTarget,
  VoicingRecipeName,
} from "../progressions/progressionTypes";

export type PlayedChord = {
  rootMidiNote: number;
  rootPitchClass: number;
  rootName: string;
  chordType: string;
  extensions: string[];
  midiNotes: number[];
  displayName: string;
  timestamp: number;
};

export type ProposeRequest = {
  selectedKey: string; // e.g. "C major", "B minor"
  keyModeEnabled: boolean;
  harmonicMode: HarmonicMode;
  harmonicStyle: HarmonicStyle;
  moodTarget: MoodTarget;
  activeProgressionPresetId?: string;
  chordHistory: PlayedChord[];
  maxSuggestions: number;
};

export type ProposalStrength = "Best" | "Good" | "Alternative" | "Spicy";
export type ProposalColor = "green" | "yellow" | "blue" | "purple";

export type ChordProposal = {
  rootPitchClass: number;
  rootName: string;
  romanNumeral: string;
  chordType: string;
  extensions: string[];
  displayName: string;
  midiPreviewNotes: number[];
  score: number;
  strength: ProposalStrength;
  color: ProposalColor;
  voicingRecipe: VoicingRecipeName;
  performanceModeSuggestion: PerformanceMode;
  reason: string;
};

export const scoringWeights = {
  belongsToKey: 30,
  matchesActiveProgressionNextStep: 60,
  matchesGenreMovement: 25,
  matchesMood: 20,
  smoothVoiceLeading: 20,
  sharedCommonTones: 15,
  goodTopLineMovement: 15,
  smallBassMovement: 10,
  preferredChordColour: 10,
  preferredPerformanceMode: 5,

  repeatedChordPenalty: -15,
  tooMuchRecentRepetitionPenalty: -25,
  outOfKeyPenalty: -50,
  diminishedInElectronicPenalty: -30,
  largeTopLineJumpPenalty: -15,
  tooJazzyForMinimalPenalty: -10,
};

export const STRENGTH_ORDER: ProposalStrength[] = [
  "Best",
  "Good",
  "Alternative",
  "Spicy",
];
export const COLOR_ORDER: ProposalColor[] = [
  "green",
  "yellow",
  "blue",
  "purple",
];
