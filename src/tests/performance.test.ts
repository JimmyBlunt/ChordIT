import { describe, expect, it } from "vitest";
import { MockClock } from "@/performance/mockClock";
import { MockMidi } from "@/midi/mockMidi";
import { trigger } from "@/performance/performanceEngine";
import { PATTERNS } from "@/performance/patterns";

function setup(bpm = 120) {
  const midi = new MockMidi();
  const clock = new MockClock(bpm);
  clock.start();
  return { midi, clock };
}

const baseChord = [60, 64, 67, 71];

describe("performance: Off / Manual", () => {
  it("outputs chord notes simultaneously", () => {
    const { midi, clock } = setup();
    trigger({
      mode: "Off",
      chord: baseChord,
      velocity: 100,
      channel: 0,
      midiOut: midi,
      clock,
      strumDeltaMs: 50,
      slopMaxMs: 10,
      slopSeed: 1,
      arpIntervalTicks: 12,
      harpDeltaMs: 25,
    });
    expect(midi.events.length).toBe(4);
    expect(midi.events.map((e) => e.note)).toEqual(baseChord);
  });
});

describe("performance: Strum", () => {
  it("outputs notes ascending with strumDeltaMs between each", () => {
    const { midi, clock } = setup();
    trigger({
      mode: "Strum",
      chord: baseChord,
      velocity: 100,
      channel: 0,
      midiOut: midi,
      clock,
      strumDeltaMs: 50,
      slopMaxMs: 0,
      slopSeed: 0,
      arpIntervalTicks: 12,
      harpDeltaMs: 25,
    });
    expect(midi.events.map((e) => e.note)).toEqual([60, 64, 67, 71]);
    // 3 gaps of 50ms after starting at t=0
    expect(clock.currentTime).toBeCloseTo(150, 0);
  });

  it("Strum2Octaves doubles sequence at +12", () => {
    const { midi, clock } = setup();
    trigger({
      mode: "Strum2Octaves",
      chord: [60, 64, 67],
      velocity: 100,
      channel: 0,
      midiOut: midi,
      clock,
      strumDeltaMs: 10,
      slopMaxMs: 0,
      slopSeed: 0,
      arpIntervalTicks: 12,
      harpDeltaMs: 25,
    });
    expect(midi.events.map((e) => e.note)).toEqual([60, 64, 67, 72, 76, 79]);
  });
});

describe("performance: Slop", () => {
  it("is repeatable with same seed", () => {
    const a = setup();
    const b = setup();
    const ctx = (m: MockMidi, c: MockClock) => ({
      mode: "Slop" as const,
      chord: baseChord,
      velocity: 100,
      channel: 0,
      midiOut: m,
      clock: c,
      strumDeltaMs: 50,
      slopMaxMs: 20,
      slopSeed: 42,
      arpIntervalTicks: 12,
      harpDeltaMs: 25,
    });
    trigger(ctx(a.midi, a.clock));
    trigger(ctx(b.midi, b.clock));
    expect(a.clock.currentTime).toBeCloseTo(b.clock.currentTime, 5);
    expect(a.midi.events).toEqual(b.midi.events);
  });

  it("variance affects total duration", () => {
    const lo = setup();
    const hi = setup();
    const base = {
      mode: "Slop" as const,
      chord: baseChord,
      velocity: 100,
      channel: 0,
      strumDeltaMs: 50,
      slopSeed: 7,
      arpIntervalTicks: 12,
      harpDeltaMs: 25,
    };
    trigger({ ...base, midiOut: lo.midi, clock: lo.clock, slopMaxMs: 0 });
    trigger({ ...base, midiOut: hi.midi, clock: hi.clock, slopMaxMs: 30 });
    expect(hi.clock.currentTime).not.toBe(lo.clock.currentTime);
  });
});

