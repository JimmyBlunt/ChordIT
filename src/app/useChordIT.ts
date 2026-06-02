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
import {
  areNativePadNotesActive,
  isNativePadNoteNumber,
  startNativePadNotes,
} from "../midi/microKontrolNative";
import type { MidiOut, NoteEvent } from "../midi/midiTypes";
import { trigger, type PerformanceHandle } from "../performance/performanceEngine";
import { MockClock } from "../performance/mockClock";
import { PATTERNS } from "../performance/patterns";
import type { ChordExtension, ChordType } from "../chord/chordTypes";
import {
  buildElectronicChord,
  type ElectronicChordType,
  type ElectronicColourPad,
} from "../electronic/electronicTypes";

const STD_TO_ELECTRONIC: Record<ChordType, ElectronicChordType> = {
  Dim: "Dim",
  Min: "Min",
  Maj: "Maj",
  Sus: "Sus2",
};
const EXT_TO_PAD: Record<ChordExtension, ElectronicColourPad> = {
  "6": "Warm",
  m7: "Deep",
  M7: "Dream",
  "9": "Air",
};

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
let nativePadUnsub: (() => void) | null = null;

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
    void (async () => {
      await Promise.resolve(useChorditStore.persist.rehydrate());
      const st = useChorditStore.getState();
      if (!st.midiMappings || st.midiMappings.length === 0) {
        const { DEFAULT_MIDI_MAPPINGS } = await import("../midi/midiTypes");
        useChorditStore.getState().setMidiMappings(DEFAULT_MIDI_MAPPINGS);
      }
    })();
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

      const { harmonicMode } = useChorditStore.getState();
      let notes: number[];
      let display: string;
      if (harmonicMode === "Electronic") {
        const eType = STD_TO_ELECTRONIC[selectedChordType];
        const pads = activeExtensions.map((e) => EXT_TO_PAD[e]);
        notes = buildElectronicChord(rootMidi, eType, pads);
        notes = applyVoicingMode(notes, voicingMode, splitKey, octaveBase);
        if (keyModeEnabled) notes = constrainToKey(notes, selectedKey);
        const padTag = pads.length ? `[${pads.join("+")}]` : "";
        const NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
        display = `${NAMES[rootMidi % 12]}${eType}${padTag}`;
      } else {
        notes = buildChord(rootMidi, selectedChordType, activeExtensions);
        notes = applyVoicingMode(notes, voicingMode, splitKey, octaveBase);
        if (keyModeEnabled) notes = constrainToKey(notes, selectedKey);
        display = getChordDisplayString(
          rootMidi,
          selectedChordType,
          activeExtensions,
        );
      }
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

      // Push to chord history and refresh proposals.
      void (async () => {
        const [{ makePlayedChord, generateProposals }, { progressionPresets }] =
          await Promise.all([
            import("../propose/proposeEngine"),
            import("../progressions/progressionPresets"),
          ]);
        const st = useChorditStore.getState();
        const played = makePlayedChord({
          rootMidi,
          chordType: selectedChordType,
          extensions: activeExtensions,
          midiNotes: notes,
          displayName: display,
        });
        st.pushChord(played);
        const after = useChorditStore.getState();
        const preset = after.activeProgressionPresetId
          ? progressionPresets.find((p) => p.id === after.activeProgressionPresetId)
          : undefined;
        const keyStr = preset?.exampleKey ?? `${after.selectedKey} major`;
        const proposals = generateProposals({
          selectedKey: keyStr,
          keyModeEnabled: after.keyModeEnabled,
          harmonicMode: after.harmonicMode,
          harmonicStyle: after.harmonicStyle,
          moodTarget: after.moodTarget,
          activeProgressionPresetId: after.activeProgressionPresetId ?? undefined,
          chordHistory: after.chordHistory,
          maxSuggestions: 4,
        });
        useChorditStore.getState().setProposals(proposals);
      })();

      // Stop previous performance only if it's a different root, so retriggering
      // the same key restarts cleanly but a new key overlapping an old one
      // first stops the old one before starting the new.
      if (sharedActive) sharedActive.handle.stop();

      heldRoots.add(rootMidi);

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
      sharedActive = { handle, notes, rootMidi };
    },
    [],
  );

  const releaseRoot = useCallback((rootMidi: number) => {
    heldRoots.delete(rootMidi);
    // Only stop the active performance if the released key actually owns it.
    // Otherwise an earlier key being released would cut off a chord that the
    // user is still holding via a newer key (overlap / legato playing).
    if (sharedActive && sharedActive.rootMidi === rootMidi) {
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
    if (!nativePadUnsub) {
      nativePadUnsub = startNativePadNotes((cb) => midiManager.subscribe(cb));
    }
    // microKONTROL Native-KORG-mode LED sync (no-op if device isn't in Native
    // mode or output denies SysEx — see microkontrol-led-patch.md).
    void import("../midi/microKontrolLedSync").then((m) =>
      m.startMicroKontrolLedSync(0),
    );
    if (!hardwareUnsub) {
      hardwareUnsub = midiManager.subscribe((msg) => {
        // If this incoming note is mapped to a control (pad), don't also
        // treat it as a chord root — the dispatcher handled it.
        if (msg.type === "noteOn") {
          if (areNativePadNotesActive() && isNativePadNoteNumber(msg.note)) return;
          const { midiMappings } = useChorditStore.getState();
          if (findMatchingControl(msg, midiMappings)) return;
          if (msg.velocity > 0) playRoot(msg.note, msg.velocity);
        } else if (msg.type === "noteOff") {
          if (areNativePadNotesActive() && isNativePadNoteNumber(msg.note)) return;
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
        nativePadUnsub?.();
        nativePadUnsub = null;
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
