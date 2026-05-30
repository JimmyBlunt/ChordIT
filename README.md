# ChordIT

ChordIT is a MIDI chord generator and performance instrument. Hold a chord-type
pad, optionally hold one or more extensions, then play a single note on your
MIDI keyboard (or your QWERTY keyboard in mock mode). ChordIT generates and
sends the resulting MIDI chord — voiced, key-snapped, and optionally performed
as strum / slop / arpeggio / pattern / harp.

## Install

```bash
bun install
```

## Run the app

```bash
bun run dev
```

Open the printed URL. The main page is the performance UI; `/settings` exposes
MIDI input/output selection and the mapping table.

## Mock mode (no hardware needed)

Mock mode is on by default. Use the QWERTY keyboard to play roots:

```
A S D F G H J K   -> C D E F G A B C (white keys, starting C4)
W E T Y U         -> C# D# F# G# A#
↑ ↓               -> voicing up / down
```

Click chord-type pads (Dim / Min / Maj / Sus) and extension pads (6 / m7 / M7 / 9)
to compose the chord. Use the rotaries for Perform mode, Key, and Voicing mode.

## Connect MIDI hardware

1. Open `/settings`.
2. Turn **MOCK MODE** off.
3. Pick a **MIDI INPUT** and **MIDI OUTPUT** from the dropdowns (requires a
   Web MIDI capable browser — Chrome/Edge).

## MIDI Learn

In `/settings`, click **LEARN** on a row, then move a knob or hit a pad on
your controller. ChordIT captures the channel + CC/note and saves the mapping
to localStorage. Use **CLEAR** to remove one mapping, **RESET ALL** to wipe
everything.

In mock mode the LEARN button is replaced by **BIND**, which prompts for the
CC/note + channel + number manually.

## Chord types and extensions

| Pad   | Intervals       |
|-------|-----------------|
| Maj   | 0, 4, 7         |
| Min   | 0, 3, 7         |
| Sus   | 0, 5, 7 (sus4)  |
| Dim   | 0, 3, 6         |

| Ext   | Interval |
|-------|----------|
| 6     | 9        |
| m7    | 10       |
| M7    | 11       |
| 9     | 14       |

Notation rules:
- 1 extension → superscript (e.g. `Cᴹ⁷`, `C⁹`).
- 2 extensions → stable order `6 · m7 · M7 · 9`.
- 3 extensions → `JAZZ` superscript.
- 4 extensions → `WTF` superscript.
- Maj + only `m7` → `C⁷` (dominant seventh).

## Performance modes

`Off`, `Strum`, `Strum 2 Octaves`, `Slop`, `Arpeggiate`, `Arpeggiate 2 Octaves`,
`Pattern`, `Harp`. The Perform rotary cycles through them. BPM, strum delta,
slop range and pattern selection live in `/settings`.

## Key Mode

Toggle **KEY MODE** in the right panel and pick a key with the **KEY** rotary.
When active, every generated note is snapped to the selected major scale.

## Tests

```bash
bun run test
```

Vitest covers chord generation across every chord-type × extension subset,
notation rules (including JAZZ / WTF / dominant-7), voicing, key-mode
constraint, mapping learn + persistence, and every performance mode using a
deterministic mock clock and seeded RNG.

## Architecture

- `src/chord/` — pure chord + notation
- `src/voicing/` — pure voicing transforms
- `src/key/` — major-scale snapping
- `src/performance/` — performance engine, mock clock, patterns, seeded RNG
- `src/midi/` — MIDI types, mock MIDI, Web MIDI adapter, mapper
- `src/app/` — zustand store + `useChordIT` hook wiring engine ↔ UI
- `src/ui/` — `MainScreen` + `SettingsScreen`
- `src/routes/` — TanStack Start routes
- `src/tests/` — Vitest test suite
