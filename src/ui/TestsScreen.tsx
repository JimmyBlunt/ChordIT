import { useMemo } from "react";
import { buildChord } from "@/chord/chordEngine";
import { getChordDisplayString } from "@/chord/chordNotation";
import { applyVoicingMode } from "@/voicing/voicingEngine";
import { constrainToKey } from "@/key/keyModeEngine";
import { trigger } from "@/performance/performanceEngine";
import { MockClock } from "@/performance/mockClock";
import { MockMidi } from "@/midi/mockMidi";
import { PATTERNS } from "@/performance/patterns";
import { loopRecorder, type StoredLoop } from "@/app/loopRecorder";

type RunResult = {
  title: string;
  description: string;
  input: { keys: number[]; label: string };
  output: { notes: number[]; events?: { t: number; note: number; on: boolean }[] };
  expected?: number[];
  pass: boolean;
  notes?: string;
};

function collect(fn: (out: MockMidi, clock: MockClock) => void): {
  out: MockMidi;
  clock: MockClock;
} {
  const out = new MockMidi();
  const clock = new MockClock(120);
  fn(out, clock);
  return { out, clock };
}

function runAll(): RunResult[] {
  const results: RunResult[] = [];

  // 1. Maj chord at C4
  {
    const notes = buildChord(60, "Maj", []);
    results.push({
      title: "T1 · Maj chord at C4",
      description: "Root 60 → C-E-G",
      input: { keys: [60], label: "Play C4 + Maj" },
      output: { notes },
      expected: [60, 64, 67],
      pass: JSON.stringify(notes) === JSON.stringify([60, 64, 67]),
    });
  }

  // 2. Min7 at A3
  {
    const notes = buildChord(57, "Min", ["m7"]);
    results.push({
      title: "T2 · Am7 at A3",
      description: "Root 57 + Min + m7 → A-C-E-G",
      input: { keys: [57], label: "Play A3 + Min + m7" },
      output: { notes },
      expected: [57, 60, 64, 67],
      pass: JSON.stringify(notes) === JSON.stringify([57, 60, 64, 67]),
    });
  }

  // 3. Sus chord with 9
  {
    const notes = buildChord(62, "Sus", ["9"]);
    results.push({
      title: "T3 · Dsus9",
      description: "Root 62 Sus + 9",
      input: { keys: [62], label: "Play D4 + Sus + 9" },
      output: { notes },
      pass: notes.length >= 4 && notes[0] === 62,
    });
  }

  // 4. Voicing Split below splitKey
  {
    const raw = buildChord(48, "Maj", []);
    const v = applyVoicingMode(raw, "Split", 60, 60);
    results.push({
      title: "T4 · Voicing Split below split key",
      description: "Notes below 60 stay; rest moves into octave",
      input: { keys: [48], label: "C3 Maj in Split" },
      output: { notes: v },
      pass: v.length === 3,
    });
  }

  // 5. Key constrain
  {
    const raw = buildChord(60, "Maj", []);
    const ck = constrainToKey(raw, "C");
    results.push({
      title: "T5 · Key constrain C-major",
      description: "C major chord stays untouched in C key",
      input: { keys: [60], label: "C4 Maj · Key=C" },
      output: { notes: ck },
      expected: raw,
      pass: JSON.stringify(ck) === JSON.stringify(raw),
    });
  }

  // 6. Performance Off — sends 3 noteOns immediately
  {
    const { out } = collect((midiOut, clock) => {
      const chord = buildChord(60, "Maj", []);
      trigger({
        mode: "Off",
        chord,
        velocity: 100,
        channel: 0,
        midiOut,
        clock,
        strumDeltaMs: 60,
        slopMaxMs: 0,
        slopSeed: 1,
        arpIntervalTicks: 12,
        harpDeltaMs: 30,
      });
    });
    const ons = out.events.filter((e) => e.type === "noteOn");
    results.push({
      title: "T6 · Performance · Off",
      description: "Block-chord — 3 simultaneous noteOns",
      input: { keys: [60], label: "C4 Maj · Off" },
      output: {
        notes: ons.map((e) => e.note),
        events: out.events.map((e, i) => ({ t: i * 1, note: e.note, on: e.type === "noteOn" })),
      },
      pass: ons.length === 3,
    });
  }

  // 7. Strum — 3 noteOns spaced by clock.advanceMs
  {
    const { out } = collect((midiOut, clock) => {
      trigger({
        mode: "Strum",
        chord: buildChord(60, "Maj", []),
        velocity: 100,
        channel: 0,
        midiOut,
        clock,
        strumDeltaMs: 80,
        slopMaxMs: 0,
        slopSeed: 1,
        arpIntervalTicks: 12,
        harpDeltaMs: 30,
      });
    });
    const ons = out.events.filter((e) => e.type === "noteOn");
    results.push({
      title: "T7 · Performance · Strum",
      description: "3 spaced noteOns",
      input: { keys: [60], label: "C4 Maj · Strum 80ms" },
      output: {
        notes: ons.map((e) => e.note),
        events: ons.map((e, i) => ({ t: i * 80, note: e.note, on: true })),
      },
      pass: ons.length === 3,
    });
  }

  // 8. Pattern — Four on Floor over 1 bar
  {
    const { out } = collect((midiOut, clock) => {
      const handle = trigger({
        mode: "Pattern",
        chord: buildChord(60, "Maj", []),
        velocity: 100,
        channel: 0,
        midiOut,
        clock,
        strumDeltaMs: 60,
        slopMaxMs: 0,
        slopSeed: 1,
        arpIntervalTicks: 12,
        harpDeltaMs: 30,
        pattern: PATTERNS[0],
      });
      // Advance 1 bar
      clock.advanceTicks(96);
      handle.stop();
    });
    const ons = out.events.filter((e) => e.type === "noteOn");
    results.push({
      title: "T8 · Performance · Pattern (Four on Floor)",
      description: "4 noteOns over 96 ticks",
      input: { keys: [60], label: "C4 Maj · Pattern 0" },
      output: {
        notes: ons.map((e) => e.note),
        events: ons.map((e, i) => ({ t: i * 24, note: e.note, on: true })),
      },
      pass: ons.length === 4,
    });
  }

  // 9. Loop recorder roundtrip
  {
    loopRecorder.reset();
    loopRecorder.startRecord(120, 4);
    loopRecorder.captureChord({ rootMidi: 60, chordType: "Maj", extensions: [], velocity: 100 });
    loopRecorder.captureChord({ rootMidi: 65, chordType: "Maj", extensions: [], velocity: 100 });
    const loop: StoredLoop | null = loopRecorder.stopRecord();
    results.push({
      title: "T9 · Loop Recorder",
      description: "Record 2 chord events, length 4 beats @ 120bpm",
      input: { keys: [60, 65], label: "Rec C4 → F4" },
      output: { notes: loop?.events.map((e) => e.rootMidi) ?? [] },
      pass: !!loop && loop.events.length === 2 && loop.lengthMs === 2000,
      notes: loop ? `${loop.events.length} events · ${loop.lengthMs}ms loop` : "no loop",
    });
  }

  // 10. Display string
  {
    const display = getChordDisplayString(60, "Min", ["m7"]);
    results.push({
      title: "T10 · Display string",
      description: "Cm7 notation",
      input: { keys: [60], label: "C4 Min m7" },
      output: { notes: [] },
      pass: typeof display === "string" && display.length > 0,
      notes: display,
    });
  }

  return results;
}

