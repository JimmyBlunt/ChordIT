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
  private targetName = "";
  private targetSubs = new Set<(name: string) => void>();

  setTarget(out: MidiOut | null, name = "") {
    const changed = this.target !== out || this.targetName !== name;
    this.target = out;
    this.targetName = out ? name : "";
    if (changed) this.targetSubs.forEach((cb) => cb(this.targetName));
  }

  hasTarget() {
    return this.target !== null;
  }

  getTargetName() {
    return this.targetName;
  }

  onTargetChange(cb: (name: string) => void) {
    this.targetSubs.add(cb);
    cb(this.targetName);
    return () => {
      this.targetSubs.delete(cb);
    };
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
    if (!this.target?.sendSysEx) return false;
    this.target.sendSysEx(data);
    return true;
  }
}

export const midiBridge = new MidiBridge();
