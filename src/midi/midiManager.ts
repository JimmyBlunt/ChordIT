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

function isMicroKontrolCtrlOutput(name: string) {
  return (/microkontrol/i.test(name) && /ctrl/i.test(name)) || /^ctrl$/i.test(name.trim());
}

function isMicroKontrolPortBInput(name: string) {
  return (/microkontrol/i.test(name) && /port\s*b/i.test(name)) || /^port\s*b$/i.test(name.trim());
}

function isMicroKontrolCtrlInput(name: string) {
  return (/microkontrol/i.test(name) && /ctrl/i.test(name)) || /^ctrl$/i.test(name.trim());
}

export const midiManager = {
  init(): Promise<WebMidiHandle | null> {
    if (handle) return Promise.resolve(handle);
    if (initPromise) return initPromise;
    initPromise = initWebMidi()
      .then((h) => {
        handle = h;
        lastError = h ? null : "Web MIDI nicht verfügbar";
        if (h) {
          attachInput();
          // Auto-reconnect last-used devices globally so hardware input/output
          // works on every screen, not just after visiting Settings.
          try {
            const s = useChorditStore.getState();
            // Prefer the multi-input list; fall back to the legacy single id.
            const ids =
              s.midiInputIds && s.midiInputIds.length > 0
                ? s.midiInputIds.filter((id) => h.inputs.some((i) => i.id === id))
                : s.midiInputId && h.inputs.some((i) => i.id === s.midiInputId)
                ? [s.midiInputId]
                : [];
            const nativeInputs = h.inputs.filter((i) => isMicroKontrolPortBInput(i.name) || isMicroKontrolCtrlInput(i.name));
            for (const input of nativeInputs) {
              if (!ids.includes(input.id)) ids.push(input.id);
            }
            if (ids.length > 0) {
              h.selectInputs(ids);
              s.setMidiInputIds(ids);
              s.setMidiStatus(true, s.midiOutputConnected);
            }
            if (s.midiOutputId && h.outputs.some((o) => o.id === s.midiOutputId)) {
              h.selectOutput(s.midiOutputId);
              const outputName = h.outputs.find((o) => o.id === s.midiOutputId)?.name ?? s.midiOutputId;
              midiBridge.setTarget(h.midiOut, outputName);
              s.setMidiStatus(s.midiInputConnected, true);
            }
            const ctrlOutput = h.outputs.find((o) => isMicroKontrolCtrlOutput(o.name)) ?? null;
            if (ctrlOutput) {
              h.selectSysExOutput(ctrlOutput.id);
              if (!midiBridge.hasTarget()) {
                midiBridge.setTarget(h.midiOut, `SysEx → ${ctrlOutput.name}`);
              }
              void import("./microKontrolNative").then((m) => {
                m.startNativeInput((cb) => h.onSysEx(cb));
                m.startNativePadNotes((cb) => midiManager.subscribe(cb));
                m.startSubLcdSync(0);
              });
              void import("./microKontrolLedSync").then((m) => m.startMicroKontrolLedSync(0));

            }
          } catch {
            // store may not be hydrated yet; Settings will wire devices manually.
          }
        }
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
  selectInputs(ids: string[]) {
    handle?.selectInputs(ids);
  },
  selectOutput(id: string | null) {
    handle?.selectOutput(id);
  },
  selectSysExOutput(id: string | null) {
    handle?.selectSysExOutput(id);
  },
  subscribe(cb: Sub): () => void {
    messageSubs.add(cb);
    return () => {
      messageSubs.delete(cb);
    };
  },
  /** Inject a synthetic MIDI message (e.g. parsed from Native-Mode SysEx) into all subscribers. */
  broadcast(msg: MidiMessage) {
    messageSubs.forEach((s) => s(msg));
  },
  onHandle(cb: (h: WebMidiHandle | null, err: string | null) => void): () => void {
    handleSubs.add(cb);
    cb(handle, lastError);
    return () => {
      handleSubs.delete(cb);
    };
  },
};
