import { describe, expect, it } from "vitest";
import { MidiMapper } from "@/midi/midiMapper";

function memStorage(): Storage {
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

describe("midi mapper — learn", () => {
  it("captures a CC mapping", () => {
    const m = new MidiMapper();
    m.startLearn("dial.perform");
    m.handle({ type: "cc", cc: 21, value: 64, channel: 3 });
    expect(m.get("dial.perform")).toEqual({
      controlId: "dial.perform",
      inputType: "cc",
      channel: 3,
      number: 21,
    });
    expect(m.learning).toBeNull();
  });

  it("captures a Note mapping", () => {
    const m = new MidiMapper();
    m.startLearn("chord.Maj");
    m.handle({ type: "noteOn", note: 48, velocity: 100, channel: 0 });
    expect(m.get("chord.Maj")).toEqual({
      controlId: "chord.Maj",
      inputType: "note",
      channel: 0,
      number: 48,
    });
  });

  it("dispatches the right controlId when a mapped event arrives", () => {
    const m = new MidiMapper();
    m.set({ controlId: "ext.M7", inputType: "note", channel: 0, number: 50 });
    const r = m.handle({ type: "noteOn", note: 50, velocity: 1, channel: 0 });
    expect(r.matched).toBe("ext.M7");
  });

  it("ignores events on a different channel", () => {
    const m = new MidiMapper();
    m.set({ controlId: "ext.M7", inputType: "note", channel: 0, number: 50 });
    const r = m.handle({ type: "noteOn", note: 50, velocity: 1, channel: 1 });
    expect(r.matched).toBeNull();
  });

  it("persists and reloads via storage", () => {
    const store = memStorage();
    const a = new MidiMapper();
    a.set({ controlId: "chord.Sus", inputType: "cc", channel: 2, number: 10 });
    a.save(store);
    const b = new MidiMapper();
    b.load(store);
    expect(b.get("chord.Sus")).toEqual({
      controlId: "chord.Sus",
      inputType: "cc",
      channel: 2,
      number: 10,
    });
  });

  it("reset clears everything", () => {
    const m = new MidiMapper();
    m.set({ controlId: "chord.Maj", inputType: "note", channel: 0, number: 1 });
    m.reset();
    expect(m.list()).toEqual([]);
  });
});
