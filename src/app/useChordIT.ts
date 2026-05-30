import { useCallback, useEffect, useRef } from "react";
import { useChorditStore } from "./store";
import { buildChord } from "../chord/chordEngine";
import { getChordDisplayString } from "../chord/chordNotation";
import { applyVoicingMode, voiceDown, voiceUp } from "../voicing/voicingEngine";
import { constrainToKey } from "../key/keyModeEngine";
import { MockMidi } from "../midi/mockMidi";
import { trigger, type PerformanceHandle } from "../performance/performanceEngine";
import { MockClock } from "../performance/mockClock";
import { PATTERNS } from "../performance/patterns";
import type { ChordExtension } from "../chord/chordTypes";

/**
 * App-side wiring: holds a singleton MockMidi + MockClock for the live UI,
 * and exposes play/stop helpers that drive the engine. Real Web MIDI output
 * can be layered on top by piping MockMidi.send → real MidiOut.
 */
export function useChordIT() {
  const store = useChorditStore();
  const midiRef = useRef<MockMidi | null>(null);
  const clockRef = useRef<MockClock | null>(null);
  const activeRef = useRef<{ handle: PerformanceHandle; notes: number[] } | null>(null);

  if (!midiRef.current) midiRef.current = new MockMidi();
  if (!clockRef.current) {
    clockRef.current = new MockClock(store.performanceParams.bpm);
    clockRef.current.start();
  }

  // Drive the mock clock in real time so arp/pattern modes work in the live UI.
  useEffect(() => {
    if (!clockRef.current) return;
    clockRef.current.bpm = store.performanceParams.bpm;
    const ms = 60000 / (store.performanceParams.bpm * 24);
    const id = window.setInterval(() => {
      clockRef.current?.advanceTicks(1);
    }, ms);
    return () => window.clearInterval(id);
  }, [store.performanceParams.bpm]);

  const playRoot = useCallback(
    (rootMidi: number, velocity = 100) => {
      const {
        selectedChordType,
        activeExtensions,
        voicingMode,
        splitKey,
        octaveBase,
        keyModeEnabled,
        selectedKey,
        performanceMode,
        performanceParams,
      } = useChorditStore.getState();

      let notes = buildChord(rootMidi, selectedChordType, activeExtensions);
      notes = applyVoicingMode(notes, voicingMode, splitKey, octaveBase);
      if (keyModeEnabled) notes = constrainToKey(notes, selectedKey);

      const display = getChordDisplayString(
        rootMidi,
        selectedChordType,
        activeExtensions,
      );
      useChorditStore.getState().setRootNote(rootMidi);
      useChorditStore.getState().setChord(notes, display);

      // Stop previous performance.
      if (activeRef.current) activeRef.current.handle.stop();

      const handle = trigger({
        mode: performanceMode,
        chord: notes,
        velocity,
        channel: 0,
        midiOut: midiRef.current!,
        clock: clockRef.current!,
        strumDeltaMs: performanceParams.strumDeltaMs,
        slopMaxMs: performanceParams.slopMaxMs,
        slopSeed: Date.now() & 0xffff,
        arpIntervalTicks: performanceParams.arpIntervalTicks,
        pattern: PATTERNS[performanceParams.patternIndex] ?? PATTERNS[0],
        harpDeltaMs: performanceParams.harpDeltaMs,
        harpOctaves: performanceParams.harpOctaves,
      });
      activeRef.current = { handle, notes };
    },
    [],
  );

  const releaseRoot = useCallback((_rootMidi: number) => {
    if (activeRef.current) {
      activeRef.current.handle.stop();
      activeRef.current = null;
    }
  }, []);

  const voicingShift = useCallback((delta: 1 | -1) => {
    const s = useChorditStore.getState();
    if (s.currentChordNotes.length === 0) return;
    const next = delta > 0 ? voiceUp(s.currentChordNotes) : voiceDown(s.currentChordNotes);
    s.setChord(next, s.currentDisplayString);
  }, []);

  const toggleExt = useCallback((e: ChordExtension) => {
    useChorditStore.getState().toggleExtension(e);
  }, []);

  return { playRoot, releaseRoot, voicingShift, toggleExt, midi: midiRef.current!, clock: clockRef.current! };
}
