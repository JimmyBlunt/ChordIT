import { DEFAULT_PPQN, msPerTick, type Clock, type ClockTick } from "./clock";

/**
 * Deterministic clock used by tests. Time only advances when
 * advanceTicks / advanceMs are called.
 */
export class MockClock implements Clock {
  bpm: number;
  readonly ppqn: number;
  private running = false;
  private tick = 0;
  private timeMs = 0;
  private listeners: Array<(t: ClockTick) => void> = [];

  constructor(bpm = 120, ppqn = DEFAULT_PPQN) {
    this.bpm = bpm;
    this.ppqn = ppqn;
  }

  start() {
    this.running = true;
  }
  stop() {
    this.running = false;
  }

  onTick(cb: (t: ClockTick) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  advanceTicks(n: number) {
    if (!this.running) return;
    const dt = msPerTick(this.bpm, this.ppqn);
    for (let i = 0; i < n; i++) {
      this.tick += 1;
      this.timeMs += dt;
      const snap = { tick: this.tick, timeMs: this.timeMs };
      for (const l of this.listeners) l(snap);
    }
  }

  advanceMs(ms: number) {
    const dt = msPerTick(this.bpm, this.ppqn);
    const ticks = Math.round(ms / dt);
    this.advanceTicks(ticks);
    // Keep wall-clock time precise even when tick count rounds.
    const drift = ms - ticks * dt;
    this.timeMs += drift;
  }

  get currentTick() {
    return this.tick;
  }
  get currentTime() {
    return this.timeMs;
  }
}
