export type NoteEvent =
  | { type: "noteOn"; note: number; velocity: number; channel: number }
  | { type: "noteOff"; note: number; velocity: number; channel: number };

export type MidiMessage =
  | NoteEvent
  | { type: "cc"; cc: number; value: number; channel: number };

export interface MidiOut {
  send(event: NoteEvent): void;
  sendSysEx?(data: number[]): void;
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
  | "slider.rhythm"
  | "slider.voicingShift"
  | "toggle.perform"
  | "toggle.voicing"
  | "toggle.key"
  | "button.loop"
  | "button.record"
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
  "slider.rhythm",
  "slider.voicingShift",
  "toggle.perform",
  "toggle.voicing",
  "toggle.key",
  "button.loop",
  "button.record",
  "button.mode",
  "button.propose",
];

/**
 * Default microKONTROL Librarian mapping from the factory-style scene shown in
 * the Korg Editor Librarian:
 * - Encoders: Port B, channels 1..8, CC#18
 * - Sliders:  Port B, channels 1..8, CC#7
 * - Pad B 9..16: Port B, channels 1..8, CC#16
 * - Pad A 1..8:  Port B, channel 9, individual CCs
 */
export const DEFAULT_MIDI_MAPPINGS: MidiMapping[] = [
  // ── Encoders 1..7 (CC#18, channels 1..7) ─────────────────────────────
  { controlId: "dial.perform", inputType: "cc", channel: 0, number: 18 },
  { controlId: "dial.voicing", inputType: "cc", channel: 1, number: 18 },
  { controlId: "dial.key", inputType: "cc", channel: 2, number: 18 },
  { controlId: "dial.loopLen", inputType: "cc", channel: 3, number: 18 },
  { controlId: "dial.style", inputType: "cc", channel: 4, number: 18 },
  { controlId: "dial.mood", inputType: "cc", channel: 5, number: 18 },
  { controlId: "dial.progression", inputType: "cc", channel: 6, number: 18 },
  // ── Sliders 1..2 (CC#7, channels 1..2) ───────────────────────────────
  { controlId: "slider.rhythm", inputType: "cc", channel: 0, number: 7 },
  { controlId: "slider.voicingShift", inputType: "cc", channel: 1, number: 7 },
  // ── Pad B / Pads 9..16 (CC#16, channels 1..8) ────────────────────────
  { controlId: "chord.Dim", inputType: "cc", channel: 0, number: 16 },
  { controlId: "chord.Min", inputType: "cc", channel: 1, number: 16 },
  { controlId: "chord.Maj", inputType: "cc", channel: 2, number: 16 },
  { controlId: "chord.Sus", inputType: "cc", channel: 3, number: 16 },
  { controlId: "ext.6", inputType: "cc", channel: 4, number: 16 },
  { controlId: "ext.m7", inputType: "cc", channel: 5, number: 16 },
  { controlId: "ext.M7", inputType: "cc", channel: 6, number: 16 },
  { controlId: "ext.9", inputType: "cc", channel: 7, number: 16 },
  // ── Pad A shortcuts (channel 9 in the Librarian = zero-based channel 8) ─
  { controlId: "toggle.perform", inputType: "cc", channel: 8, number: 47 },
  { controlId: "toggle.voicing", inputType: "cc", channel: 8, number: 46 },
  { controlId: "toggle.key", inputType: "cc", channel: 8, number: 45 },
  { controlId: "button.propose", inputType: "cc", channel: 8, number: 44 },
  { controlId: "button.record", inputType: "cc", channel: 8, number: 85 },
  { controlId: "button.loop", inputType: "cc", channel: 8, number: 86 },
  { controlId: "button.mode", inputType: "cc", channel: 8, number: 87 },
];
