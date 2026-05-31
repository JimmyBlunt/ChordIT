import { initWebMidi, type WebMidiHandle } from "./webMidi";
import type { MidiMessage } from "./midiTypes";
import { midiActivity } from "./midiActivity";
import { midiBridge } from "./midiBridge";
import { useChorditStore } from "../app/store";


/**
 * Global, route-independent MIDI singleton.
 * - Initializes Web MIDI once and keeps the handle alive across route changes.
 * - Mirrors incoming notes into midiActivity for the piano monitor.
 * - Exposes subscribe() so any feature (chord trigger, mapper learn, …) can
 *   react to incoming MIDI without owning its own input listener.
 */
type Sub = (msg: MidiMessage) => void;

let handle: WebMidiHandle | null = null;
let initPromise: Promise<WebMidiHandle | null> | null = null;
let lastError: string | null = null;
let attachedUnsub: (() => void) | null = null;

const messageSubs = new Set<Sub>();
const handleSubs = new Set<(h: WebMidiHandle | null, err: string | null) => void>();

function emitHandle() {
  handleSubs.forEach((l) => l(handle, lastError));
}

function attachInput() {
  if (!handle || attachedUnsub) return;
  attachedUnsub = handle.midiIn.onMessage((msg) => {
    if (msg.type === "noteOn" && msg.velocity > 0) {
      midiActivity.noteOn("in", msg.note);
    } else if (
      msg.type === "noteOff" ||
      (msg.type === "noteOn" && msg.velocity === 0)
    ) {
      midiActivity.noteOff("in", msg.note);
    }
    messageSubs.forEach((s) => s(msg));
  });
}

export const midiManager = {
  init(): Promise<WebMidiHandle | null> {
    if (handle) return Promise.resolve(handle);
    if (initPromise) return initPromise;
    initPromise = initWebMidi()
      .then((h) => {
        handle = h;
        lastError = h ? null : "Web MIDI nicht verfügbar";
        if (h) attachInput();
        emitHandle();
        return h;
      })
      .catch((e) => {
        initPromise = null;
        lastError = e?.message ?? String(e);
        emitHandle();
        throw e;
      });
    return initPromise;
  },
  getHandle() {
    return handle;
  },
  getError() {
    return lastError;
  },
  selectInput(id: string | null) {
    handle?.selectInput(id);
  },
  selectOutput(id: string | null) {
    handle?.selectOutput(id);
  },
  subscribe(cb: Sub): () => void {
    messageSubs.add(cb);
    return () => {
      messageSubs.delete(cb);
    };
  },
  onHandle(cb: (h: WebMidiHandle | null, err: string | null) => void): () => void {
    handleSubs.add(cb);
    cb(handle, lastError);
    return () => {
      handleSubs.delete(cb);
    };
  },
};
