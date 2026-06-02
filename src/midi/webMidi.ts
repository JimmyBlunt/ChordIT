import type { MidiIn, MidiMessage, MidiOut, NoteEvent } from "./midiTypes";

type AccessLike = {
  inputs: Map<string, MIDIInputLike>;
  outputs: Map<string, MIDIOutputLike>;
};

interface MIDIInputLike {
  id: string;
  name?: string | null;
  onmidimessage:
    | ((e: { data: Uint8Array | number[] }) => void)
    | null;
}

interface MIDIOutputLike {
  id: string;
  name?: string | null;
  send: (data: number[]) => void;
}

export type SysExListener = (data: number[]) => void;

export type WebMidiHandle = {
  access: AccessLike;
  inputs: { id: string; name: string }[];
  outputs: { id: string; name: string }[];
  /** Legacy single-input select. Replaces the current selection. */
  selectInput: (id: string | null) => void;
  /** Multi-input select. Listens on ALL given inputs simultaneously. */
  selectInputs: (ids: string[]) => void;
  /** Currently active input ids. */
  getSelectedInputs: () => string[];
  selectOutput: (id: string | null) => void;
  /** Selects an independent raw SysEx output, used for controller LEDs. */
  selectSysExOutput: (id: string | null) => void;
  /** Subscribe to raw SysEx packets (F0..F7) from any active input. */
  onSysEx: (cb: SysExListener) => () => void;
  midiIn: MidiIn;
  midiOut: MidiOut;
};

export async function initWebMidi(): Promise<WebMidiHandle | null> {
  if (typeof navigator === "undefined" || !("requestMIDIAccess" in navigator)) {
    return null;
  }
  // SysEx is required to drive Korg microKONTROL pad LEDs in Native KORG mode.
  // Browsers prompt the user once per origin. If the user denies SysEx we
  // silently fall back to a non-SysEx session — note events still work.
  let access: AccessLike;
  try {
    // @ts-expect-error - Web MIDI types live in lib.dom in browsers that support it
    access = await navigator.requestMIDIAccess({ sysex: true });
  } catch {
    // @ts-expect-error - retry without sysex on denial
    access = await navigator.requestMIDIAccess({ sysex: false });
  }

  const listeners: Array<(m: MidiMessage) => void> = [];
  let currentOut: MIDIOutputLike | null = null;
  let currentSysExOut: MIDIOutputLike | null = null;
  const activeInputs = new Map<string, MIDIInputLike>();

  const midiIn: MidiIn = {
    onMessage(cb) {
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };

  const midiOut: MidiOut = {
    send(event: NoteEvent) {
      if (!currentOut) return;
      const status =
        (event.type === "noteOn" ? 0x90 : 0x80) | (event.channel & 0x0f);
      currentOut.send([status, event.note & 0x7f, event.velocity & 0x7f]);
    },
    sendSysEx(data: number[]) {
      const out = currentSysExOut ?? currentOut;
      if (!out) return false;
      try {
        out.send(data);
        return true;
      } catch {
        // Browser refused SysEx (permission denied) — silently drop.
        return false;
      }
    },
  };

  const handleRaw = (data: Uint8Array | number[]) => {
    const [status, d1, d2] = [data[0], data[1], data[2]];
    const channel = status & 0x0f;
    const kind = status & 0xf0;
    let msg: MidiMessage | null = null;
    if (kind === 0x90 && d2 > 0) {
      msg = { type: "noteOn", note: d1, velocity: d2, channel };
    } else if (kind === 0x80 || (kind === 0x90 && d2 === 0)) {
      msg = { type: "noteOff", note: d1, velocity: d2, channel };
    } else if (kind === 0xb0) {
      msg = { type: "cc", cc: d1, value: d2, channel };
    }
    if (msg) for (const l of listeners) l(msg);
  };

  const handle: WebMidiHandle = {
    access,
    inputs: Array.from(access.inputs.values()).map((i) => ({
      id: i.id,
      name: i.name ?? i.id,
    })),
    outputs: Array.from(access.outputs.values()).map((o) => ({
      id: o.id,
      name: o.name ?? o.id,
    })),
    selectInput(id) {
      handle.selectInputs(id ? [id] : []);
    },
    selectInputs(ids) {
      for (const [oldId, inp] of activeInputs) {
        if (!ids.includes(oldId)) {
          inp.onmidimessage = null;
          activeInputs.delete(oldId);
        }
      }
      for (const id of ids) {
        if (activeInputs.has(id)) continue;
        const inp = access.inputs.get(id);
        if (!inp) continue;
        inp.onmidimessage = (e) => handleRaw(e.data);
        activeInputs.set(id, inp);
      }
    },
    getSelectedInputs() {
      return Array.from(activeInputs.keys());
    },
    selectOutput(id) {
      currentOut = id ? access.outputs.get(id) ?? null : null;
    },
    selectSysExOutput(id) {
      currentSysExOut = id ? access.outputs.get(id) ?? null : null;
    },
    midiIn,
    midiOut,
  };
  return handle;
}
