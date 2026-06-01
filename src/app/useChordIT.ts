import { useCallback, useEffect, useRef } from "react";
import { useChorditStore } from "./store";
import { buildChord } from "../chord/chordEngine";
import { getChordDisplayString } from "../chord/chordNotation";
import { applyVoicingMode, voiceDown, voiceUp } from "../voicing/voicingEngine";
import { constrainToKey } from "../key/keyModeEngine";
import { MockMidi } from "../midi/mockMidi";
import { midiBridge } from "../midi/midiBridge";
import { midiManager } from "../midi/midiManager";
import {
  findMatchingControl,
  startMappingDispatcher,
} from "../midi/mappingDispatcher";
import type { MidiOut, NoteEvent } from "../midi/midiTypes";
import { trigger, type PerformanceHandle } from "../performance/performanceEngine";
import { MockClock } from "../performance/mockClock";
import { PATTERNS } from "../performance/patterns";
import type { ChordExtension } from "../chord/chordTypes";

let sharedMidi: MockMidi | null = null;
let sharedClock: MockClock | null = null;
let sharedFanout: MidiOut | null = null;
let sharedActive:
  | { handle: PerformanceHandle; notes: number[]; rootMidi: number }
  | null = null;
// Track which root notes are currently held down so legato/overlap doesn't
// cut off a still-held chord when an earlier key is released.
const heldRoots = new Set<number>();
let clockUsers = 0;
let clockInterval: number | null = null;
let clockIntervalMs = 0;
let hardwareUsers = 0;
let hardwareUnsub: (() => void) | null = null;

function getSharedEngine(bpm: number) {
  if (!sharedMidi) sharedMidi = new MockMidi();
  if (!sharedFanout) {
    sharedFanout = {
      send(event: NoteEvent) {
        sharedMidi?.send(event);
        midiBridge.send(event);
      },
    };
  }
  if (!sharedClock) {
    sharedClock = new MockClock(bpm);
    sharedClock.start();
  }
  return { midi: sharedMidi, clock: sharedClock, fanout: sharedFanout };
}

/**
 * App-side wiring: holds a singleton MockMidi + MockClock for the live UI,
 * and exposes play/stop helpers that drive the engine. Real Web MIDI output
 * can be layered on top by piping MockMidi.send → real MidiOut.
 */
export function useChordIT(options: { hardwareInput?: boolean } = {}) {
  const store = useChorditStore();
  const engineRef = useRef(getSharedEngine(store.performanceParams.bpm));

  useEffect(() => {
    void useChorditStore.persist.rehydrate();
  }, []);

  // Drive the mock clock in real time so arp/pattern modes work in the live UI.
  useEffect(() => {
    const engine = getSharedEngine(store.performanceParams.bpm);
    engine.clock.bpm = store.performanceParams.bpm;
    const ms = 60000 / (store.performanceParams.bpm * 24);
    clockUsers += 1;
    if (!clockInterval || clockIntervalMs !== ms) {
      if (clockInterval) window.clearInterval(clockInterval);
      clockIntervalMs = ms;
      clockInterval = window.setInterval(() => {
        sharedClock?.advanceTicks(1);
      }, ms);
    }
    return () => {
      clockUsers = Math.max(0, clockUsers - 1);
      if (clockUsers === 0 && clockInterval) {
        window.clearInterval(clockInterval);
        clockInterval = null;
        clockIntervalMs = 0;
      }
    };
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

      // Capture into loop recorder if recording is active.
      const { loopRecording } = useChorditStore.getState();
      if (loopRecording) {
        import("../app/loopRecorder").then(({ loopRecorder }) => {
          loopRecorder.captureChord({
            rootMidi,
            chordType: selectedChordType,
            extensions: activeExtensions,
            velocity,
          });
        });
      }

      // Stop previous performance.
      if (sharedActive) sharedActive.handle.stop();

      const handle = trigger({
        mode: performanceMode,
        chord: notes,
        velocity,
        channel: 0,
        midiOut: getSharedEngine(performanceParams.bpm).fanout,
        clock: getSharedEngine(performanceParams.bpm).clock,
        strumDeltaMs: performanceParams.strumDeltaMs,
        slopMaxMs: performanceParams.slopMaxMs,
        slopSeed: Date.now() & 0xffff,
        arpIntervalTicks: performanceParams.arpIntervalTicks,
        pattern: (() => {
          const all = [...PATTERNS, ...useChorditStore.getState().userPatterns];
          return all[performanceParams.patternIndex] ?? PATTERNS[0];
        })(),
        harpDeltaMs: performanceParams.harpDeltaMs,
        harpOctaves: performanceParams.harpOctaves,
      });
      sharedActive = { handle, notes };
    },
    [],
  );

  const releaseRoot = useCallback((_rootMidi: number) => {
    if (sharedActive) {
      sharedActive.handle.stop();
      sharedActive = null;
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

  // Globally route incoming hardware MIDI notes to the chord engine, so
  // pressing keys on the hardware keyboard plays chords from ANY screen.
  useEffect(() => {
    if (!options.hardwareInput) return;
    hardwareUsers += 1;
    midiManager.init().catch(() => {});
    // Global mapping dispatcher: pads / dials / buttons drive store actions
    // on every screen once mappings exist.
    startMappingDispatcher();
    if (!hardwareUnsub) {
      hardwareUnsub = midiManager.subscribe((msg) => {
        // If this incoming note is mapped to a control (pad), don't also
        // treat it as a chord root — the dispatcher handled it.
        if (msg.type === "noteOn") {
          const { midiMappings } = useChorditStore.getState();
          if (findMatchingControl(msg, midiMappings)) return;
          if (msg.velocity > 0) playRoot(msg.note, msg.velocity);
        } else if (msg.type === "noteOff") {
          const { midiMappings } = useChorditStore.getState();
          if (findMatchingControl({ ...msg, type: "noteOn", velocity: 1 }, midiMappings)) return;
          releaseRoot(msg.note);
        }
      });
    }
    return () => {
      hardwareUsers = Math.max(0, hardwareUsers - 1);
      if (hardwareUsers === 0) {
        hardwareUnsub?.();
        hardwareUnsub = null;
      }
    };
  }, [options.hardwareInput, playRoot, releaseRoot]);

  return {
    playRoot,
    releaseRoot,
    voicingShift,
    toggleExt,
    midi: engineRef.current.midi,
    clock: engineRef.current.clock,
  };
}
