import { midiManager } from "./midiManager";
import { useChorditStore, PERFORMANCE_MODES } from "../app/store";
import { ALL_KEYS } from "../key/scales";
import type { ChordExtension, ChordType, VoicingMode } from "../chord/chordTypes";
import type { ControlId, MidiMapping, MidiMessage } from "./midiTypes";
import {
  ALL_HARMONIC_MODES,
  ALL_HARMONIC_STYLES,
  ALL_MOOD_TARGETS,
} from "../progressions/progressionTypes";
import { progressionPresets } from "../progressions/progressionPresets";
import { PATTERNS } from "../performance/patterns";
import { areNativePadNotesActive, isNativePadNoteNumber, showLcd } from "./microKontrolNative";

const CHORD_TYPES: ChordType[] = ["Dim", "Min", "Maj", "Sus"];
const EXT_LIST: ChordExtension[] = ["6", "m7", "M7", "9"];
const VOICING_MODES: VoicingMode[] = ["Split", "Octave"];

let started = false;
let unsub: (() => void) | null = null;
// Track per-CC last value so dials only step on crossings, not every tick.
const lastCc = new Map<string, number>();

/** Match a message against the persisted mappings. */
export function findMatchingControl(
  msg: MidiMessage,
  mappings: MidiMapping[],
): ControlId | null {
  const m = mappings.find((m) => {
    if (m.channel !== msg.channel) return false;
    if (m.inputType === "cc" && msg.type === "cc") return m.number === msg.cc;
    if (m.inputType === "note" && msg.type === "noteOn") return m.number === msg.note;
    return false;
  });
  return m ? m.controlId : null;
}

function cycle<T>(arr: readonly T[], current: T, dir: 1 | -1): T {
  const i = arr.indexOf(current);
  const next = (i + dir + arr.length) % arr.length;
  return arr[next];
}

function dialDirection(msg: MidiMessage, key: string): 1 | -1 | null {
  if (msg.type !== "cc") {
    // Note triggers always advance forward.
    return msg.type === "noteOn" ? 1 : null;
  }
  const prev = lastCc.get(key);
  lastCc.set(key, msg.value);
  if (prev === undefined) return msg.value >= 64 ? 1 : -1;
  if (msg.value > prev) return 1;
  if (msg.value < prev) return -1;
  return null;
}

function isTrigger(msg: MidiMessage): boolean {
  if (msg.type === "noteOn") return msg.velocity > 0;
  if (msg.type === "cc") return msg.value >= 64;
  return false;
}

