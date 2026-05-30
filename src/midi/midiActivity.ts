/**
 * Tiny pub/sub for live MIDI note activity, used by the UI to highlight
 * piano keys for incoming (IN) and outgoing (OUT) notes. Decoupled from
 * the engine so tests don't depend on it.
 */
type Dir = "in" | "out";
type Listener = (active: { in: Set<number>; out: Set<number> }) => void;

const state = {
  in: new Set<number>(),
  out: new Set<number>(),
};
const listeners = new Set<Listener>();

function emit() {
  const snap = { in: new Set(state.in), out: new Set(state.out) };
  listeners.forEach((l) => l(snap));
}

export const midiActivity = {
  noteOn(dir: Dir, note: number) {
    state[dir].add(note);
    emit();
  },
  noteOff(dir: Dir, note: number) {
    state[dir].delete(note);
    emit();
  },
  clear(dir?: Dir) {
    if (!dir) {
      state.in.clear();
      state.out.clear();
    } else {
      state[dir].clear();
    }
    emit();
  },
  subscribe(cb: Listener) {
    listeners.add(cb);
    cb({ in: new Set(state.in), out: new Set(state.out) });
    return () => listeners.delete(cb);
  },
};
