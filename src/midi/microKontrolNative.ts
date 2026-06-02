/**
 * Korg microKONTROL Native KORG Mode — Input & LCD helpers.
 *
 * Im Native Mode hört der Controller auf, normale MIDI-Notes/CCs zu schicken;
 * stattdessen kommen alle Pad-/Encoder-/Slider-Events als SysEx über den
 * CTRL-Port. Dieses Modul:
 *   - parst die eingehenden Native-Mode SysEx-Pakete,
 *   - dispatched sie direkt in den ChordIT-Store (Pads → Chord/Extension,
 *     Encoder → Cycle-Controls, Slider → Rhythm/VoicingShift),
 *   - schreibt bei jedem Control-Change den Parameter-Namen + Wert auf das
 *     Main-LCD (Sub-LCDs 1..2 für Slider-Werte).
 *
 * Quelle: Korg microKONTROL MIDI Implementation Rev 1.0, Section 3-2.
 *
 *   Pad output:      F0 42 4g 6E 45 nn vv F7   (nn=0..F, vv=0=release)
 *   Encoder output:  F0 42 4g 6E 43 nn vv F7   (vv = 2's complement delta)
 *   Slider output:   F0 42 4g 6E 41 nn vv F7   (vv = 0..127 absolute)
 *   Switch output:   F0 42 4g 6E 48 nn vv F7
 */
import { useChorditStore, PERFORMANCE_MODES } from "../app/store";
import { midiBridge } from "./midiBridge";
import { ALL_KEYS } from "../key/scales";
import {
  ALL_HARMONIC_STYLES,
  ALL_MOOD_TARGETS,
} from "../progressions/progressionTypes";
import { progressionPresets } from "../progressions/progressionPresets";
import { PATTERNS } from "../performance/patterns";
import type { ChordExtension, ChordType, VoicingMode } from "../chord/chordTypes";
import { lcdSysex, type LcdColor } from "./microKontrolLeds";

const VOICING_MODES: VoicingMode[] = ["Split", "Octave"];

// ── LCD helpers ───────────────────────────────────────────────────────────
const lcdGlobalChannel = 0;
let lastLcdClearTimer: ReturnType<typeof setTimeout> | null = null;

/** Schreibt "TITLE" auf Main-LCD und (optional) value auf Sub-LCD 1. */
export function showLcd(title: string, value?: string, color: LcdColor = "orange") {
  midiBridge.sendSysEx(lcdSysex(lcdGlobalChannel, "main", title, color));
  if (value !== undefined) {
    midiBridge.sendSysEx(lcdSysex(lcdGlobalChannel, 1, value, color));
  }
  if (lastLcdClearTimer) clearTimeout(lastLcdClearTimer);
  lastLcdClearTimer = setTimeout(() => {
    midiBridge.sendSysEx(lcdSysex(lcdGlobalChannel, "main", "ChordIT", "green"));
  }, 1500);
}

// ── Native Mode SysEx parser ──────────────────────────────────────────────
type NativeEvent =
  | { kind: "pad"; index: number; velocity: number }
  | { kind: "encoder"; index: number; delta: number }
  | { kind: "slider"; index: number; value: number }
  | { kind: "switch"; index: number; value: number };

export function parseNativeSysEx(data: number[]): NativeEvent | null {
  // F0 42 4g 6E <func> nn vv F7   (8 bytes)
  if (data.length < 8) return null;
  if (data[0] !== 0xf0 || data[1] !== 0x42 || data[3] !== 0x6e) return null;
  const func = data[4];
  const nn = data[5];
  const vv = data[6];
  switch (func) {
    case 0x45:
      return { kind: "pad", index: nn & 0x0f, velocity: vv };
    case 0x43: {
      // 2's complement 7-bit delta
      const delta = vv & 0x40 ? vv - 0x80 : vv;
      return { kind: "encoder", index: nn & 0x0f, delta };
    }
    case 0x41:
      return { kind: "slider", index: nn & 0x0f, value: vv };
    case 0x48:
      return { kind: "switch", index: nn & 0x0f, value: vv };
    default:
      return null;
  }
}

