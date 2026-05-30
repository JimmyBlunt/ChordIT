export type ClockTick = {
  tick: number; // monotonic tick count
  timeMs: number; // virtual time in ms since clock start
};

export interface Clock {
  bpm: number;
  readonly ppqn: number;
  start(): void;
  stop(): void;
  onTick(cb: (t: ClockTick) => void): () => void; // returns unsubscribe
}

export const DEFAULT_PPQN = 24;

/** ms per tick for a given bpm and ppqn. */
export function msPerTick(bpm: number, ppqn = DEFAULT_PPQN): number {
  return 60000 / (bpm * ppqn);
}
