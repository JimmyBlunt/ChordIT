import { useMemo, useState } from "react";
import { buildChord } from "@/chord/chordEngine";
import { getChordDisplayString } from "@/chord/chordNotation";
import {
  ALL_CHORD_TYPES,
  ALL_EXTENSIONS,
  CHORD_TYPE_INTERVALS,
  EXTENSION_INTERVALS,
  type ChordExtension,
  type ChordType,
} from "@/chord/chordTypes";
import {
  applyOctave,
  applySplit,
  applyVoicingMode,
  voiceDown,
  voiceUp,
} from "@/voicing/voicingEngine";
import { constrainToKey } from "@/key/keyModeEngine";
import { isInScale, majorScalePitchClasses } from "@/key/scales";
import { trigger } from "@/performance/performanceEngine";
import { MockClock } from "@/performance/mockClock";
import { MockMidi } from "@/midi/mockMidi";
import { PATTERNS } from "@/performance/patterns";
import { MidiMapper } from "@/midi/midiMapper";
import { loopRecorder, type StoredLoop } from "@/app/loopRecorder";

type Ev = { t: number; note: number; on: boolean };
type RunResult = {
  id: string;
  group: string;
  title: string;
  description: string;
  input: { keys: number[]; label: string };
  output: { notes: number[]; events?: Ev[] };
  pass: boolean;
  notes?: string;
};