// ── Dispatch tables ───────────────────────────────────────────────────────
const PAD_TO_CHORD: Record<number, ChordType | undefined> = {
  8: "Dim", // Pad 9
  9: "Min", // Pad 10
  10: "Maj", // Pad 11
  11: "Sus", // Pad 12
};
const PAD_TO_EXT: Record<number, ChordExtension | undefined> = {
  12: "6", // Pad 13
  13: "m7", // Pad 14
  14: "M7", // Pad 15
  15: "9", // Pad 16
};

function cycle<T>(arr: readonly T[], current: T, dir: number): T {
  if (dir === 0) return current;
  const i = arr.indexOf(current);
  const next = (i + (dir > 0 ? 1 : -1) + arr.length) % arr.length;
  return arr[next];
}

/**
 * Pad 1..8 (Index 0..7) — Transport / Mode-Cycle.
 *   Pad 1 Propose          Pad 5 Loop Toggle
 *   Pad 2 Cycle Perform    Pad 6 Record Toggle
 *   Pad 3 Cycle Voicing    Pad 7 Cycle Style
 *   Pad 4 KeyLock Toggle   Pad 8 Cycle Mode
 */
function handleTopPad(index: number) {
  const s = useChorditStore.getState();
  switch (index) {
    case 0: {
      void (async () => {
        const [{ generateProposals }, { progressionPresets: pp }] = await Promise.all([
          import("../propose/proposeEngine"),
          import("../progressions/progressionPresets"),
        ]);
        const st = useChorditStore.getState();
        const preset = st.activeProgressionPresetId
          ? pp.find((p) => p.id === st.activeProgressionPresetId)
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
      showLcd("PROPOSE", "GO");
      return;
    }
    case 1:
      s.setPerformanceMode(cycle(PERFORMANCE_MODES, s.performanceMode, 1));
      showLcd("PERFORM", useChorditStore.getState().performanceMode.toUpperCase());
      return;
    case 2:
      s.setVoicingMode(cycle(VOICING_MODES, s.voicingMode, 1));
      showLcd("VOICING", useChorditStore.getState().voicingMode.toUpperCase());
      return;
    case 3:
      s.toggleKeyMode();
      showLcd("KEYLOCK", useChorditStore.getState().keyModeEnabled ? "ON" : "OFF");
      return;
    case 4:
      s.setLoopEnabled(!s.loopEnabled);
      showLcd("LOOP", useChorditStore.getState().loopEnabled ? "ON" : "OFF");
      return;
    case 5:
      s.setLoopRecording(!s.loopRecording);
      showLcd("RECORD", useChorditStore.getState().loopRecording ? "REC" : "OFF");
      return;
    case 6:
      s.setHarmonicStyle(cycle(ALL_HARMONIC_STYLES, s.harmonicStyle, 1));
      showLcd("STYLE", useChorditStore.getState().harmonicStyle.toUpperCase());
      return;
    case 7: {
      void import("../progressions/progressionTypes").then(({ ALL_HARMONIC_MODES: A }) => {
        const st = useChorditStore.getState();
        st.setHarmonicMode(cycle(A, st.harmonicMode, 1));
        showLcd("MODE", String(useChorditStore.getState().harmonicMode).toUpperCase());
      });
      return;
    }
  }
}

function handlePad(index: number, velocity: number) {
  if (velocity === 0) return; // ignore release
  const s = useChorditStore.getState();
  const ct = PAD_TO_CHORD[index];
  if (ct) {
    s.setChordType(ct);
    showLcd(`CHORD ${ct.toUpperCase()}`);
    return;
  }
  const ext = PAD_TO_EXT[index];
  if (ext) {
    s.toggleExtension(ext);
    const on = useChorditStore.getState().activeExtensions.includes(ext);
    showLcd(`EXT ${ext.toUpperCase()}`, on ? "ON" : "OFF");
    return;
  }
  if (index >= 0 && index <= 7) handleTopPad(index);
}

function handleEncoder(index: number, delta: number) {
  const s = useChorditStore.getState();
  switch (index) {
    case 0:
      s.setPerformanceMode(cycle(PERFORMANCE_MODES, s.performanceMode, delta));
      showLcd("PERFORM", useChorditStore.getState().performanceMode.toUpperCase());
      return;
    case 1:
      s.setVoicingMode(cycle(VOICING_MODES, s.voicingMode, delta));
      showLcd("VOICING", useChorditStore.getState().voicingMode.toUpperCase());
      return;
    case 2:
      if (!s.keyModeEnabled) {
        showLcd("KEY LOCK", "OFF");
        return;
      }
      s.setSelectedKey(cycle(ALL_KEYS, s.selectedKey, delta));
      showLcd("KEY", useChorditStore.getState().selectedKey);
      return;
    case 3: {
      const next = Math.min(16, Math.max(4, s.loopLength + (delta > 0 ? 1 : -1)));
      s.setLoopLength(next);
      showLcd("LOOP LEN", `${next}`);
      return;
    }
    case 4:
      s.setHarmonicStyle(cycle(ALL_HARMONIC_STYLES, s.harmonicStyle, delta));
      showLcd("STYLE", useChorditStore.getState().harmonicStyle.toUpperCase());
      return;
    case 5:
      s.setMoodTarget(cycle(ALL_MOOD_TARGETS, s.moodTarget, delta));
      showLcd("MOOD", String(useChorditStore.getState().moodTarget).toUpperCase());
      return;
    case 6: {
      const ids = progressionPresets.map((p) => p.id);
      if (ids.length === 0) return;
      const cur = s.activeProgressionPresetId ?? ids[0];
      const nextId = cycle(ids, cur, delta);
      s.setActiveProgressionPresetId(nextId);
      showLcd("PROG", nextId.slice(0, 8).toUpperCase());
      return;
    }
  }
}

function handleSlider(index: number, value: number) {
  const s = useChorditStore.getState();
  switch (index) {
    case 0: {
      const total = PATTERNS.length + s.userPatterns.length;
      if (total === 0) return;
      const idx = Math.min(total - 1, Math.floor((value / 128) * total));
      if (idx !== s.performanceParams.patternIndex) {
        s.setPerformanceParams({ patternIndex: idx });
      }
      showLcd("RHYTHM", `PAT ${idx + 1}`);
      return;
    }
    case 1: {
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
      showLcd("V.SHIFT", `${target >= 0 ? "+" : ""}${target}`);
      return;
    }
  }
}

export function dispatchNativeEvent(ev: NativeEvent) {
  if (ev.kind === "pad") handlePad(ev.index, ev.velocity);
  else if (ev.kind === "encoder") handleEncoder(ev.index, ev.delta);
  else if (ev.kind === "slider") handleSlider(ev.index, ev.value);
}

// ── Public entry points ───────────────────────────────────────────────────
let nativeUnsub: (() => void) | null = null;
let padNoteUnsub: (() => void) | null = null;
let padNotesActive = false;

export function startNativeInput(onSysEx: (cb: (data: number[]) => void) => () => void) {
  if (nativeUnsub) nativeUnsub();
  nativeUnsub = onSysEx((data) => {
    const ev = parseNativeSysEx(data);
    if (ev) dispatchNativeEvent(ev);
  });
  return () => {
    nativeUnsub?.();
    nativeUnsub = null;
  };
}

/**
 * Im funktionierenden Python-Setup (microkontrol_toggle_v3.py) senden die Pads
 * im Native-Mode standardmäßig MIDI-Notes 36..51 über Port B (NICHT als SysEx).
 * Diese Funktion abonniert den normalen MIDI-Stream und übersetzt diese Notes
 * in Pad-Events.
 */
type MidiMsgLike = { type: string; note?: number; velocity?: number };

export function isNativePadNoteNumber(note: number | undefined): note is number {
  return note !== undefined && note >= 36 && note <= 51;
}

export function areNativePadNotesActive(): boolean {
  return padNotesActive;
}

export function startNativePadNotes(
  subscribe: (cb: (msg: MidiMsgLike) => void) => () => void,
) {
  if (padNoteUnsub) padNoteUnsub();
  padNotesActive = true;
  padNoteUnsub = subscribe((msg) => {
    const note = msg.note;
    if (!isNativePadNoteNumber(note)) return;
    const padIndex = note - 36; // 0..15
    if (msg.type === "noteOn" && (msg.velocity ?? 0) > 0) {
      handlePad(padIndex, msg.velocity ?? 127);
    }
  });
  return () => {
    padNoteUnsub?.();
    padNoteUnsub = null;
    padNotesActive = false;
  };
}

