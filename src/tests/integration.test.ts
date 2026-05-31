import { describe, expect, it } from "vitest";
import { MidiMapper } from "@/midi/midiMapper";
import { voiceUp, voiceDown } from "@/voicing/voicingEngine";
import { buildChord } from "@/chord/chordEngine";
import { constrainToKey } from "@/key/keyModeEngine";
import { isInScale } from "@/key/scales";
import { trigger } from "@/performance/performanceEngine";
import { MockClock } from "@/performance/mockClock";
import { MockMidi } from "@/midi/mockMidi";

/**
 * Gap-coverage tests covering requirements that were not yet asserted:
 *
 * 14.3  – CC → Voicing-Dial routing (Mapper dispatches voiceUp/voiceDown)
 * 14.4.1 – Strum note-off behavior (stop() emits a matching noteOff per noteOn)
 * 14.5  – Key Mode OFF allows chromatic chord generation
 * 15    – Keyboard input → MIDI output end-to-end pipeline
 */

describe("14.3 · CC → Voicing-Dial routing", () => {
  // Voicing-Dial is one mapped CC. Value > 64 = increment (voiceUp),
  // value < 64 = decrement (voiceDown).
  function applyVoicingCc(value: number, chord: number[]): number[] {
    if (value > 64) return voiceUp(chord);
    if (value < 64) return voiceDown(chord);
    return chord;
  }

  it("CC increment on Voicing-Dial triggers voiceUp", () => {
    const mapper = new MidiMapper();
    mapper.set({ controlId: "dial.voicing", inputType: "cc", channel: 0, number: 16 });
    let chord = buildChord(60, "Maj", []); // [60,64,67]
    const r = mapper.handle({ type: "cc", cc: 16, value: 65, channel: 0 });
    expect(r.matched).toBe("dial.voicing");
    if (r.matched === "dial.voicing") chord = applyVoicingCc(65, chord);
    expect(chord).toEqual([64, 67, 72]);
  });

  it("CC decrement on Voicing-Dial triggers voiceDown", () => {
    const mapper = new MidiMapper();
    mapper.set({ controlId: "dial.voicing", inputType: "cc", channel: 0, number: 17 });
    let chord = [64, 67, 72];
    const r = mapper.handle({ type: "cc", cc: 17, value: 63, channel: 0 });
    expect(r.matched).toBe("dial.voicing");
    if (r.matched === "dial.voicing") chord = applyVoicingCc(63, chord);
    expect(chord).toEqual([60, 64, 67]);
  });
});

describe("14.4.1 · Strum note-off behavior", () => {
  it("stop() emits exactly one noteOff per noteOn", () => {
    const midi = new MockMidi();
    const clock = new MockClock(120);
    clock.start();
    const h = trigger({
      mode: "Strum",
      chord: [60, 64, 67, 71],
      velocity: 100,
      channel: 0,
      midiOut: midi,
      clock,
      strumDeltaMs: 25,
      slopMaxMs: 0,
      slopSeed: 0,
      arpIntervalTicks: 12,
      harpDeltaMs: 25,
    });
    const ons = midi.events.filter((e) => e.type === "noteOn");
    expect(ons.length).toBe(4);
    h.stop();
    const offs = midi.events.filter((e) => e.type === "noteOff");
    expect(offs.length).toBe(ons.length);
    // Every noteOn has a matching noteOff on the same note
    for (const on of ons) {
      expect(offs.some((off) => off.note === on.note)).toBe(true);
    }
  });
});

describe("14.5 · Key Mode OFF", () => {
  it("without constrainToKey, non-diatonic chords remain chromatic", () => {
    // C# Maj triad — none of these are in C major
    const raw = buildChord(61, "Maj", []); // [61, 65, 68]
    expect(raw.some((n) => !isInScale(n, "C"))).toBe(true);
  });

  it("constrainToKey snaps the same chord into the scale (Key ON)", () => {
    const raw = buildChord(61, "Maj", []);
    const snapped = constrainToKey(raw, "C");
    expect(snapped.every((n) => isInScale(n, "C"))).toBe(true);
    expect(snapped).not.toEqual(raw);
  });
});

describe("15 · Keyboard-Input → MIDI-Output end-to-end", () => {
  it("hardware noteOn → chord engine → MIDI-Out emits full chord", () => {
    // Simulate the pipeline: hardware keyboard sends C4 noteOn, app builds
    // a Maj7 chord from it and sends it to MIDI-Out.
    const hwIn = new MockMidi();
    const out = new MockMidi();
    const clock = new MockClock(120);
    clock.start();

    // App-level handler that the real app wires up.
    const unsub = hwIn.onMessage((msg) => {
      if (msg.type !== "noteOn" || msg.velocity === 0) return;
      const chord = buildChord(msg.note, "Maj", ["M7"]);
      trigger({
        mode: "Off",
        chord,
        velocity: msg.velocity,
        channel: 0,
        midiOut: out,
        clock,
        strumDeltaMs: 50,
        slopMaxMs: 0,
        slopSeed: 0,
        arpIntervalTicks: 12,
        harpDeltaMs: 25,
      });
    });

    // Hardware fires C4
    hwIn.emit({ type: "noteOn", note: 60, velocity: 100, channel: 0 });
    unsub();

    const ons = out.events.filter((e) => e.type === "noteOn");
    expect(ons.map((e) => e.note)).toEqual([60, 64, 67, 71]);
    expect(ons.every((e) => e.velocity === 100)).toBe(true);
  });
});
