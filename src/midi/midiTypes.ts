export type NoteEvent =
  | { type: "noteOn"; note: number; velocity: number; channel: number }
  | { type: "noteOff"; note: number; velocity: number; channel: number };

export type MidiMessage =
  | NoteEvent
  | { type: "cc"; cc: number; value: number; channel: number };

export interface MidiOut {
  send(event: NoteEvent): void;
  sendSysEx?(data: number[]): boolean | void;
}

export interface MidiIn {
  onMessage(cb: (msg: MidiMessage) => void): () => void;
}

export type ControlId =
  | "chord.Dim"
  | "chord.Min"
  | "chord.Maj"
  | "chord.Sus"
  | "ext.6"
  | "ext.m7"
  | "ext.M7"
  | "ext.9"
  | "dial.perform"
  | "dial.voicing"
  | "dial.key"
  | "dial.loopLen"
  | "dial.style"
  | "dial.mood"
  | "dial.progression"
  | "dial.bpm"
  | "slider.rhythm"
  | "slider.voicingShift"
  | "slider.strum"
  | "slider.slop"
  | "slider.arp"
  | "slider.harp"
  | "slider.harpOctaves"
  | "slider.octaveBase"
  | "toggle.perform"
  | "toggle.voicing"
  | "toggle.key"
  | "button.loop"
  | "button.record"
  | "button.style"
  | "button.mode"
  | "button.propose";

export type MidiMapping = {
  controlId: ControlId;
  inputType: "cc" | "note";
  channel: number;
  number: number;
};

export const ALL_CONTROL_IDS: ControlId[] = [
  "chord.Dim",
  "chord.Min",
  "chord.Maj",
  "chord.Sus",
  "ext.6",
  "ext.m7",
  "ext.M7",
  "ext.9",
  "dial.perform",
  "dial.voicing",
  "dial.key",
  "dial.loopLen",
  "dial.style",
  "dial.mood",
  "dial.progression",
  "dial.bpm",
  "slider.rhythm",
  "slider.voicingShift",
  "slider.strum",
  "slider.slop",
  "slider.arp",
  "slider.harp",
  "slider.harpOctaves",
  "slider.octaveBase",
  "toggle.perform",
  "toggle.voicing",
  "toggle.key",
  "button.loop",
  "button.record",
  "button.style",
  "button.mode",
  "button.propose",
];

/**
 * Default microKONTROL Native KORG mapping used after the 4-packet init:
 * - Encoders: CC channel 16, CC#16..23
 * - Sliders:  CC channel 16, CC#0..7
 * - Native Init remaps pads to notes 36..51 on Port B.
 *   ChordIT uses Pad 9..16 = notes 44..51 for chord/extension selection.
 */