describe("performance: Arpeggiate", () => {
  it("1/8 fires every 12 ticks (24 PPQN)", () => {
    const { midi, clock } = setup();
    const handle = trigger({
      mode: "Arpeggiate",
      chord: [60, 64, 67],
      velocity: 100,
      channel: 0,
      midiOut: midi,
      clock,
      strumDeltaMs: 50,
      slopMaxMs: 0,
      slopSeed: 0,
      arpIntervalTicks: 12,
      harpDeltaMs: 25,
    });
    clock.advanceTicks(48); // 4 steps
    const noteOns = midi.events.filter((e) => e.type === "noteOn");
    expect(noteOns.length).toBe(4);
    expect(noteOns.map((e) => e.note)).toEqual([60, 64, 67, 60]);
    handle.stop();
    // last note off was emitted
    expect(midi.events.at(-1)!.type).toBe("noteOff");
  });

  it("1/16 fires every 6 ticks", () => {
    const { midi, clock } = setup();
    trigger({
      mode: "Arpeggiate",
      chord: [60, 64],
      velocity: 100,
      channel: 0,
      midiOut: midi,
      clock,
      strumDeltaMs: 50,
      slopMaxMs: 0,
      slopSeed: 0,
      arpIntervalTicks: 6,
      harpDeltaMs: 25,
    });
    clock.advanceTicks(24); // 4 steps
    const noteOns = midi.events.filter((e) => e.type === "noteOn");
    expect(noteOns.length).toBe(4);
  });

  it("Arpeggiate2Octaves extends sequence with +12", () => {
    const { midi, clock } = setup();
    trigger({
      mode: "Arpeggiate2Octaves",
      chord: [60, 64, 67],
      velocity: 100,
      channel: 0,
      midiOut: midi,
      clock,
      strumDeltaMs: 50,
      slopMaxMs: 0,
      slopSeed: 0,
      arpIntervalTicks: 12,
      harpDeltaMs: 25,
    });
    clock.advanceTicks(72); // 6 steps
    const noteOns = midi.events.filter((e) => e.type === "noteOn").map((e) => e.note);
    expect(noteOns).toEqual([60, 64, 67, 72, 76, 79]);
  });

  it("adding extensions grows the loop length", () => {
    const { midi, clock } = setup();
    trigger({
      mode: "Arpeggiate",
      chord: [60, 64, 67, 71, 74], // 5 notes (with M7 + 9)
      velocity: 100,
      channel: 0,
      midiOut: midi,
      clock,
      strumDeltaMs: 50,
      slopMaxMs: 0,
      slopSeed: 0,
      arpIntervalTicks: 12,
      harpDeltaMs: 25,
    });
    clock.advanceTicks(60); // 5 steps
    const noteOns = midi.events.filter((e) => e.type === "noteOn").map((e) => e.note);
    expect(noteOns).toEqual([60, 64, 67, 71, 74]);
  });
});

describe("performance: Pattern", () => {
  it("has at least 10 valid patterns", () => {
    expect(PATTERNS.length).toBeGreaterThanOrEqual(10);
    for (const p of PATTERNS) {
      expect(p.steps.length).toBeGreaterThan(0);
      for (const s of p.steps) {
        expect(s.tickOffset).toBeGreaterThanOrEqual(0);
        expect(s.tickOffset).toBeLessThan(p.lengthTicks);
        expect(s.velocityScale).toBeGreaterThan(0);
        expect(s.velocityScale).toBeLessThanOrEqual(1);
      }
    }
  });

  it("scales output velocity against input velocity", () => {
    const { midi, clock } = setup();
    const pat = {
      id: "t",
      name: "t",
      lengthTicks: 24,
      steps: [
        { tickOffset: 0, noteIndex: 0, velocityScale: 0.5, gateLengthTicks: 6 },
        { tickOffset: 12, noteIndex: 1, velocityScale: 1.0, gateLengthTicks: 6 },
      ],
    };
    trigger({
      mode: "Pattern",
      chord: [60, 64, 67],
      velocity: 100,
      channel: 0,
      midiOut: midi,
      clock,
      strumDeltaMs: 50,
      slopMaxMs: 0,
      slopSeed: 0,
      arpIntervalTicks: 12,
      pattern: pat,
      harpDeltaMs: 25,
    });
    clock.advanceTicks(24);
    const ons = midi.events.filter((e) => e.type === "noteOn");
    // step at offset 12 fires first (at tick 12), then offset 0 wraps at tick 24
    const velocities = ons.map((e) => e.velocity).sort((a, b) => a - b);
    expect(velocities).toEqual([50, 100]);
  });
});

describe("performance: Harp", () => {
  it("plays base notes then transposed up by octaves", () => {
    const { midi, clock } = setup();
    trigger({
      mode: "Harp",
      chord: [60, 64, 67],
      velocity: 100,
      channel: 0,
      midiOut: midi,
      clock,
      strumDeltaMs: 50,
      slopMaxMs: 0,
      slopSeed: 0,
      arpIntervalTicks: 12,
      harpDeltaMs: 10,
      harpOctaves: 2,
    });
    expect(midi.events.map((e) => e.note)).toEqual([60, 64, 67, 72, 76, 79]);
  });

  it("stop() emits matching note offs", () => {
    const { midi, clock } = setup();
    const h = trigger({
      mode: "Harp",
      chord: [60, 64],
      velocity: 100,
      channel: 0,
      midiOut: midi,
      clock,
      strumDeltaMs: 50,
      slopMaxMs: 0,
      slopSeed: 0,
      arpIntervalTicks: 12,
      harpDeltaMs: 10,
      harpOctaves: 2,
    });
    const onCount = midi.events.filter((e) => e.type === "noteOn").length;
    h.stop();
    const offCount = midi.events.filter((e) => e.type === "noteOff").length;
    expect(offCount).toBe(onCount);
  });
});
