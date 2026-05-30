
# ChordIT — Build Plan

A web-based MIDI chord generator + performance instrument, built as a pure, testable engine wrapped in a hardware-inspired React UI. Runs on TanStack Start (already scaffolded). Uses the Web MIDI API in the browser with a Mock MIDI mode so everything works without hardware.

Note on GitHub repo / commits: Lovable manages git internally — I can't push to an external GitHub repo from here. You can connect this project to GitHub from the Lovable UI (Settings → GitHub) and every Lovable change will sync as a commit. I'll proceed with the build.

## Scope (v1)

Implements every section of the spec: mapping, manual chord selection, notation, voicing, all 8 performance modes, BPM clock, Key Mode (12 major keys), main + settings screens, mock MIDI mode, and a Vitest test suite covering the required cases.

## Architecture

Pure, framework-free engine modules — UI only reads state and dispatches events. MIDI I/O and the clock are injected interfaces so tests use mocks.

```text
src/
  chord/        chordEngine.ts, chordNotation.ts, chordTypes.ts
  voicing/      voicingEngine.ts
  performance/  performanceEngine.ts, patterns.ts, clock.ts, mockClock.ts
  key/          keyModeEngine.ts, scales.ts
  midi/         midiTypes.ts, midiOutput.ts, midiInput.ts,
                midiMapper.ts, webMidi.ts, mockMidi.ts
  app/          store.ts (zustand), useChordIT.ts (wires engine ↔ MIDI ↔ store)
  ui/           MainScreen, PadGrid, RotaryControls, ChordDisplay,
                SettingsScreen, MappingTable
  routes/       index.tsx (main), settings.tsx (settings)
  tests/        chord, notation, voicing, performance, key, mapping
```

## Engine behavior (key rules)

- **Chord intervals**: Maj `[0,4,7]`, Min `[0,3,7]`, Sus `[0,5,7]`, Dim `[0,3,6]`. Extensions: `6→9`, `m7→10`, `M7→11`, `9→14`. Sort asc, dedupe.
- **Notation**: superscript map for digits + letters (`⁶ ⁷ ⁹ ᴹ ᵐ`). 1 ext → superscript; 2 ext → stable order `6, m7, M7, 9`; 3 ext → `ᴶᴬᶻᶻ`; 4 ext → `ᵂᵀᶠ`. Special: Maj + `m7` only ⇒ `C⁷` (dominant 7).
- **Voicing**: up = pop lowest, push +12, sort; down = pop highest, push −12, sort. Split mode pivots around `splitKey` (default 60). Octave mode folds notes into `[octaveBase, octaveBase+11]` via mod-12.
- **Performance modes**: Off (chord), Strum (ascending sequential, delta = perf param), Strum2Oct (notes then +12), Slop (strum + seeded jitter), Arpeggiate (loops on 1/8 or 1/16 clock ticks), Arpeggiate2Oct, Pattern (≥10 predefined patterns, velocity-scaled), Harp (fast multi-octave sweep, stops on Note Off).
- **Clock**: `Clock` interface; `MockClock` with `advanceTicks` / `advanceMs`. 24 PPQN, deterministic.
- **Key Mode**: 12 major scales as pitch-class sets. Diatonic input → diatonic chord; non-diatonic root → snap each generated note down to nearest in-scale pitch class. Guarantee: every output note's `% 12` is in the scale.
- **Mapping**: `{ controlId, inputType: "cc"|"note", channel, number }[]`. MIDI Learn captures next event for selected control. Persisted in `localStorage` under `chordit.mappings`.

## UI

- **Main route** (`/`): chord display string (large), root + chord-type + extension chips, 2 rows of 4 pads (Dim/Min/Maj/Sus + 6/m7/M7/9), 3 rotaries (Perform / Voicing / Key) with value readouts, 3 toggle pads, status row (MIDI in/out, mock mode, BPM, key). On-screen QWERTY → MIDI keyboard so it's playable without hardware.
- **Settings route** (`/settings`): MIDI input/output selectors, mappings table with per-row "Learn" + "Clear", Reset, Save (auto), "Test output" button, Mock-mode toggle, BPM, split key, octave base, default chord type.
- **Style**: black background, white high-contrast pixel-ish text (JetBrains Mono), green/amber active-pad highlight — hardware feel. All colors via semantic tokens in `src/styles.css`.

## Tests (Vitest)

- **Chord + notation**: iterate all 4 chord types × all 16 extension subsets — assert MIDI array (sorted, deduped, correct count) and display string. Verifies JAZZ at 3, WTF at 4, dominant-7 rule.
- **Voicing**: up/down inversion, split-mode boundary, octave-mode containment.
- **Performance**: mock clock — Strum delta timing, Slop variance with seeded RNG (repeatable), Arpeggiate 1/8 vs 1/16 timing + loop length grows with extensions + Note Off stops cleanly, Pattern velocity scaling + ≥10 patterns valid, +12 sequence for 2Oct modes and Harp.
- **Key Mode**: C major diatonic outputs only in-scale; C# in C major snaps every output note into C major; toggling key updates scale.
- **Mapping**: learn captures CC + Note bindings, persistence round-trip, reset clears, incoming event dispatches correct action.

## Tech

TanStack Start (existing), React 19, TypeScript strict, Tailwind v4, zustand for app state, Vitest (already configured in template) for tests. Web MIDI via `navigator.requestMIDIAccess()` behind a `MidiIO` interface so the engine never touches the browser API directly.

## Out of scope for v1

Minor keys / modes / custom scales, flat note names, multi-user presets, recording/export, mobile-optimized layout, theming.

## Deliverable

A working ChordIT app at `/`, settings at `/settings`, all engines pure + tested, mock mode usable with zero hardware. After approval I'll implement files in parallel batches and run the test suite to verify.