export const DEFAULT_MIDI_MAPPINGS: MidiMapping[] = [
  // ── Encoders 1..8 (Native: BF 10..17 vv) ──────────────────────────────
  { controlId: "dial.perform", inputType: "cc", channel: 15, number: 16 },
  { controlId: "dial.voicing", inputType: "cc", channel: 15, number: 17 },
  { controlId: "dial.key", inputType: "cc", channel: 15, number: 18 },
  { controlId: "dial.loopLen", inputType: "cc", channel: 15, number: 19 },
  { controlId: "dial.style", inputType: "cc", channel: 15, number: 20 },
  { controlId: "dial.mood", inputType: "cc", channel: 15, number: 21 },
  { controlId: "dial.progression", inputType: "cc", channel: 15, number: 22 },
  { controlId: "dial.bpm", inputType: "cc", channel: 15, number: 23 },
  // ── Sliders 1..8 (Native: BF 00..07 vv) ───────────────────────────────
  { controlId: "slider.rhythm", inputType: "cc", channel: 15, number: 0 },
  { controlId: "slider.voicingShift", inputType: "cc", channel: 15, number: 1 },
  { controlId: "slider.strum", inputType: "cc", channel: 15, number: 2 },
  { controlId: "slider.slop", inputType: "cc", channel: 15, number: 3 },
  { controlId: "slider.arp", inputType: "cc", channel: 15, number: 4 },
  { controlId: "slider.harp", inputType: "cc", channel: 15, number: 5 },
  { controlId: "slider.harpOctaves", inputType: "cc", channel: 15, number: 6 },
  { controlId: "slider.octaveBase", inputType: "cc", channel: 15, number: 7 },
  // ── Native Init Pads 1..8 (notes 36..43, Port B, channel 1) ─────────────
  { controlId: "button.propose", inputType: "note", channel: 0, number: 36 },
  { controlId: "toggle.perform", inputType: "note", channel: 0, number: 37 },
  { controlId: "toggle.voicing", inputType: "note", channel: 0, number: 38 },
  { controlId: "toggle.key", inputType: "note", channel: 0, number: 39 },
  { controlId: "button.loop", inputType: "note", channel: 0, number: 40 },
  { controlId: "button.record", inputType: "note", channel: 0, number: 41 },
  { controlId: "button.style", inputType: "note", channel: 0, number: 42 },
  { controlId: "button.mode", inputType: "note", channel: 0, number: 43 },
  // ── Native Init Pads 9..16 (notes 44..51, Port B, channel 1) ───────────
  { controlId: "chord.Dim", inputType: "note", channel: 0, number: 44 },
  { controlId: "chord.Min", inputType: "note", channel: 0, number: 45 },
  { controlId: "chord.Maj", inputType: "note", channel: 0, number: 46 },
  { controlId: "chord.Sus", inputType: "note", channel: 0, number: 47 },
  { controlId: "ext.6", inputType: "note", channel: 0, number: 48 },
  { controlId: "ext.m7", inputType: "note", channel: 0, number: 49 },
  { controlId: "ext.M7", inputType: "note", channel: 0, number: 50 },
  { controlId: "ext.9", inputType: "note", channel: 0, number: 51 },
  // ── Pad A shortcuts (channel 9 in the Librarian = zero-based channel 8) ─
  { controlId: "toggle.perform", inputType: "cc", channel: 8, number: 47 },
  { controlId: "toggle.voicing", inputType: "cc", channel: 8, number: 46 },
  { controlId: "toggle.key", inputType: "cc", channel: 8, number: 45 },
  { controlId: "button.propose", inputType: "cc", channel: 8, number: 44 },
  { controlId: "button.record", inputType: "cc", channel: 8, number: 85 },
  { controlId: "button.loop", inputType: "cc", channel: 8, number: 86 },
  { controlId: "button.mode", inputType: "cc", channel: 8, number: 87 },
];

/** Fallback aliases for older saved Librarian-style scenes. */
export const MICROKONTROL_LEGACY_SCENE_MAPPINGS: MidiMapping[] = [
  { controlId: "dial.perform", inputType: "cc", channel: 0, number: 18 },
  { controlId: "dial.voicing", inputType: "cc", channel: 1, number: 18 },
  { controlId: "dial.key", inputType: "cc", channel: 2, number: 18 },
  { controlId: "dial.loopLen", inputType: "cc", channel: 3, number: 18 },
  { controlId: "dial.style", inputType: "cc", channel: 4, number: 18 },
  { controlId: "dial.mood", inputType: "cc", channel: 5, number: 18 },
  { controlId: "dial.progression", inputType: "cc", channel: 6, number: 18 },
  { controlId: "dial.bpm", inputType: "cc", channel: 7, number: 18 },
  { controlId: "slider.rhythm", inputType: "cc", channel: 0, number: 7 },
  { controlId: "slider.voicingShift", inputType: "cc", channel: 1, number: 7 },
  { controlId: "slider.strum", inputType: "cc", channel: 2, number: 7 },
  { controlId: "slider.slop", inputType: "cc", channel: 3, number: 7 },
  { controlId: "slider.arp", inputType: "cc", channel: 4, number: 7 },
  { controlId: "slider.harp", inputType: "cc", channel: 5, number: 7 },
  { controlId: "slider.harpOctaves", inputType: "cc", channel: 6, number: 7 },
  { controlId: "slider.octaveBase", inputType: "cc", channel: 7, number: 7 },
];
