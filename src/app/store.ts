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
  midiOutputId: string;

  mockMode: boolean;
  learningControl: string | null;
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
  setMockMode: (m: boolean) => void;
  setLearningControl: (c: string | null) => void;
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
      midiOutputId: "",

      mockMode: false,
      learningControl: null,

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
      setMockMode: (m) => set({ mockMode: m }),
      setLearningControl: (c) => set({ learningControl: c }),
    }),
    {
      name: "chordit.store",
      storage: createJSONStorage(() => localStorage),
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
        midiOutputId: s.midiOutputId,
        mockMode: s.mockMode,
      }),
    },
  ),
);
