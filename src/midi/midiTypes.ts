export type NoteEvent =
  | { type: "noteOn"; note: number; velocity: number; channel: number }
  | { type: "noteOff"; note: number; velocity: number; channel: number };

export type MidiMessage =
  | NoteEvent
  | { type: "cc"; cc: number; value: number; channel: number };

export interface MidiOut {
  send(event: NoteEvent): void;
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
  | "toggle.perform"
  | "toggle.voicing"
  | "toggle.key"
  | "button.loop"
  | "button.record";

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
  "toggle.perform",
  "toggle.voicing",
  "toggle.key",
  "button.loop",
  "button.record",
];