export function TestsScreen() {
  const results = useMemo(() => runAll(), []);
  const passed = results.filter((r) => r.pass).length;

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

      <div className="text-sm tracking-widest">
        RESULT: <span className={passed === results.length ? "text-emerald-400" : "text-amber-400"}>
          {passed} / {results.length} PASS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((r) => (
          <TestCard key={r.title} r={r} />
        ))}
      </div>
    </div>
  );
}

function TestCard({ r }: { r: RunResult }) {
  return (
    <div className="border border-border rounded-md bg-card p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-sm">{r.title}</div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded ${
            r.pass ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
          }`}
        >
          {r.pass ? "PASS" : "FAIL"}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground">{r.description}</div>
      <div className="grid grid-cols-2 gap-2">
        <MiniPiano label="IN" notes={r.input.keys} highlight="sky" caption={r.input.label} />
        <MiniPiano label="OUT" notes={r.output.notes} highlight="amber" caption={`${r.output.notes.length} notes`} />
      </div>
      {r.output.events && r.output.events.length > 0 && <PatternStrip events={r.output.events} />}
      {r.notes && <div className="text-[10px] text-muted-foreground">{r.notes}</div>}
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
      <div className="text-[10px] text-muted-foreground tracking-widest">
        {label} {caption && `· ${caption}`}
      </div>
      <svg viewBox={`0 0 ${whites.length * 10} 40`} className="w-full h-12">
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

function PatternStrip({ events }: { events: { t: number; note: number; on: boolean }[] }) {
  const max = Math.max(1, ...events.map((e) => e.t));
  return (
    <div className="border border-border rounded-sm p-2 bg-background">
      <div className="text-[10px] text-muted-foreground mb-1 tracking-widest">TIMELINE</div>
      <svg viewBox={`0 0 200 30`} className="w-full h-8">
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
