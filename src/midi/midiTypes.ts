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
 * Default microKONTROL mapping (ChordIT FreeAssign template, MIDI ch 1).
 * Encoders (Pan): CC#16-19, #48-51 → upper row controls.
 * Sliders (Level): CC#80-83, #87-90 → lower row controls.
 * Pads: Note#36-51 ch1 → chord/extension/transport buttons.
 */
export const DEFAULT_MIDI_MAPPINGS: MidiMapping[] = [
  // ── Encoders (Pan / CC) ──────────────────────────────────────────────
  { controlId: "dial.perform",     inputType: "cc",   channel: 0, number: 16 },
  { controlId: "dial.loopLen",     inputType: "cc",   channel: 0, number: 17 },
  { controlId: "dial.style",       inputType: "cc",   channel: 0, number: 18 },
  { controlId: "dial.mood",        inputType: "cc",   channel: 0, number: 19 },
  { controlId: "dial.progression", inputType: "cc",   channel: 0, number: 48 },
  { controlId: "dial.key",         inputType: "cc",   channel: 0, number: 51 },
  // ── Sliders (Level / CC) ─────────────────────────────────────────────
  { controlId: "slider.rhythm",       inputType: "cc", channel: 0, number: 80 },
  { controlId: "slider.voicingShift", inputType: "cc", channel: 0, number: 90 },
  // ── Pads (Notes, ch 1) ───────────────────────────────────────────────
  { controlId: "ext.6",      inputType: "note", channel: 0, number: 36 },
  { controlId: "ext.m7",     inputType: "note", channel: 0, number: 37 },
  { controlId: "ext.M7",     inputType: "note", channel: 0, number: 38 },
  { controlId: "ext.9",      inputType: "note", channel: 0, number: 39 },
  { controlId: "chord.Dim",  inputType: "note", channel: 0, number: 40 },
  { controlId: "chord.Min",  inputType: "note", channel: 0, number: 41 },
  { controlId: "chord.Maj",  inputType: "note", channel: 0, number: 42 },
  { controlId: "chord.Sus",  inputType: "note", channel: 0, number: 43 },
  { controlId: "button.record", inputType: "note", channel: 0, number: 48 },
  { controlId: "button.loop",   inputType: "note", channel: 0, number: 49 },
  { controlId: "button.mode",   inputType: "note", channel: 0, number: 51 },
];
