import type { ControlId, MidiMapping, MidiMessage } from "./midiTypes";

const STORAGE_KEY = "chordit.mappings";

export class MidiMapper {
  private mappings: MidiMapping[] = [];
  private learnTarget: ControlId | null = null;
  private learnCallback: ((m: MidiMapping) => void) | null = null;

  constructor(initial: MidiMapping[] = []) {
    this.mappings = [...initial];
  }

  list(): MidiMapping[] {
    return [...this.mappings];
  }

  get(controlId: ControlId): MidiMapping | undefined {
    return this.mappings.find((m) => m.controlId === controlId);
  }

  set(mapping: MidiMapping) {
    this.mappings = this.mappings.filter((m) => m.controlId !== mapping.controlId);
    this.mappings.push(mapping);
  }

  clear(controlId: ControlId) {
    this.mappings = this.mappings.filter((m) => m.controlId !== controlId);
  }

  reset() {
    this.mappings = [];
  }

  startLearn(controlId: ControlId, cb?: (m: MidiMapping) => void) {
    this.learnTarget = controlId;
    this.learnCallback = cb ?? null;
  }

  cancelLearn() {
    this.learnTarget = null;
    this.learnCallback = null;
  }

  get learning(): ControlId | null {
    return this.learnTarget;
  }

  /**
   * Feed an incoming MIDI message. Returns the controlId that matched,
   * or null if learn captured it or nothing matched.
   */
  handle(msg: MidiMessage): { matched: ControlId | null; learned: boolean } {
    if (this.learnTarget) {
      if (msg.type === "cc" || msg.type === "noteOn") {
        const mapping: MidiMapping =
          msg.type === "cc"
            ? {
                controlId: this.learnTarget,
                inputType: "cc",
                channel: msg.channel,
                number: msg.cc,
              }
            : {
                controlId: this.learnTarget,
                inputType: "note",
                channel: msg.channel,
                number: msg.note,
              };
        this.set(mapping);
        const cb = this.learnCallback;
        this.learnTarget = null;
        this.learnCallback = null;
        cb?.(mapping);
        return { matched: null, learned: true };
      }
    }
    const m = this.mappings.find((m) => {
      if (m.channel !== getChannel(msg)) return false;
      if (m.inputType === "cc" && msg.type === "cc") return m.number === msg.cc;
      if (m.inputType === "note" && msg.type === "noteOn") return m.number === msg.note;
      return false;
    });
    return { matched: m ? m.controlId : null, learned: false };
  }

  save(storage: Storage = safeLocalStorage()) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(this.mappings));
    } catch {
      // ignore (SSR / quota)
    }
  }

  load(storage: Storage = safeLocalStorage()): MidiMapping[] {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as MidiMapping[];
      this.mappings = parsed;
      return parsed;
    } catch {
      return [];
    }
  }
}

function getChannel(msg: MidiMessage): number {
  return msg.channel;
}

function safeLocalStorage(): Storage {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  // memory shim
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => Array.from(m.keys())[i] ?? null,
    get length() {
      return m.size;
    },
  } as Storage;
}
