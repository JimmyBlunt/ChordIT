import type { MidiOut, NoteEvent } from "./midiTypes";
import { midiActivity } from "./midiActivity";

/**
 * Global MIDI output bridge. The app always sends to this bridge;
 * the Settings screen plugs the currently selected Web MIDI output into it.
 * Mock Mode only disables the hardware *input* requirement.
 * Every event is mirrored into midiActivity so the UI can highlight keys.
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
    if (event.type === "noteOn" && event.velocity > 0) {
      midiActivity.noteOn("out", event.note);
    } else {
      midiActivity.noteOff("out", event.note);
    }
    this.target?.send(event);
  }

  /** Forward a raw SysEx payload to the active output (e.g. microKONTROL LEDs). */
  sendSysEx(data: number[]) {
    this.target?.sendSysEx?.(data);
  }
}

export const midiBridge = new MidiBridge();
