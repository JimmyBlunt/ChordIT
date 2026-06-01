import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ChordExtension,
  ChordType,
  PerformanceMode,
  VoicingMode,
} from "../chord/chordTypes";
import type { KeyName } from "../key/scales";
import type { MidiMapping } from "../midi/midiTypes";
import type { Pattern } from "../performance/patterns";
import type {
  HarmonicMode,
  HarmonicStyle,
  MoodTarget,
} from "../progressions/progressionTypes";
import type { ChordProposal, PlayedChord } from "../propose/proposeTypes";

export type PerformanceParams = {
  strumDeltaMs: number;
  slopMaxMs: number;
  arpIntervalTicks: number; // 12 = 1/8, 6 = 1/16
  patternIndex: number;
  harpDeltaMs: number;
  harpOctaves: number;
  bpm: number;
};

export const PERFORMANCE_MODES: PerformanceMode[] = [
  "Off",
  "Strum",
  "Strum2Octaves",
  "Slop",
  "Arpeggiate",
  "Arpeggiate2Octaves",
  "Pattern",
  "Harp",
];

export type State = {
  selectedChordType: ChordType;
  activeExtensions: ChordExtension[];
  currentRootMidiNote: number | null;
  currentChordNotes: number[];
  currentDisplayString: string;

  performanceMode: PerformanceMode;
  performanceParams: PerformanceParams;

  voicingMode: VoicingMode;
  splitKey: number;
  octaveBase: number;

  keyModeEnabled: boolean;
  selectedKey: KeyName;

  midiMappings: MidiMapping[];
  midiInputConnected: boolean;
  midiOutputConnected: boolean;
  midiInputId: string;
  midiInputIds: string[];
  midiOutputId: string;

  mockMode: boolean;
  learningControl: string | null;

  /** Loop / Record */
  loopEnabled: boolean;
  loopRecording: boolean;
  loopPlaying: boolean;
  loopLength: number; // 4..16 beats
  loopLengthPending: number;

  /** User-saved rhythm patterns (additive to built-in PATTERNS) */
  userPatterns: Pattern[];

  /** Harmonic extension (Electronic Mode / Progression / Propose). */
  harmonicMode: HarmonicMode;
  harmonicStyle: HarmonicStyle;
  moodTarget: MoodTarget;
  activeProgressionPresetId: string | null;
  chordHistory: PlayedChord[];
  proposals: ChordProposal[];
};

export type Actions = {
  setChordType: (t: ChordType) => void;
  toggleExtension: (e: ChordExtension) => void;
  setExtensions: (e: ChordExtension[]) => void;
  setRootNote: (n: number | null) => void;
  setChord: (notes: number[], display: string) => void;
  setPerformanceMode: (m: PerformanceMode) => void;
  setPerformanceParams: (p: Partial<PerformanceParams>) => void;
  setVoicingMode: (m: VoicingMode) => void;
  setSplitKey: (n: number) => void;
  setOctaveBase: (n: number) => void;
  toggleKeyMode: () => void;
  setSelectedKey: (k: KeyName) => void;
  setMidiMappings: (m: MidiMapping[]) => void;
  setMidiStatus: (input: boolean, output: boolean) => void;
  setMidiDeviceIds: (input: string, output: string) => void;
  setMidiInputIds: (ids: string[]) => void;
  setMockMode: (m: boolean) => void;
  setLearningControl: (c: string | null) => void;
  setLoopEnabled: (b: boolean) => void;
  setLoopRecording: (b: boolean) => void;
  setLoopPlaying: (b: boolean) => void;
  setLoopLength: (n: number) => void;
  setLoopLengthPending: (n: number) => void;
  addUserPattern: (p: Pattern) => void;
  removeUserPattern: (id: string) => void;
  setHarmonicMode: (m: HarmonicMode) => void;
  setHarmonicStyle: (s: HarmonicStyle) => void;
  setMoodTarget: (m: MoodTarget) => void;
  setActiveProgressionPresetId: (id: string | null) => void;
  pushChord: (c: PlayedChord) => void;
  clearChordHistory: () => void;
  setProposals: (p: ChordProposal[]) => void;
};

