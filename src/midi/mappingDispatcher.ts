import { midiManager } from "./midiManager";
import { useChorditStore, PERFORMANCE_MODES } from "../app/store";
import { ALL_KEYS } from "../key/scales";
import type { ChordExtension, ChordType, VoicingMode } from "../chord/chordTypes";
import type { ControlId, MidiMapping, MidiMessage } from "./midiTypes";

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
      return;
    }
    case "ext.6":
    case "ext.m7":
    case "ext.M7":
    case "ext.9": {
      if (!isTrigger(msg)) return;
      s.toggleExtension(id.split(".")[1] as ChordExtension);
      return;
    }
    case "dial.perform": {
      const dir = dialDirection(msg, id);
      if (!dir) return;
      s.setPerformanceMode(cycle(PERFORMANCE_MODES, s.performanceMode, dir));
      return;
    }
    case "dial.voicing": {
      const dir = dialDirection(msg, id);
      if (!dir) return;
      s.setVoicingMode(cycle(VOICING_MODES, s.voicingMode, dir));
      return;
    }
    case "dial.key": {
      const dir = dialDirection(msg, id);
      if (!dir) return;
      s.setSelectedKey(cycle(ALL_KEYS, s.selectedKey, dir));
      return;
    }
    case "dial.loopLen": {
      const dir = dialDirection(msg, id);
      if (!dir) return;
      const next = Math.min(16, Math.max(4, s.loopLength + dir));
      s.setLoopLength(next);
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
  }
}

/** Idempotent global start. Returns a stop fn. */
export function startMappingDispatcher(): () => void {
  if (started) return () => {};
  started = true;
  unsub = midiManager.subscribe((msg) => {
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
