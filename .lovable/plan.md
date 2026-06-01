
# ChordIT Extension Implementation

Scope: add Electronic Mode, 15 Progression Presets, Roman Numeral Resolver, Voicing Recipe Engine, Propose Engine with scored next-chord suggestions, Virtual Keyboard proposal highlights, and full test suite per the spec.

## Modules to create (pure, testable)

```text
src/electronic/electronicTypes.ts         # ElectronicChordType, ColourPad, intervals, pad→ext mapping
src/electronic/electronicChordPresets.ts  # 13 required presets
src/progressions/progressionTypes.ts      # HarmonicMode, HarmonicStyle, MoodTarget, ScaleContext, VoicingRecipeName, ProgressionPreset
src/progressions/progressionPresets.ts    # All 15 presets
src/progressions/romanNumeralResolver.ts  # Major + natural-minor degree → chord; avoidDiminished substitution
src/progressions/expectedExamples.ts      # Fixture for snapshot tests
src/voicing/voicingRecipes.ts             # Close, Open, Smooth, BassLow, PedalTop, PedalBass, TopLine, Drop2, OctaveSpread, NoDiminishedSubstitute
src/propose/proposeTypes.ts               # PlayedChord, ProposeRequest, ChordProposal, scoring weights
src/propose/proposeEngine.ts              # generate + score + sort + assign colours
src/propose/styleMovements.ts             # Per-style preferred root movements + colours
src/ui/keyboardProposalHighlights.ts      # Map ranked proposals → highlight state
```

## Store changes (`src/app/store.ts`)

- Add `harmonicMode: HarmonicMode` (default `"Standard"`).
- Add `harmonicStyle: HarmonicStyle` (default `"MelodicTechno"`).
- Add `moodTarget: MoodTarget` (default `"Deep"`).
- Add `activeProgressionPresetId?: string`.
- Add `chordHistory: PlayedChord[]` (cap last 32 entries; pushed by `playRoot`).
- Add `proposals: ChordProposal[]` and `highlights: KeyboardProposalHighlight[]`.
- Actions: `setHarmonicMode`, `setHarmonicStyle`, `setMoodTarget`, `setActiveProgressionPresetId`, `proposeNext()`, `clearProposals()`.
- Persisted in existing zustand persist config.

## Integration

- `useChordIT.playRoot` pushes a `PlayedChord` into `chordHistory`.
- Add a globally MIDI-mappable `propose` control id (`button.propose`) wired in `mappingDispatcher.ts` to call `proposeNext()`.
- `MainScreen`: add Mode switcher (Standard / Electronic / Progression / Propose), Electronic colour pads when mode is Electronic, Progression preset picker when Progression mode, and overlay highlight colours on `PianoKeyboard` (green/yellow/blue/purple).
- `PianoKeyboard` accepts an optional `proposalHighlights` prop and renders coloured ring overlays on matching pitch-class keys.

## Propose Engine algorithm

1. Build candidate set: every pitch-class root in the active scale (or all 12 if no key mode), each with a chord colour drawn from style preferences and active preset preferences.
2. Apply `NoDiminishedSubstitute` when style is electronic and `avoidDiminished` is true.
3. Score using the spec's weights: key membership, active-preset next-step match, style movement match, mood match, voice-leading distance to last chord, common tones, top-line stepwise, small bass jump, preferred colour, preferred performance mode. Penalties: repetition, out-of-key, dim-in-electronic, large top jump, jazzy-in-minimal.
4. Filter out-of-key candidates entirely when Key Mode on (never just penalize).
5. Sort by score desc, take `maxSuggestions` (default 4), assign Best/Good/Alternative/Spicy + green/yellow/blue/purple.
6. Each proposal gets a `voicingRecipe` and `performanceModeSuggestion` chosen from the active preset (or style defaults) and a human-readable `reason`.

## Roman numeral resolver

- Major: I, ii, iii, IV, V, vi, vii° (with diminished).
- Natural minor: i, ii°, III, iv, v, VI, VII.
- Recognise common extension suffixes in roman tokens (e.g. `v7`, `VImaj9`, `iv7`) → chord type + extensions.
- `resolvePreset(preset)` returns array of `{ rootName, chordType, extensions }`.
- `avoidDiminished` mode substitutes ° degrees with Sus2 / Pow / nearest stable diatonic.

## Voicing recipes

Each recipe is `(notes, context) => number[]`. Pure, sort ascending, dedupe. Smooth uses brute-force search over ±2 octave shifts of each tone and picks min Σ|Δ| to previousChordNotes.

## Tests

Create the seven test files listed in spec §15, plus the integration tests in §22. Use Vitest + RTL (already in project). All tests run headless without MIDI hardware.

Key test groups:
- Electronic intervals (16.1) + pad mapping (16.2) + preset shape (16.3) + generation matrix (16.4).
- Preset library: count = 15, unique IDs, required fields, specific assertions for presets 1, 8, 10, 15.
- Roman numeral resolver: C major + A minor full degree set; preset example resolutions for 1, 4, 5, 8, 10, 12, 13; avoidDiminished behaviour.
- Voicing recipes: one focused test per recipe.
- Propose engine: shape, sort, colour mapping, key-mode strictness, out-of-key rejection, active-preset next-step (presets 1, 4, 8, 10), minimal repetition allowed, DancePop/TechHouse/MelodicTechno/Electro style movement matrices, tension mood spicy proposals.
- Keyboard highlight mapping (21.x): count, colour, pitch-class, key-mode visibility.
- Integration (22.x): play → propose flow, chord history, electronic pad combos generate correct MIDI, euphoric preset performance suggestion, avoid-diminished substitution.

## UI scope (minimal, focused)

- `MainScreen`: HarmonicMode pill row, Style + Mood selectors, conditional Electronic colour pads, Progression preset dropdown, "Propose" button, proposal list (chord name · voicing · perf mode · reason · colour dot).
- `PianoKeyboard`: add `proposalHighlights` overlay; outline ring uses semantic tokens (`--success`, `--warning`, `--info`, `--accent` mapped to green/yellow/blue/purple).
- No backend changes. No new dependencies.

## Build order

1. Types + electronic presets + electronic generation + tests.
2. Progression preset data + expectedExamples fixture + tests.
3. Roman numeral resolver + tests.
4. Voicing recipes + tests.
5. Propose engine + style movements + tests.
6. Keyboard highlight mapper + tests.
7. Store wiring (mode, style, mood, history, proposals) + playRoot history capture + mapping dispatcher `button.propose`.
8. UI: MainScreen mode/style/mood controls, electronic pads, progression picker, propose button + list, PianoKeyboard highlight overlay.
9. Integration tests.
10. Run `bunx vitest run`, fix red, ship.

## Non-goals (deferred / version 2)

- Slash-chord MIDI output (resolver flags substitution in `reason` only).
- Chord-tone highlights on the keyboard (root pitch class only, per spec §12 v1).
- Auto-cycling through progression steps (Propose only).
- Persisting `chordHistory` across reloads (kept in-memory).