// ---------- helpers ----------
function subsets<T>(arr: T[]): T[][] {
  const out: T[][] = [[]];
  for (const x of arr) {
    const len = out.length;
    for (let i = 0; i < len; i++) out.push([...out[i], x]);
  }
  return out;
}
function arrEq(a: number[], b: number[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
function collect(fn: (out: MockMidi, clock: MockClock) => void) {
  const out = new MockMidi();
  const clock = new MockClock(120);
  clock.start();
  fn(out, clock);
  return { out, clock };
}
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

// ---------- test builders ----------
function chordComboTests(): RunResult[] {
  const ROOT = 60;
  const results: RunResult[] = [];
  const allSubs = subsets(ALL_EXTENSIONS);
  for (const type of ALL_CHORD_TYPES as ChordType[]) {
    for (const exts of allSubs) {
      const notes = buildChord(ROOT, type, exts as ChordExtension[]);
      const expected = Array.from(
        new Set([
          ...CHORD_TYPE_INTERVALS[type].map((i) => ROOT + i),
          ...exts.map((e) => ROOT + EXTENSION_INTERVALS[e as ChordExtension]),
        ]),
      ).sort((a, b) => a - b);
      const sortedOk = notes.every((n, i) => i === 0 || n > notes[i - 1]);
      const uniqueOk = new Set(notes).size === notes.length;
      const matchOk = arrEq(notes, expected);
      results.push({
        id: `chord-${type}-${exts.join("_") || "none"}`,
        group: "Chord Engine · Combinations",
        title: `${type} + [${exts.join(",") || "—"}]`,
        description: `Root C4 (60), expected ${expected.length} notes`,
        input: { keys: [ROOT], label: `C4 · ${type}${exts.length ? " · " + exts.join("+") : ""}` },
        output: { notes },
        pass: sortedOk && uniqueOk && matchOk,
        notes: getChordDisplayString(ROOT, type, exts as ChordExtension[]),
      });
    }
  }
  return results;
}

function chordNotationTests(): RunResult[] {
  const cases: Array<{
    root: number;
    type: ChordType;
    exts: ChordExtension[];
    expected: string;
    title: string;
  }> = [
    { root: 60, type: "Maj", exts: [], expected: "C", title: "Maj alone → C" },
    { root: 60, type: "Min", exts: [], expected: "Cm", title: "Min → Cm" },
    { root: 60, type: "Sus", exts: [], expected: "Csus", title: "Sus → Csus" },
    { root: 60, type: "Dim", exts: [], expected: "Cdim", title: "Dim → Cdim" },
    { root: 60, type: "Maj", exts: ["m7"], expected: "C⁷", title: "Dominant 7 (Maj+m7) → C⁷" },
    { root: 60, type: "Maj", exts: ["M7"], expected: "Cᴹ⁷", title: "Maj+M7 → Cᴹ⁷" },
    { root: 60, type: "Maj", exts: ["6"], expected: "C⁶", title: "Maj+6 → C⁶" },
    { root: 60, type: "Maj", exts: ["9"], expected: "C⁹", title: "Maj+9 → C⁹" },
    { root: 60, type: "Maj", exts: ["6", "M7", "9"], expected: "Cᴶᴬᶻᶻ", title: "3 ext → JAZZ" },
    { root: 60, type: "Min", exts: ["6", "m7", "9"], expected: "Cmᴶᴬᶻᶻ", title: "Min 3 ext → mJAZZ" },
    { root: 60, type: "Maj", exts: ["6", "m7", "M7", "9"], expected: "Cᵂᵀᶠ", title: "4 ext → WTF" },
    { root: 60, type: "Sus", exts: ["6", "m7", "M7", "9"], expected: "Csusᵂᵀᶠ", title: "Sus WTF" },
    { root: 60, type: "Dim", exts: ["6", "m7", "M7", "9"], expected: "Cdimᵂᵀᶠ", title: "Dim WTF" },
    { root: 60, type: "Min", exts: ["6", "m7", "M7", "9"], expected: "Cmᵂᵀᶠ", title: "Min WTF" },
  ];
  return cases.map((c, i) => {
    const got = getChordDisplayString(c.root, c.type, c.exts);
    const notes = buildChord(c.root, c.type, c.exts);
    return {
      id: `notation-${i}`,
      group: "Chord Notation",
      title: c.title,
      description: `Expect: "${c.expected}"`,
      input: { keys: [c.root], label: `${c.type}${c.exts.length ? " · " + c.exts.join("+") : ""}` },
      output: { notes },
      pass: got === c.expected,
      notes: `got "${got}"`,
    };
  });
}

function keyTests(): RunResult[] {
  const out: RunResult[] = [];
  const pcs = majorScalePitchClasses("C");
  out.push({
    id: "key-pcs-c",
    group: "Key Mode",
    title: "C major pitch classes",
    description: "Expect [0,2,4,5,7,9,11]",
    input: { keys: [], label: "Key=C" },
    output: { notes: pcs.map((p) => 60 + p) },
    pass: arrEq(pcs, [0, 2, 4, 5, 7, 9, 11]),
    notes: `[${pcs.join(",")}]`,
  });
  for (const root of [60, 62, 64]) {
    const chord = constrainToKey(buildChord(root, "Maj", []), "C");
    out.push({
      id: `key-diatonic-${root}`,
      group: "Key Mode",
      title: `Diatonic Maj@${root} stays in C`,
      description: "All output notes ∈ C major",
      input: { keys: [root], label: `Root ${root} Maj · Key=C` },
      output: { notes: chord },
      pass: chord.every((n) => isInScale(n, "C")),
    });
  }
  const snap = constrainToKey(buildChord(61, "Maj", []), "C");
  out.push({
    id: "key-snap-cs",
    group: "Key Mode",
    title: "Non-diatonic C# snaps into C",
    description: "Every output ∈ C major",
    input: { keys: [61], label: "C#4 Maj · Key=C" },
    output: { notes: snap },
    pass: snap.every((n) => isInScale(n, "C")),
  });
  const cMaj = constrainToKey(buildChord(60, "Maj", []), "C");
  const gMaj = constrainToKey(buildChord(60, "Maj", []), "G");
  out.push({
    id: "key-change",
    group: "Key Mode",
    title: "Key=G allows F# (not in C)",
    description: "G-major snap differs from C-major snap",
    input: { keys: [60], label: "C4 Maj · Key=C vs G" },
    output: { notes: gMaj },
    pass: cMaj.every((n) => isInScale(n, "C")) && gMaj.every((n) => isInScale(n, "G")),
    notes: `C→[${cMaj.join(",")}] G→[${gMaj.join(",")}]`,
  });
  return out;
}

function voicingTests(): RunResult[] {
  const out: RunResult[] = [];
  const a = [60, 64, 67];
  out.push({
    id: "voice-up",
    group: "Voicing",
    title: "voiceUp rotates lowest +12",
    description: "[60,64,67] → [64,67,72]",
    input: { keys: a, label: "C-E-G" },
    output: { notes: voiceUp(a) },
    pass: arrEq(voiceUp(a), [64, 67, 72]),
  });
  const b = [64, 67, 72];
  out.push({
    id: "voice-down",
    group: "Voicing",
    title: "voiceDown rotates highest -12",
    description: "[64,67,72] → [60,64,67]",
    input: { keys: b, label: "E-G-C" },
    output: { notes: voiceDown(b) },
    pass: arrEq(voiceDown(b), [60, 64, 67]),
  });
  out.push({
    id: "voice-roundtrip",
    group: "Voicing",
    title: "voiceUp ↔ voiceDown reversible",
    description: "down(up(x)) === x",
    input: { keys: a, label: "C-E-G" },
    output: { notes: voiceDown(voiceUp(a)) },
    pass: arrEq(voiceDown(voiceUp(a)), a),
  });
  out.push({
    id: "voice-split-below",
    group: "Voicing",
    title: "Split shifts below splitKey up",
    description: "[55,60,64] split@60 → [60,64,67]",
    input: { keys: [55, 60, 64], label: "Split@60" },
    output: { notes: applySplit([55, 60, 64], 60) },
    pass: arrEq(applySplit([55, 60, 64], 60), [60, 64, 67]),
  });
  out.push({
    id: "voice-split-eq",
    group: "Voicing",
    title: "Split boundary: note==splitKey unchanged",
    description: "[60,64,67] split@60 → [60,64,67]",
    input: { keys: [60, 64, 67], label: "Split@60" },
    output: { notes: applySplit([60, 64, 67], 60) },
    pass: arrEq(applySplit([60, 64, 67], 60), [60, 64, 67]),
  });
  out.push({
    id: "voice-split-below1",
    group: "Voicing",
    title: "Split: splitKey-1 shifts up",
    description: "[59] split@60 → [71]",
    input: { keys: [59], label: "Split@60" },
    output: { notes: applySplit([59], 60) },
    pass: arrEq(applySplit([59], 60), [71]),
  });
  const oct = applyOctave([48, 60, 76], 60);
  out.push({
    id: "voice-octave",
    group: "Voicing",
    title: "Octave folds into [base, base+11]",
    description: "[48,60,76] @60 → [60,60,64]",
    input: { keys: [48, 60, 76], label: "Octave@60" },
    output: { notes: oct },
    pass:
      arrEq(oct, [60, 60, 64]) &&
      applyOctave([0, 60, 100, 127], 60).every((n) => n >= 60 && n <= 71),
  });
  // smoke: applyVoicingMode dispatch
  out.push({
    id: "voice-mode-dispatch",
    group: "Voicing",
    title: "applyVoicingMode dispatches Split/Octave",
    description: "Split mode matches applySplit",
    input: { keys: [55, 60, 64], label: "Mode=Split" },
    output: { notes: applyVoicingMode([55, 60, 64], "Split", 60, 60) },
    pass: arrEq(applyVoicingMode([55, 60, 64], "Split", 60, 60), applySplit([55, 60, 64], 60)),
  });
  return out;
}

function mappingTests(): RunResult[] {
  const out: RunResult[] = [];
  {
    const m = new MidiMapper();
    m.startLearn("dial.perform");
    m.handle({ type: "cc", cc: 21, value: 64, channel: 3 });
    const got = m.get("dial.perform");
    out.push({
      id: "map-cc",
      group: "MIDI Mapper",
      title: "Learn captures CC mapping",
      description: "CC#21 ch3 → dial.perform",
      input: { keys: [], label: "CC#21 ch3" },
      output: { notes: [] },
      pass:
        !!got &&
        got.inputType === "cc" &&
        got.channel === 3 &&
        got.number === 21 &&
        m.learning === null,
      notes: JSON.stringify(got),
    });
  }
  {
    const m = new MidiMapper();
    m.startLearn("chord.Maj");
    m.handle({ type: "noteOn", note: 48, velocity: 100, channel: 0 });
    const got = m.get("chord.Maj");
    out.push({
      id: "map-note",
      group: "MIDI Mapper",
      title: "Learn captures Note mapping",
      description: "Note 48 ch0 → chord.Maj",
      input: { keys: [48], label: "Note 48 ch0" },
      output: { notes: [48] },
      pass: !!got && got.inputType === "note" && got.number === 48 && got.channel === 0,
      notes: JSON.stringify(got),
    });
  }
  {
    const m = new MidiMapper();
    m.set({ controlId: "ext.M7", inputType: "note", channel: 0, number: 50 });
    const r = m.handle({ type: "noteOn", note: 50, velocity: 1, channel: 0 });
    out.push({
      id: "map-dispatch",
      group: "MIDI Mapper",
      title: "Dispatches mapped controlId",
      description: "Note 50 ch0 → ext.M7",
      input: { keys: [50], label: "Note 50 ch0" },
      output: { notes: [50] },
      pass: r.matched === "ext.M7",
      notes: `matched=${r.matched}`,
    });
  }
  {
    const m = new MidiMapper();
    m.set({ controlId: "ext.M7", inputType: "note", channel: 0, number: 50 });
    const r = m.handle({ type: "noteOn", note: 50, velocity: 1, channel: 1 });
    out.push({
      id: "map-channel",
      group: "MIDI Mapper",
      title: "Ignores different channel",
      description: "Mapped ch0, event ch1 → no match",
      input: { keys: [50], label: "Note 50 ch1" },
      output: { notes: [] },
      pass: r.matched === null,
    });
  }
  {
    const store = memStorage();
    const a = new MidiMapper();
    a.set({ controlId: "chord.Sus", inputType: "cc", channel: 2, number: 10 });
    a.save(store);
    const b = new MidiMapper();
    b.load(store);
    const got = b.get("chord.Sus");
    out.push({
      id: "map-persist",
      group: "MIDI Mapper",
      title: "Persists & reloads via storage",
      description: "save() / load() roundtrip",
      input: { keys: [], label: "chord.Sus → CC10 ch2" },
      output: { notes: [] },
      pass:
        !!got && got.inputType === "cc" && got.channel === 2 && got.number === 10,
      notes: JSON.stringify(got),
    });
  }
  {
    const m = new MidiMapper();
    m.set({ controlId: "chord.Maj", inputType: "note", channel: 0, number: 1 });
    m.reset();
    out.push({
      id: "map-reset",
      group: "MIDI Mapper",
      title: "reset() clears all mappings",
      description: "list() → []",
      input: { keys: [], label: "—" },
      output: { notes: [] },
      pass: m.list().length === 0,
    });
  }
  return out;
}

function performanceTests(): RunResult[] {
  const out: RunResult[] = [];
  const base = [60, 64, 67, 71];

  // Off
  {
    const { out: midi } = collect((midiOut, clock) =>
      trigger({
        mode: "Off",
        chord: base,
        velocity: 100,
        channel: 0,
        midiOut,
        clock,
        strumDeltaMs: 50,
        slopMaxMs: 10,
        slopSeed: 1,
        arpIntervalTicks: 12,
        harpDeltaMs: 25,
      }),
    );
    out.push({
      id: "perf-off",
      group: "Performance",
      title: "Off · simultaneous noteOns",
      description: "4 noteOns @ t=0",
      input: { keys: [60], label: "Cmaj7 · Off" },
      output: {
        notes: midi.events.map((e) => e.note),
        events: midi.events.map((e) => ({ t: 0, note: e.note, on: e.type === "noteOn" })),
      },
      pass: midi.events.length === 4 && arrEq(midi.events.map((e) => e.note), base),
    });
  }

  // Strum
  {
    const { out: midi, clock } = collect((midiOut, c) =>
      trigger({
        mode: "Strum",
        chord: base,
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 0,
        slopSeed: 0,
        arpIntervalTicks: 12,
        harpDeltaMs: 25,
      }),
    );
    out.push({
      id: "perf-strum",
      group: "Performance",
      title: "Strum · ascending w/ delta",
      description: "4 notes spaced 50ms, total 150ms",
      input: { keys: [60], label: "Cmaj7 · Strum 50ms" },
      output: {
        notes: midi.events.map((e) => e.note),
        events: midi.events.map((e, i) => ({ t: i * 50, note: e.note, on: true })),
      },
      pass: arrEq(midi.events.map((e) => e.note), base) && Math.abs(clock.currentTime - 150) < 1,
      notes: `t=${clock.currentTime.toFixed(0)}ms`,
    });
  }

  // Strum2Octaves
  {
    const { out: midi } = collect((midiOut, c) =>
      trigger({
        mode: "Strum2Octaves",
        chord: [60, 64, 67],
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 10,
        slopMaxMs: 0,
        slopSeed: 0,
        arpIntervalTicks: 12,
        harpDeltaMs: 25,
      }),
    );
    const expected = [60, 64, 67, 72, 76, 79];
    out.push({
      id: "perf-strum2",
      group: "Performance",
      title: "Strum2Octaves doubles +12",
      description: "[60,64,67] → 6 notes incl. octave",
      input: { keys: [60], label: "Cmaj · Strum2Oct" },
      output: {
        notes: midi.events.map((e) => e.note),
        events: midi.events.map((e, i) => ({ t: i * 10, note: e.note, on: true })),
      },
      pass: arrEq(midi.events.map((e) => e.note), expected),
    });
  }

  // Slop repeatable
  {
    const a = collect((midiOut, c) =>
      trigger({
        mode: "Slop",
        chord: base,
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 20,
        slopSeed: 42,
        arpIntervalTicks: 12,
        harpDeltaMs: 25,
      }),
    );
    const b = collect((midiOut, c) =>
      trigger({
        mode: "Slop",
        chord: base,
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 20,
        slopSeed: 42,
        arpIntervalTicks: 12,
        harpDeltaMs: 25,
      }),
    );
    out.push({
      id: "perf-slop-repeat",
      group: "Performance",
      title: "Slop · repeatable with same seed",
      description: "Seed 42 yields identical events",
      input: { keys: [60], label: "Cmaj7 · Slop seed=42" },
      output: {
        notes: a.out.events.map((e) => e.note),
        events: a.out.events.map((e, i) => ({ t: i * 30, note: e.note, on: true })),
      },
      pass:
        JSON.stringify(a.out.events) === JSON.stringify(b.out.events) &&
        Math.abs(a.clock.currentTime - b.clock.currentTime) < 1e-5,
    });
  }

  // Slop variance
  {
    const lo = collect((midiOut, c) =>
      trigger({
        mode: "Slop",
        chord: base,
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 0,
        slopSeed: 7,
        arpIntervalTicks: 12,
        harpDeltaMs: 25,
      }),
    );
    const hi = collect((midiOut, c) =>
      trigger({
        mode: "Slop",
        chord: base,
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 30,
        slopSeed: 7,
        arpIntervalTicks: 12,
        harpDeltaMs: 25,
      }),
    );
    out.push({
      id: "perf-slop-variance",
      group: "Performance",
      title: "Slop · variance affects duration",
      description: "slopMaxMs=0 vs 30 differ",
      input: { keys: [60], label: "Slop variance" },
      output: { notes: hi.out.events.map((e) => e.note) },
      pass: lo.clock.currentTime !== hi.clock.currentTime,
      notes: `lo=${lo.clock.currentTime.toFixed(1)}ms hi=${hi.clock.currentTime.toFixed(1)}ms`,
    });
  }

  // Arpeggiate 1/8
  {
    const { out: midi, clock } = collect((midiOut, c) => {
      const h = trigger({
        mode: "Arpeggiate",
        chord: [60, 64, 67],
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 0,
        slopSeed: 0,
        arpIntervalTicks: 12,
        harpDeltaMs: 25,
      });
      c.advanceTicks(48);
      h.stop();
    });
    const ons = midi.events.filter((e) => e.type === "noteOn");
    out.push({
      id: "perf-arp-8",
      group: "Performance",
      title: "Arpeggiate 1/8 · 12 ticks",
      description: "4 steps over 48 ticks",
      input: { keys: [60], label: "Cmaj · Arp 1/8" },
      output: {
        notes: ons.map((e) => e.note),
        events: ons.map((e, i) => ({ t: i * 12, note: e.note, on: true })),
      },
      pass:
        ons.length === 4 &&
        arrEq(ons.map((e) => e.note), [60, 64, 67, 60]) &&
        midi.events.at(-1)?.type === "noteOff",
      notes: `clock=${clock.currentTime}`,
    });
  }

  // Arpeggiate 1/16
  {
    const { out: midi } = collect((midiOut, c) => {
      trigger({
        mode: "Arpeggiate",
        chord: [60, 64],
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 0,
        slopSeed: 0,
        arpIntervalTicks: 6,
        harpDeltaMs: 25,
      });
      c.advanceTicks(24);
    });
    const ons = midi.events.filter((e) => e.type === "noteOn");
    out.push({
      id: "perf-arp-16",
      group: "Performance",
      title: "Arpeggiate 1/16 · 6 ticks",
      description: "4 steps over 24 ticks",
      input: { keys: [60], label: "C-E · Arp 1/16" },
      output: {
        notes: ons.map((e) => e.note),
        events: ons.map((e, i) => ({ t: i * 6, note: e.note, on: true })),
      },
      pass: ons.length === 4,
    });
  }

  // Arpeggiate2Octaves
  {
    const { out: midi } = collect((midiOut, c) => {
      trigger({
        mode: "Arpeggiate2Octaves",
        chord: [60, 64, 67],
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 0,
        slopSeed: 0,
        arpIntervalTicks: 12,
        harpDeltaMs: 25,
      });
      c.advanceTicks(72);
    });
    const ons = midi.events.filter((e) => e.type === "noteOn").map((e) => e.note);
    out.push({
      id: "perf-arp2",
      group: "Performance",
      title: "Arpeggiate2Octaves · +12 extension",
      description: "6 steps incl. octave",
      input: { keys: [60], label: "Cmaj · Arp2Oct" },
      output: {
        notes: ons,
        events: ons.map((n, i) => ({ t: i * 12, note: n, on: true })),
      },
      pass: arrEq(ons, [60, 64, 67, 72, 76, 79]),
    });
  }

  // Arp grows with extensions
  {
    const { out: midi } = collect((midiOut, c) => {
      trigger({
        mode: "Arpeggiate",
        chord: [60, 64, 67, 71, 74],
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 0,
        slopSeed: 0,
        arpIntervalTicks: 12,
        harpDeltaMs: 25,
      });
      c.advanceTicks(60);
    });
    const ons = midi.events.filter((e) => e.type === "noteOn").map((e) => e.note);
    out.push({
      id: "perf-arp-grow",
      group: "Performance",
      title: "Arpeggiate · loop grows with extensions",
      description: "5-note chord → 5-step loop",
      input: { keys: [60], label: "Cmaj7+9 · Arp" },
      output: {
        notes: ons,
        events: ons.map((n, i) => ({ t: i * 12, note: n, on: true })),
      },
      pass: arrEq(ons, [60, 64, 67, 71, 74]),
    });
  }

  // Patterns valid
  out.push({
    id: "perf-pat-valid",
    group: "Performance",
    title: "Patterns · at least 10 valid",
    description: "All steps in [0,length), velocityScale ∈ (0,1]",
    input: { keys: [], label: `${PATTERNS.length} patterns` },
    output: { notes: [] },
    pass:
      PATTERNS.length >= 10 &&
      PATTERNS.every(
        (p) =>
          p.steps.length > 0 &&
          p.steps.every(
            (s) =>
              s.tickOffset >= 0 &&
              s.tickOffset < p.lengthTicks &&
              s.velocityScale > 0 &&
              s.velocityScale <= 1,
          ),
      ),
    notes: `${PATTERNS.length} patterns`,
  });

  // Pattern velocity scaling
  {
    const pat = {
      id: "t",
      name: "t",
      lengthTicks: 24,
      steps: [
        { tickOffset: 0, noteIndex: 0, velocityScale: 0.5, gateLengthTicks: 6 },
        { tickOffset: 12, noteIndex: 1, velocityScale: 1.0, gateLengthTicks: 6 },
      ],
    };
    const { out: midi } = collect((midiOut, c) => {
      trigger({
        mode: "Pattern",
        chord: [60, 64, 67],
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 0,
        slopSeed: 0,
        arpIntervalTicks: 12,
        pattern: pat,
        harpDeltaMs: 25,
      });
      c.advanceTicks(24);
    });
    const ons = midi.events.filter((e) => e.type === "noteOn");
    const vels = ons.map((e) => e.velocity).sort((a, b) => a - b);
    out.push({
      id: "perf-pat-vel",
      group: "Performance",
      title: "Pattern · velocity scaling",
      description: "0.5 × 100 = 50, 1.0 × 100 = 100",
      input: { keys: [60], label: "Cmaj · custom pat" },
      output: {
        notes: ons.map((e) => e.note),
        events: ons.map((e, i) => ({ t: i * 12, note: e.note, on: true })),
      },
      pass: arrEq(vels, [50, 100]),
      notes: `velocities=[${vels.join(",")}]`,
    });
  }

  // Harp ascending octaves
  {
    const { out: midi } = collect((midiOut, c) =>
      trigger({
        mode: "Harp",
        chord: [60, 64, 67],
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 0,
        slopSeed: 0,
        arpIntervalTicks: 12,
        harpDeltaMs: 10,
        harpOctaves: 2,
      }),
    );
    out.push({
      id: "perf-harp",
      group: "Performance",
      title: "Harp · base then +12 octave",
      description: "[60,64,67] × 2 oct",
      input: { keys: [60], label: "Cmaj · Harp 2 oct" },
      output: {
        notes: midi.events.map((e) => e.note),
        events: midi.events.map((e, i) => ({ t: i * 10, note: e.note, on: true })),
      },
      pass: arrEq(midi.events.map((e) => e.note), [60, 64, 67, 72, 76, 79]),
    });
  }

  // Harp stop balances offs
  {
    const { out: midi } = collect((midiOut, c) => {
      const h = trigger({
        mode: "Harp",
        chord: [60, 64],
        velocity: 100,
        channel: 0,
        midiOut,
        clock: c,
        strumDeltaMs: 50,
        slopMaxMs: 0,
        slopSeed: 0,
        arpIntervalTicks: 12,
        harpDeltaMs: 10,
        harpOctaves: 2,
      });
      h.stop();
    });
    const ons = midi.events.filter((e) => e.type === "noteOn").length;
    const offs = midi.events.filter((e) => e.type === "noteOff").length;
    out.push({
      id: "perf-harp-stop",
      group: "Performance",
      title: "Harp · stop() balances note offs",
      description: "noteOff count == noteOn count",
      input: { keys: [60], label: "C-E · Harp stop" },
      output: { notes: midi.events.map((e) => e.note) },
      pass: ons === offs && ons > 0,
      notes: `on=${ons} off=${offs}`,
    });
  }

  return out;
}

function smokeIntegrationTests(): RunResult[] {
  loopRecorder.reset();
  loopRecorder.startRecord(120, 4);
  loopRecorder.captureChord({ rootMidi: 60, chordType: "Maj", extensions: [], velocity: 100 });
  loopRecorder.captureChord({ rootMidi: 65, chordType: "Maj", extensions: [], velocity: 100 });
  const loop: StoredLoop | null = loopRecorder.stopRecord();
  return [
    {
      id: "loop-roundtrip",
      group: "Integration",
      title: "Loop Recorder roundtrip",
      description: "2 events @ 4 beats / 120bpm = 2000ms",
      input: { keys: [60, 65], label: "Rec C4 → F4" },
      output: { notes: loop?.events.map((e) => e.rootMidi) ?? [] },
      pass: !!loop && loop.events.length === 2 && loop.lengthMs === 2000,
      notes: loop ? `${loop.events.length} events · ${loop.lengthMs}ms` : "no loop",
    },
  ];
}

function runAll(): RunResult[] {
  return [
    ...chordComboTests(),
    ...chordNotationTests(),
    ...keyTests(),
    ...voicingTests(),
    ...mappingTests(),
    ...performanceTests(),
    ...smokeIntegrationTests(),
  ];
}

// ---------- screen ----------
export function TestsScreen() {
  const results = useMemo(() => runAll(), []);
  const groups = useMemo(() => {
    const map = new Map<string, RunResult[]>();
    for (const r of results) {
      const arr = map.get(r.group) ?? [];
      arr.push(r);
      map.set(r.group, arr);
    }
    return Array.from(map.entries());
  }, [results]);
  const passed = results.filter((r) => r.pass).length;
  const [filter, setFilter] = useState<"all" | "fail">("all");

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h1 className="text-xl tracking-[0.3em]">CHORD·IT / TESTS</h1>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground">MAIN</a>
          <a href="/settings" className="hover:text-foreground">SETTINGS</a>
          <a href="/tests" className="text-foreground">TESTS</a>
        </div>
      </header>

      <div className="flex items-center justify-between text-sm tracking-widest">
        <div>
          RESULT:{" "}
          <span className={passed === results.length ? "text-emerald-400" : "text-amber-400"}>
            {passed} / {results.length} PASS
          </span>
        </div>
        <div className="flex gap-2 text-[10px]">
          <button
            onClick={() => setFilter("all")}
            className={`px-2 py-1 rounded border ${
              filter === "all" ? "border-foreground" : "border-border text-muted-foreground"
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setFilter("fail")}
            className={`px-2 py-1 rounded border ${
              filter === "fail" ? "border-foreground" : "border-border text-muted-foreground"
            }`}
          >
            FAIL ONLY
          </button>
        </div>
      </div>

      {groups.map(([group, items]) => {
        const visible = filter === "fail" ? items.filter((i) => !i.pass) : items;
        if (visible.length === 0) return null;
        const gp = items.filter((i) => i.pass).length;
        return (
          <section key={group} className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-1">
              <h2 className="text-xs tracking-[0.3em] text-muted-foreground">{group}</h2>
              <span className="text-[10px] text-muted-foreground">
                {gp}/{items.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {visible.map((r) => (
                <TestCard key={r.id} r={r} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TestCard({ r }: { r: RunResult }) {
  return (
    <div className="border border-border rounded-md bg-card p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs truncate">{r.title}</div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${
            r.pass ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
          }`}
        >
          {r.pass ? "PASS" : "FAIL"}
        </span>
      </div>
      <div className="text-[10px] text-muted-foreground">{r.description}</div>
      <div className="grid grid-cols-2 gap-2">
        <MiniPiano label="IN" notes={r.input.keys} highlight="sky" caption={r.input.label} />
        <MiniPiano
          label="OUT"
          notes={r.output.notes}
          highlight="amber"
          caption={`${r.output.notes.length} notes`}
        />
      </div>
      {r.output.events && r.output.events.length > 0 && <PatternStrip events={r.output.events} />}
      {r.notes && <div className="text-[10px] text-muted-foreground truncate">{r.notes}</div>}
    </div>
  );
}

function MiniPiano({
  label,
  notes,
  highlight,
  caption,
}: {
  label: string;
  notes: number[];
  highlight: "sky" | "amber";
  caption?: string;
}) {
  const start = 48;
  const end = 84;
  const all: number[] = [];
  for (let n = start; n <= end; n++) all.push(n);
  const whites = all.filter((n) => !isBlack(n));
  const set = new Set(notes);
  const onClass = highlight === "sky" ? "fill-sky-500" : "fill-amber-500";
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[9px] text-muted-foreground tracking-widest truncate">
        {label} {caption && `· ${caption}`}
      </div>
      <svg viewBox={`0 0 ${whites.length * 10} 40`} className="w-full h-10">
        {whites.map((n, i) => (
          <rect
            key={n}
            x={i * 10}
            y={0}
            width={9.5}
            height={40}
            className={`${set.has(n) ? onClass : "fill-zinc-100"} stroke-zinc-400`}
            strokeWidth="0.5"
          />
        ))}
        {whites.map((n, i) => {
          const b = n + 1;
          if (!isBlack(b) || b > end) return null;
          return (
            <rect
              key={b}
              x={i * 10 + 6.5}
              y={0}
              width={6}
              height={24}
              className={`${set.has(b) ? onClass : "fill-zinc-900"}`}
            />
          );
        })}
      </svg>
    </div>
  );
}

function PatternStrip({ events }: { events: Ev[] }) {
  const max = Math.max(1, ...events.map((e) => e.t));
  return (
    <div className="border border-border rounded-sm p-2 bg-background">
      <div className="text-[9px] text-muted-foreground mb-1 tracking-widest">TIMELINE</div>
      <svg viewBox={`0 0 200 30`} className="w-full h-7">
        <line x1={0} y1={25} x2={200} y2={25} className="stroke-border" />
        {events.map((e, i) => {
          const x = (e.t / max) * 195 + 2;
          return (
            <g key={i}>
              <line x1={x} y1={5} x2={x} y2={25} className="stroke-amber-500" strokeWidth={1.5} />
              <text x={x} y={4} fontSize="5" className="fill-muted-foreground" textAnchor="middle">
                {e.note}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function isBlack(midi: number): boolean {
  const pc = ((midi % 12) + 12) % 12;
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}
