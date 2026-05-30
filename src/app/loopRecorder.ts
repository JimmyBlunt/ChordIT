import type { ChordExtension, ChordType } from "../chord/chordTypes";

export type ChordEvent = {
  /** ms relative to loop start */
  t: number;
  rootMidi: number;
  chordType: ChordType;
  extensions: ChordExtension[];
  velocity: number;
};

export type StoredLoop = {
  bpm: number;
  /** total loop length in ms */
  lengthMs: number;
  /** beats (4..16) */
  lengthBeats: number;
  events: ChordEvent[];
};

type Trigger = (e: ChordEvent) => void;

class LoopRecorder {
  private recording = false;
  private startedAt = 0;
  private buffer: ChordEvent[] = [];
  private loop: StoredLoop | null = null;
  private playing = false;
  private timers: number[] = [];
  private rafId: number | null = null;

  isRecording() {
    return this.recording;
  }

  isPlaying() {
    return this.playing;
  }

  getLoop(): StoredLoop | null {
    return this.loop;
  }

  startRecord(bpm: number, lengthBeats: number) {
    this.stopPlay();
    this.recording = true;
    this.startedAt = performance.now();
    this.buffer = [];
    const beatMs = 60000 / bpm;
    this.loop = {
      bpm,
      lengthBeats,
      lengthMs: beatMs * lengthBeats,
      events: [],
    };
  }

  captureChord(e: Omit<ChordEvent, "t">) {
    if (!this.recording) return;
    const t = performance.now() - this.startedAt;
    this.buffer.push({ ...e, t });
  }

  stopRecord(): StoredLoop | null {
    if (!this.recording) return this.loop;
    this.recording = false;
    if (!this.loop) return null;
    // Quantize length to recorded duration if user stopped early & lengthMs is 0.
    this.loop.events = [...this.buffer];
    return this.loop;
  }

  startPlay(trigger: Trigger, loop?: StoredLoop) {
    const L = loop ?? this.loop;
    if (!L || L.events.length === 0) return;
    this.stopPlay();
    this.playing = true;
    const cycle = () => {
      if (!this.playing) return;
      const start = performance.now();
      L.events.forEach((ev) => {
        const id = window.setTimeout(() => trigger(ev), Math.max(0, ev.t));
        this.timers.push(id);
      });
      const id = window.setTimeout(() => {
        // Clear and re-schedule for next cycle
        this.timers = this.timers.filter((t) => t !== id);
        cycle();
      }, L.lengthMs);
      this.timers.push(id);
      void start;
    };
    cycle();
  }

  stopPlay() {
    this.playing = false;
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  reset() {
    this.stopPlay();
    this.recording = false;
    this.buffer = [];
    this.loop = null;
  }
}

export const loopRecorder = new LoopRecorder();
