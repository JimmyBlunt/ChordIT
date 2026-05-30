import type { MidiIn, MidiMessage, MidiOut, NoteEvent } from "./midiTypes";

/** In-memory MIDI for tests + mock mode. */
export class MockMidi implements MidiOut, MidiIn {
  events: NoteEvent[] = [];
  private listeners: Array<(m: MidiMessage) => void> = [];

  send(event: NoteEvent): void {
    this.events.push(event);
  }

  onMessage(cb: (m: MidiMessage) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  /** Test helper: simulate an incoming MIDI message. */
  emit(msg: MidiMessage) {
    for (const l of this.listeners) l(msg);
  }

  reset() {
    this.events = [];
  }
}
