import type { PerformanceMode } from "../chord/chordTypes";
import { MockClock } from "./mockClock";
import { PATTERNS, type Pattern } from "./patterns";
import { createRng } from "./rng";
import type { MidiOut, NoteEvent } from "../midi/midiTypes";

export type PerformanceContext = {
  mode: PerformanceMode;
  chord: number[];
  velocity: number;
  channel: number;
  midiOut: MidiOut;
  clock: MockClock;
  // Strum/Slop: ms between notes
  strumDeltaMs: number;
  // Slop: max jitter ms +/-
  slopMaxMs: number;
  slopSeed: number;
  // Arp interval in ticks
  arpIntervalTicks: number; // 12 = 1/8, 6 = 1/16 at 24 ppqn
  // Pattern
  pattern?: Pattern;
  // Harp speed in ms
  harpDeltaMs: number;
  // For Harp: how many octave layers
  harpOctaves?: number;
};

export type PerformanceHandle = {
  stop: () => void;
};

/**
 * Trigger a performance. Returns a handle to stop (Note Off all generated notes).
 * Strum/Slop/Harp use clock.advanceMs internally for deterministic scheduling.
 * Arpeggiate/Pattern subscribe to clock ticks.
 */
export function trigger(ctx: PerformanceContext): PerformanceHandle {
  const active = new Set<number>();
  const noteOn = (n: number, vel: number) => {
    const v = clamp(vel, 1, 127);
    active.add(n);
    ctx.midiOut.send({ type: "noteOn", note: n, velocity: v, channel: ctx.channel });
  };
  const noteOff = (n: number) => {
    if (!active.has(n)) return;
    active.delete(n);
    ctx.midiOut.send({ type: "noteOff", note: n, velocity: 0, channel: ctx.channel });
  };
  const stopAll = () => {
    for (const n of [...active]) noteOff(n);
    if (unsub) unsub();
  };

  let unsub: (() => void) | null = null;

  switch (ctx.mode) {
    case "Off":
      for (const n of ctx.chord) noteOn(n, ctx.velocity);
      break;

    case "Strum":
      strum(ctx.chord, ctx, noteOn);
      break;

    case "Strum2Octaves": {
      const seq = [...ctx.chord, ...ctx.chord.map((n) => n + 12)];
      strum(seq, ctx, noteOn);
      break;
    }

    case "Slop": {
      const rng = createRng(ctx.slopSeed);
      const sorted = [...ctx.chord].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length; i++) {
        if (i > 0) {
          const jitter = (rng() * 2 - 1) * ctx.slopMaxMs;
          ctx.clock.advanceMs(ctx.strumDeltaMs + jitter);
        }
        noteOn(sorted[i], ctx.velocity);
      }
      break;
    }

    case "Arpeggiate": {
      unsub = startArp(ctx.chord, ctx, noteOn, noteOff);
      break;
    }

    case "Arpeggiate2Octaves": {
      const seq = [...ctx.chord, ...ctx.chord.map((n) => n + 12)];
      unsub = startArp(seq, ctx, noteOn, noteOff);
      break;
    }

    case "Pattern": {
      unsub = startPattern(ctx, noteOn, noteOff);
      break;
    }

    case "Harp": {
      const layers = ctx.harpOctaves ?? 3;
      const sorted = [...ctx.chord].sort((a, b) => a - b);
      const seq: number[] = [];
      for (let o = 0; o < layers; o++) {
        for (const n of sorted) seq.push(n + o * 12);
      }
      for (let i = 0; i < seq.length; i++) {
        if (i > 0) ctx.clock.advanceMs(ctx.harpDeltaMs);
        noteOn(seq[i], ctx.velocity);
      }
      break;
    }
  }

  return { stop: stopAll };
}

function strum(
  seq: number[],
  ctx: PerformanceContext,
  noteOn: (n: number, v: number) => void,
) {
  const sorted = [...seq].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) ctx.clock.advanceMs(ctx.strumDeltaMs);
    noteOn(sorted[i], ctx.velocity);
  }
}

function startArp(
  notes: number[],
  ctx: PerformanceContext,
  noteOn: (n: number, v: number) => void,
  noteOff: (n: number) => void,
): () => void {
  if (notes.length === 0) return () => {};
  let idx = 0;
  let lastNote: number | null = null;
  const unsub = ctx.clock.onTick((t) => {
    if (t.tick % ctx.arpIntervalTicks !== 0) return;
    if (lastNote !== null) noteOff(lastNote);
    const n = notes[idx % notes.length];
    noteOn(n, ctx.velocity);
    lastNote = n;
    idx += 1;
  });
  return () => {
    unsub();
    if (lastNote !== null) noteOff(lastNote);
  };
}

function startPattern(
  ctx: PerformanceContext,
  noteOn: (n: number, v: number) => void,
  noteOff: (n: number) => void,
): () => void {
  const pat = ctx.pattern ?? PATTERNS[0];
  const offSchedule = new Map<number, number[]>(); // absolute tick -> notes to off
  const startTick = ctx.clock.currentTick;
  const unsub = ctx.clock.onTick((t) => {
    const rel = (t.tick - startTick) % pat.lengthTicks;
    for (const step of pat.steps) {
      if (step.tickOffset === rel) {
        const note = ctx.chord[step.noteIndex % ctx.chord.length];
        const vel = Math.max(1, Math.round(ctx.velocity * step.velocityScale));
        noteOn(note, vel);
        const offAt = t.tick + step.gateLengthTicks;
        const arr = offSchedule.get(offAt) ?? [];
        arr.push(note);
        offSchedule.set(offAt, arr);
      }
    }
    const offs = offSchedule.get(t.tick);
    if (offs) {
      for (const n of offs) noteOff(n);
      offSchedule.delete(t.tick);
    }
  });
  return () => {
    unsub();
    for (const [, notes] of offSchedule) for (const n of notes) noteOff(n);
    offSchedule.clear();
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export { NoteEvent };