function dispatch(id: ControlId, msg: MidiMessage) {
  const s = useChorditStore.getState();
  switch (id) {
    case "chord.Dim":
    case "chord.Min":
    case "chord.Maj":
    case "chord.Sus": {
      if (!isTrigger(msg)) return;
      s.setChordType(id.split(".")[1] as ChordType);
      showLcd(`CHORD ${id.split(".")[1].toUpperCase()}`);
      return;
    }
    case "ext.6":
    case "ext.m7":
    case "ext.M7":
    case "ext.9": {
      if (!isTrigger(msg)) return;
      const ext = id.split(".")[1] as ChordExtension;
      s.toggleExtension(ext);
      const on = useChorditStore.getState().activeExtensions.includes(ext);
      showLcd(`EXT ${ext.toUpperCase()}`, on ? "ON" : "OFF");
      return;
    }
    case "dial.perform": {
      const dir = dialDirection(msg, id);
      if (!dir) return;
      s.setPerformanceMode(cycle(PERFORMANCE_MODES, s.performanceMode, dir));
      showLcd("PERFORM", useChorditStore.getState().performanceMode.toUpperCase());
      return;
    }
    case "dial.voicing": {
      const dir = dialDirection(msg, id);
      if (!dir) return;
      s.setVoicingMode(cycle(VOICING_MODES, s.voicingMode, dir));
      showLcd("VOICING", useChorditStore.getState().voicingMode.toUpperCase());
      return;
    }
    case "dial.key": {
      const dir = dialDirection(msg, id);
      if (!dir) return;
      // Per ChordIT spec: CC#51 cycles Key only when Keylock (keyMode) is enabled.
      if (!s.keyModeEnabled) {
        showLcd("KEY LOCK", "OFF");
        return;
      }
      s.setSelectedKey(cycle(ALL_KEYS, s.selectedKey, dir));
      showLcd("KEY", useChorditStore.getState().selectedKey);
      return;
    }
    case "dial.loopLen": {
      const dir = dialDirection(msg, id);
      if (!dir) return;
      const next = Math.min(16, Math.max(4, s.loopLength + dir));
      s.setLoopLength(next);
      return;
    }
    case "dial.style": {
      const dir = dialDirection(msg, id);
      if (!dir) return;
      s.setHarmonicStyle(cycle(ALL_HARMONIC_STYLES, s.harmonicStyle, dir));
      return;
    }
    case "dial.mood": {
      const dir = dialDirection(msg, id);
      if (!dir) return;
      s.setMoodTarget(cycle(ALL_MOOD_TARGETS, s.moodTarget, dir));
      return;
    }
    case "dial.progression": {
      const dir = dialDirection(msg, id);
      if (!dir) return;
      const ids = progressionPresets.map((p) => p.id);
      if (ids.length === 0) return;
      const cur = s.activeProgressionPresetId ?? ids[0];
      s.setActiveProgressionPresetId(cycle(ids, cur, dir));
      return;
    }
    case "slider.rhythm": {
      // Rhythm/Groove slider: absolute mapping — slider range (0..127) is split
      // into N equal segments where N = total available patterns. Each segment
      // selects exactly one preset, so moving the slider across the full range
      // sweeps once through all presets (not per-tick cycling).
      if (msg.type !== "cc" && msg.type !== "noteOn") return;
      const value = msg.type === "cc" ? msg.value : msg.velocity;
      const total = PATTERNS.length + s.userPatterns.length;
      if (total === 0) return;
      // Map 0..127 → 0..total-1 by equal segments.
      const idx = Math.min(total - 1, Math.floor((value / 128) * total));
      if (idx !== s.performanceParams.patternIndex) {
        s.setPerformanceParams({ patternIndex: idx });
      }
      // Remember the last raw value so dialDirection stays consistent if reused.
      lastCc.set(id, value);
      return;
    }
    case "slider.voicingShift": {
      // Voicing shift slider: absolute mapping — slider range (0..127) maps
      // linearly to -6..+6 semitones. Delta vs. last position is applied as
      // voiceUp/voiceDown so the on-screen slider visually mirrors hardware.
      if (msg.type !== "cc" && msg.type !== "noteOn") return;
      const value = msg.type === "cc" ? msg.value : msg.velocity;
      // 0..127 → -6..+6
      const target = Math.max(-6, Math.min(6, Math.round((value / 127) * 12) - 6));
      const prev = s.voicingShiftValue;
      const diff = target - prev;
      if (diff !== 0 && s.currentChordNotes.length > 0) {
        void import("../voicing/voicingEngine").then(({ voiceUp, voiceDown }) => {
          const st = useChorditStore.getState();
          let notes = st.currentChordNotes;
          const dir = diff > 0 ? 1 : -1;
          for (let i = 0; i < Math.abs(diff); i++) {
            notes = dir > 0 ? voiceUp(notes) : voiceDown(notes);
          }
          st.setChord(notes, st.currentDisplayString);
        });
      }
      s.setVoicingShiftValue(target);
      lastCc.set(id, value);
      return;
    }
    case "button.mode": {
      if (!isTrigger(msg)) return;
      s.setHarmonicMode(cycle(ALL_HARMONIC_MODES, s.harmonicMode, 1));
      return;
    }
    case "toggle.perform": {
      if (!isTrigger(msg)) return;
      s.setPerformanceMode(cycle(PERFORMANCE_MODES, s.performanceMode, 1));
      return;
    }
    case "toggle.voicing": {
      if (!isTrigger(msg)) return;
      s.setVoicingMode(cycle(VOICING_MODES, s.voicingMode, 1));
      return;
    }
    case "toggle.key": {
      if (!isTrigger(msg)) return;
      s.toggleKeyMode();
      return;
    }
    case "button.loop": {
      if (!isTrigger(msg)) return;
      s.setLoopEnabled(!s.loopEnabled);
      return;
    }
    case "button.record": {
      if (!isTrigger(msg)) return;
      s.setLoopRecording(!s.loopRecording);
      return;
    }
    case "button.propose": {
      if (!isTrigger(msg)) return;
      void (async () => {
        const [{ generateProposals }, { progressionPresets }] = await Promise.all([
          import("../propose/proposeEngine"),
          import("../progressions/progressionPresets"),
        ]);
        const st = useChorditStore.getState();
        const preset = st.activeProgressionPresetId
          ? progressionPresets.find((p) => p.id === st.activeProgressionPresetId)
          : undefined;
        const keyStr = preset?.exampleKey ?? `${st.selectedKey} major`;
        const proposals = generateProposals({
          selectedKey: keyStr,
          keyModeEnabled: st.keyModeEnabled,
          harmonicMode: st.harmonicMode,
          harmonicStyle: st.harmonicStyle,
          moodTarget: st.moodTarget,
          activeProgressionPresetId: st.activeProgressionPresetId ?? undefined,
          chordHistory: st.chordHistory,
          maxSuggestions: 4,
        });
        useChorditStore.getState().setProposals(proposals);
      })();
      return;
    }
  }
}

/** Idempotent global start. Returns a stop fn. */
export function startMappingDispatcher(): () => void {
  if (started) return () => {};
  started = true;
  unsub = midiManager.subscribe((msg) => {
    if (areNativePadNotesActive() && msg.type === "noteOn" && isNativePadNoteNumber(msg.note)) return;
    const { midiMappings } = useChorditStore.getState();
    const id = findMatchingControl(msg, midiMappings);
    if (id) dispatch(id, msg);
  });
  return () => {
    unsub?.();
    unsub = null;
    started = false;
  };
}
