import type { MidiOut, NoteEvent } from "./midiTypes";

/**
 * Global MIDI output bridge. The app always sends to this bridge;
 * the Settings screen plugs the currently selected Web MIDI output into it.
 * This lets users route to a real synth even while Mock Mode is on
 * (Mock Mode only disables the hardware *input* requirement).
 */
class MidiBridge implements MidiOut {
  private target: MidiOut | null = null;

  setTarget(out: MidiOut | null) {
    this.target = out;
  }

  hasTarget() {
    return this.target !== null;
  }

  send(event: NoteEvent) {
    this.target?.send(event);
  }
}

export const midiBridge = new MidiBridge();