export const useChorditStore = create<State & Actions>()(
  persist(
    (set) => ({
      selectedChordType: "Maj",
      activeExtensions: [],
      currentRootMidiNote: null,
      currentChordNotes: [],
      currentDisplayString: "—",

      performanceMode: "Off",
      performanceParams: {
        strumDeltaMs: 60,
        slopMaxMs: 25,
        arpIntervalTicks: 12,
        patternIndex: 0,
        harpDeltaMs: 35,
        harpOctaves: 3,
        bpm: 120,
      },

      voicingMode: "Split",
      splitKey: 60,
      octaveBase: 60,

      keyModeEnabled: false,
      selectedKey: "C",

      midiMappings: [],
      midiInputConnected: false,
      midiOutputConnected: false,
      midiInputId: "",
      midiInputIds: [],
      midiOutputId: "",

      mockMode: false,
      learningControl: null,

      loopEnabled: false,
      loopRecording: false,
      loopPlaying: false,
      loopLength: 8,
      loopLengthPending: 8,

      userPatterns: [],

      harmonicMode: "Standard",
      harmonicStyle: "MelodicTechno",
      moodTarget: "Uplifting",
      activeProgressionPresetId: null,
      chordHistory: [],
      proposals: [],

      setChordType: (t) => set({ selectedChordType: t }),
      toggleExtension: (e) =>
        set((s) => ({
          activeExtensions: s.activeExtensions.includes(e)
            ? s.activeExtensions.filter((x) => x !== e)
            : [...s.activeExtensions, e],
        })),
      setExtensions: (e) => set({ activeExtensions: e }),
      setRootNote: (n) => set({ currentRootMidiNote: n }),
      setChord: (notes, display) =>
        set({ currentChordNotes: notes, currentDisplayString: display }),
      setPerformanceMode: (m) => set({ performanceMode: m }),
      setPerformanceParams: (p) =>
        set((s) => ({ performanceParams: { ...s.performanceParams, ...p } })),
      setVoicingMode: (m) => set({ voicingMode: m }),
      setSplitKey: (n) => set({ splitKey: n }),
      setOctaveBase: (n) => set({ octaveBase: n }),
      toggleKeyMode: () => set((s) => ({ keyModeEnabled: !s.keyModeEnabled })),
      setSelectedKey: (k) => set({ selectedKey: k }),
      setMidiMappings: (m) => set({ midiMappings: m }),
      setMidiStatus: (input, output) =>
        set({ midiInputConnected: input, midiOutputConnected: output }),
      setMidiDeviceIds: (input, output) =>
        set({ midiInputId: input, midiOutputId: output }),
      setMidiInputIds: (ids) =>
        set({ midiInputIds: ids, midiInputId: ids[0] ?? "" }),
      setMockMode: (m) => set({ mockMode: m }),
      setLearningControl: (c) => set({ learningControl: c }),
      setLoopEnabled: (b) => set({ loopEnabled: b }),
      setLoopRecording: (b) => set({ loopRecording: b }),
      setLoopPlaying: (b) => set({ loopPlaying: b }),
      setLoopLength: (n) => set({ loopLength: n, loopLengthPending: n }),
      setLoopLengthPending: (n) => set({ loopLengthPending: n }),
      addUserPattern: (p) =>
        set((s) => ({ userPatterns: [...s.userPatterns.filter((x) => x.id !== p.id), p] })),
      removeUserPattern: (id) =>
        set((s) => ({ userPatterns: s.userPatterns.filter((p) => p.id !== id) })),
      setHarmonicMode: (m) => set({ harmonicMode: m }),
      setHarmonicStyle: (st) => set({ harmonicStyle: st }),
      setMoodTarget: (m) => set({ moodTarget: m }),
      setActiveProgressionPresetId: (id) => set({ activeProgressionPresetId: id }),
      pushChord: (c) =>
        set((s) => ({ chordHistory: [...s.chordHistory, c].slice(-16) })),
      clearChordHistory: () => set({ chordHistory: [] }),
      setProposals: (p) => set({ proposals: p }),
    }),
    {
      name: "chordit.store",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        selectedChordType: s.selectedChordType,
        activeExtensions: s.activeExtensions,
        performanceMode: s.performanceMode,
        performanceParams: s.performanceParams,
        voicingMode: s.voicingMode,
        splitKey: s.splitKey,
        octaveBase: s.octaveBase,
        keyModeEnabled: s.keyModeEnabled,
        selectedKey: s.selectedKey,
        midiMappings: s.midiMappings,
        midiInputId: s.midiInputId,
        midiInputIds: s.midiInputIds,
        midiOutputId: s.midiOutputId,
        mockMode: s.mockMode,
        loopLength: s.loopLength,
        userPatterns: s.userPatterns,
        harmonicMode: s.harmonicMode,
        harmonicStyle: s.harmonicStyle,
        moodTarget: s.moodTarget,
        activeProgressionPresetId: s.activeProgressionPresetId,
      }),
    },
  ),
);
