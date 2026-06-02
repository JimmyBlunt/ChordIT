# ChordIT — Vollständige Test-Dokumentation

Dieses Dokument beschreibt **jeden einzelnen automatisierten Test** der ChordIT-Suite (`bunx vitest run`), im gleichen Detail-Stil wie die 10 visuellen Tests auf der `/tests`-Seite (Titel · Requirement · Input · Erwartete Ausgabe · Pass-Kriterium).

**Gesamt: 104 Tests** in 5 Dateien.


| Datei | Bereich | Anzahl |
|---|---|---:|
| `chord.test.ts` | Chord-Engine (Intervalle, Notation, alle Typ×Extension-Kombinationen) | 74 |
| `key.test.ts` | Tonart-Constrainer (Skalen-Snapping) | 4 |
| `mapping.test.ts` | MIDI-Mapper (Learn / Dispatch / Persistenz) | 6 |
| `performance.test.ts` | Performance-Modi (Off, Strum, Slop, Arpeggio, Pattern, Harp) | 13 |
| `voicing.test.ts` | Voicing-Engine (Up/Down, Split, Octave) | 7 |


---

## `src/tests/chord.test.ts` — Chord-Engine (Intervalle, Notation, alle Typ×Extension-Kombinationen)


### chord engine — all combinations  ·  64/64 PASS

**Requirement:** Für jede Kombination aus den 4 Chord-Typen (Maj, Min, Sus, Dim) und jeder der 16 Teilmengen der 4 Extensions ({}, {6}, {m7}, {M7}, {9}, {6,m7}, … bis {6,m7,M7,9}) muss `buildChord(root, type, exts)` einen korrekten Akkord erzeugen.

**Input:** Root = 60 (C4), alle 4 Chord-Typen × alle 16 Extension-Subsets = **64 Kombinationen**.

**Erwartete Ausgabe:**

- Noten sind **streng aufsteigend sortiert** (jede Note > Vorgänger).
- **Keine Duplikate** (Set.size == Array.length).
- Notenmenge = `{ROOT + i | i ∈ CHORD_TYPE_INTERVALS[type]} ∪ {ROOT + EXTENSION_INTERVALS[e] | e ∈ exts}`.

**Pass-Kriterium:** Die obigen 3 Invarianten gelten für jede der 64 Kombinationen ⇒ 64 PASS.


| # | Test | Input | Erwartet | Status |
|--:|---|---|---|:--:|
| 1 | Dim + [] builds correct chord | root=60 (C4), type=Dim, exts=[(keine)] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 2 | Dim + [6] builds correct chord | root=60 (C4), type=Dim, exts=[6] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 3 | Dim + [m7] builds correct chord | root=60 (C4), type=Dim, exts=[m7] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 4 | Dim + [6,m7] builds correct chord | root=60 (C4), type=Dim, exts=[6,m7] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 5 | Dim + [M7] builds correct chord | root=60 (C4), type=Dim, exts=[M7] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 6 | Dim + [6,M7] builds correct chord | root=60 (C4), type=Dim, exts=[6,M7] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 7 | Dim + [m7,M7] builds correct chord | root=60 (C4), type=Dim, exts=[m7,M7] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 8 | Dim + [6,m7,M7] builds correct chord | root=60 (C4), type=Dim, exts=[6,m7,M7] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 9 | Dim + [9] builds correct chord | root=60 (C4), type=Dim, exts=[9] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 10 | Dim + [6,9] builds correct chord | root=60 (C4), type=Dim, exts=[6,9] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 11 | Dim + [m7,9] builds correct chord | root=60 (C4), type=Dim, exts=[m7,9] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 12 | Dim + [6,m7,9] builds correct chord | root=60 (C4), type=Dim, exts=[6,m7,9] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 13 | Dim + [M7,9] builds correct chord | root=60 (C4), type=Dim, exts=[M7,9] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 14 | Dim + [6,M7,9] builds correct chord | root=60 (C4), type=Dim, exts=[6,M7,9] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 15 | Dim + [m7,M7,9] builds correct chord | root=60 (C4), type=Dim, exts=[m7,M7,9] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 16 | Dim + [6,m7,M7,9] builds correct chord | root=60 (C4), type=Dim, exts=[6,m7,M7,9] | sortiert, unique, = base(Dim)∪exts | ✅ |
| 17 | Min + [] builds correct chord | root=60 (C4), type=Min, exts=[(keine)] | sortiert, unique, = base(Min)∪exts | ✅ |
| 18 | Min + [6] builds correct chord | root=60 (C4), type=Min, exts=[6] | sortiert, unique, = base(Min)∪exts | ✅ |
| 19 | Min + [m7] builds correct chord | root=60 (C4), type=Min, exts=[m7] | sortiert, unique, = base(Min)∪exts | ✅ |
| 20 | Min + [6,m7] builds correct chord | root=60 (C4), type=Min, exts=[6,m7] | sortiert, unique, = base(Min)∪exts | ✅ |
| 21 | Min + [M7] builds correct chord | root=60 (C4), type=Min, exts=[M7] | sortiert, unique, = base(Min)∪exts | ✅ |
| 22 | Min + [6,M7] builds correct chord | root=60 (C4), type=Min, exts=[6,M7] | sortiert, unique, = base(Min)∪exts | ✅ |
| 23 | Min + [m7,M7] builds correct chord | root=60 (C4), type=Min, exts=[m7,M7] | sortiert, unique, = base(Min)∪exts | ✅ |
| 24 | Min + [6,m7,M7] builds correct chord | root=60 (C4), type=Min, exts=[6,m7,M7] | sortiert, unique, = base(Min)∪exts | ✅ |
| 25 | Min + [9] builds correct chord | root=60 (C4), type=Min, exts=[9] | sortiert, unique, = base(Min)∪exts | ✅ |
| 26 | Min + [6,9] builds correct chord | root=60 (C4), type=Min, exts=[6,9] | sortiert, unique, = base(Min)∪exts | ✅ |
| 27 | Min + [m7,9] builds correct chord | root=60 (C4), type=Min, exts=[m7,9] | sortiert, unique, = base(Min)∪exts | ✅ |
| 28 | Min + [6,m7,9] builds correct chord | root=60 (C4), type=Min, exts=[6,m7,9] | sortiert, unique, = base(Min)∪exts | ✅ |
| 29 | Min + [M7,9] builds correct chord | root=60 (C4), type=Min, exts=[M7,9] | sortiert, unique, = base(Min)∪exts | ✅ |
| 30 | Min + [6,M7,9] builds correct chord | root=60 (C4), type=Min, exts=[6,M7,9] | sortiert, unique, = base(Min)∪exts | ✅ |
| 31 | Min + [m7,M7,9] builds correct chord | root=60 (C4), type=Min, exts=[m7,M7,9] | sortiert, unique, = base(Min)∪exts | ✅ |
| 32 | Min + [6,m7,M7,9] builds correct chord | root=60 (C4), type=Min, exts=[6,m7,M7,9] | sortiert, unique, = base(Min)∪exts | ✅ |
| 33 | Maj + [] builds correct chord | root=60 (C4), type=Maj, exts=[(keine)] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 34 | Maj + [6] builds correct chord | root=60 (C4), type=Maj, exts=[6] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 35 | Maj + [m7] builds correct chord | root=60 (C4), type=Maj, exts=[m7] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 36 | Maj + [6,m7] builds correct chord | root=60 (C4), type=Maj, exts=[6,m7] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 37 | Maj + [M7] builds correct chord | root=60 (C4), type=Maj, exts=[M7] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 38 | Maj + [6,M7] builds correct chord | root=60 (C4), type=Maj, exts=[6,M7] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 39 | Maj + [m7,M7] builds correct chord | root=60 (C4), type=Maj, exts=[m7,M7] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 40 | Maj + [6,m7,M7] builds correct chord | root=60 (C4), type=Maj, exts=[6,m7,M7] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 41 | Maj + [9] builds correct chord | root=60 (C4), type=Maj, exts=[9] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 42 | Maj + [6,9] builds correct chord | root=60 (C4), type=Maj, exts=[6,9] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 43 | Maj + [m7,9] builds correct chord | root=60 (C4), type=Maj, exts=[m7,9] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 44 | Maj + [6,m7,9] builds correct chord | root=60 (C4), type=Maj, exts=[6,m7,9] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 45 | Maj + [M7,9] builds correct chord | root=60 (C4), type=Maj, exts=[M7,9] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 46 | Maj + [6,M7,9] builds correct chord | root=60 (C4), type=Maj, exts=[6,M7,9] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 47 | Maj + [m7,M7,9] builds correct chord | root=60 (C4), type=Maj, exts=[m7,M7,9] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 48 | Maj + [6,m7,M7,9] builds correct chord | root=60 (C4), type=Maj, exts=[6,m7,M7,9] | sortiert, unique, = base(Maj)∪exts | ✅ |
| 49 | Sus + [] builds correct chord | root=60 (C4), type=Sus, exts=[(keine)] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 50 | Sus + [6] builds correct chord | root=60 (C4), type=Sus, exts=[6] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 51 | Sus + [m7] builds correct chord | root=60 (C4), type=Sus, exts=[m7] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 52 | Sus + [6,m7] builds correct chord | root=60 (C4), type=Sus, exts=[6,m7] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 53 | Sus + [M7] builds correct chord | root=60 (C4), type=Sus, exts=[M7] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 54 | Sus + [6,M7] builds correct chord | root=60 (C4), type=Sus, exts=[6,M7] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 55 | Sus + [m7,M7] builds correct chord | root=60 (C4), type=Sus, exts=[m7,M7] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 56 | Sus + [6,m7,M7] builds correct chord | root=60 (C4), type=Sus, exts=[6,m7,M7] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 57 | Sus + [9] builds correct chord | root=60 (C4), type=Sus, exts=[9] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 58 | Sus + [6,9] builds correct chord | root=60 (C4), type=Sus, exts=[6,9] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 59 | Sus + [m7,9] builds correct chord | root=60 (C4), type=Sus, exts=[m7,9] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 60 | Sus + [6,m7,9] builds correct chord | root=60 (C4), type=Sus, exts=[6,m7,9] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 61 | Sus + [M7,9] builds correct chord | root=60 (C4), type=Sus, exts=[M7,9] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 62 | Sus + [6,M7,9] builds correct chord | root=60 (C4), type=Sus, exts=[6,M7,9] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 63 | Sus + [m7,M7,9] builds correct chord | root=60 (C4), type=Sus, exts=[m7,M7,9] | sortiert, unique, = base(Sus)∪exts | ✅ |
| 64 | Sus + [6,m7,M7,9] builds correct chord | root=60 (C4), type=Sus, exts=[6,m7,M7,9] | sortiert, unique, = base(Sus)∪exts | ✅ |


### chord notation  ·  10/10 PASS

**Requirement:** Die Notation (`getChordDisplayString`) muss die in den Requirements festgelegten Anzeigeregeln umsetzen, inkl. der Sonderfälle 'dominant 7', JAZZ und WTF.

**Input:** Diverse (Root, Typ, Extensions)-Tupel — siehe pro Test unten.

**Erwartete Ausgabe:**

Exakter String pro Test (siehe Liste).

**Pass-Kriterium:** String-Vergleich `===`.


| # | Test | Input | Erwartet | Status |
|--:|---|---|---|:--:|
| 1 | Maj alone is just root | 60, Maj, [] | C | ✅ |
| 2 | Min is suffix m | 60, Min, [] | Cm | ✅ |
| 3 | Sus is suffix sus | 60, Sus, [] | Csus | ✅ |
| 4 | Dim is suffix dim | 60, Dim, [] | Cdim | ✅ |
| 5 | dominant 7 special rule: Maj + m7 → C⁷ | 60, Maj, [m7] | C⁷  (Dominant-7-Sonderregel) | ✅ |
| 6 | Maj + M7 → Cᴹ⁷ | 60, Maj, [M7] | Cᴹ⁷ | ✅ |
| 7 | Maj + 6 → C⁶ | 60, Maj, [6] | C⁶ | ✅ |
| 8 | Maj + 9 → C⁹ | 60, Maj, [9] | C⁹ | ✅ |
| 9 | three extensions → JAZZ | 60, Maj/[6,M7,9] und Min/[6,m7,9] | Cᴶᴬᶻᶻ / Cmᴶᴬᶻᶻ | ✅ |
| 10 | four extensions → WTF | 60, alle 4 Typen, [6,m7,M7,9] | Cᵂᵀᶠ / Cmᵂᵀᶠ / Csusᵂᵀᶠ / Cdimᵂᵀᶠ | ✅ |


---

## `src/tests/key.test.ts` — Tonart-Constrainer (Skalen-Snapping)


### key mode  ·  4/4 PASS

**Requirement:** `constrainToKey()` snappt jede ausgegebene Note in die gewählte Dur-Skala. Diatonische Akkorde bleiben unverändert; nicht-diatonische Roots werden auf gültige Skalentöne abgebildet.

**Input:** Akkorde gebaut mit `buildChord(root, 'Maj', [])` für verschiedene Roots, Skalen C und G.

**Erwartete Ausgabe:**

- `majorScalePitchClasses('C')` = `[0,2,4,5,7,9,11]`.
- Für jede Eingangsnote gilt nach Constrain: `isInScale(note, key) === true`.
- Wechseln der Tonart ändert die erlaubten Pitch-Classes (gleiche Eingabe → andere Snap-Ausgabe für G vs C).

**Pass-Kriterium:** Alle 4 Tests grün.


| # | Test | Input | Erwartet | Status |
|--:|---|---|---|:--:|
| 1 | C major has the right pitch classes | key='C' | [0,2,4,5,7,9,11] | ✅ |
| 2 | diatonic input in C major stays diatonic | roots 60/62/64 Maj, key=C | alle Outputs ∈ C-Dur | ✅ |
| 3 | non-diatonic root snaps every output into the scale (C# in C major) | root 61 Maj, key=C | alle Outputs ∈ C-Dur (snap C#→C/D etc.) | ✅ |
| 4 | changing key changes the allowed pitch classes | root 60 Maj, key=C vs key=G | C-Outputs ∈ C-Dur, G-Outputs ∈ G-Dur | ✅ |


---

## `src/tests/mapping.test.ts` — MIDI-Mapper (Learn / Dispatch / Persistenz)


### midi mapper — learn  ·  6/6 PASS

**Requirement:** Der `MidiMapper` muss per Learn-Mode CC- und Note-Events einer Control-ID zuordnen, Events korrekt zur Control-ID dispatchen, Channel-fremde Events ignorieren, und Mappings in `Storage` persistieren / wieder laden können. `reset()` löscht alle Mappings.

**Input:** Synthetische MIDI-Events (`{type, cc/note, value/velocity, channel}`), Memory-Storage-Stub.

**Erwartete Ausgabe:**

Siehe pro Test.

**Pass-Kriterium:** Alle 6 Tests grün.


| # | Test | Input | Erwartet | Status |
|--:|---|---|---|:--:|
| 1 | captures a CC mapping | Learn 'dial.perform' → CC#21 Ch3 V=64 | Mapping {inputType:'cc', channel:3, number:21}, learning=null | ✅ |
| 2 | captures a Note mapping | Learn 'chord.Maj' → noteOn 48 Ch0 V=100 | Mapping {inputType:'note', channel:0, number:48} | ✅ |
| 3 | dispatches the right controlId when a mapped event arrives | Set 'ext.M7'→Note50/Ch0; handle noteOn 50 Ch0 | matched='ext.M7' | ✅ |
| 4 | ignores events on a different channel | Set 'ext.M7'→Note50/Ch0; handle noteOn 50 Ch1 | matched=null | ✅ |
| 5 | persists and reloads via storage | Set chord.Sus→CC10/Ch2, save→neue Instanz load | Identisches Mapping rekonstruiert | ✅ |
| 6 | reset clears everything | Set Mapping, reset() | list() === [] | ✅ |


---

## `src/tests/performance.test.ts` — Performance-Modi (Off, Strum, Slop, Arpeggio, Pattern, Harp)


### performance: Off / Manual  ·  1/1 PASS

**Requirement:** Off-Mode (Block-Akkord) sendet alle Akkordtöne **gleichzeitig** ohne Zeitverzögerung.

**Input:** chord=[60,64,67,71], vel=100, ch=0

**Erwartete Ausgabe:**

Genau 4 Events, Notenreihenfolge exakt [60,64,67,71].

**Pass-Kriterium:** 1 Test grün.


| # | Test | Input | Erwartet | Status |
|--:|---|---|---|:--:|
| 1 | outputs chord notes simultaneously | 4-Ton-Akkord | 4 Events @ t=0, Reihenfolge [60,64,67,71] | ✅ |


### performance: Strum  ·  2/2 PASS

**Requirement:** Strum spielt Töne aufsteigend mit `strumDeltaMs` Abstand. Strum2Octaves wiederholt die Sequenz +12 Halbtöne darüber.

**Input:** chord [60,64,67,71] bzw. [60,64,67], strumDeltaMs=50/10, slopMaxMs=0

**Erwartete Ausgabe:**

Strum: 4 Noten, 3×50ms = 150ms Gesamtzeit. 2Oct: [60,64,67,72,76,79].

**Pass-Kriterium:** 2 Tests grün.


| # | Test | Input | Erwartet | Status |
|--:|---|---|---|:--:|
| 1 | outputs notes ascending with strumDeltaMs between each | [60,64,67,71], dt=50 | [60,64,67,71], clock≈150ms | ✅ |
| 2 | Strum2Octaves doubles sequence at +12 | [60,64,67], dt=10 | [60,64,67,72,76,79] | ✅ |


### performance: Slop  ·  2/2 PASS

**Requirement:** Slop ist mit gleichem `slopSeed` **reproduzierbar** und `slopMaxMs` beeinflusst messbar die Gesamtdauer.

**Input:** chord=[60,64,67,71], seed=42 (Reprod.) bzw. seed=7 mit slopMaxMs 0 vs 30.

**Erwartete Ausgabe:**

Reprod.: zwei Läufe identisch (Events + Zeit). Varianz: clock(30) ≠ clock(0).

**Pass-Kriterium:** 2 Tests grün.


| # | Test | Input | Erwartet | Status |
|--:|---|---|---|:--:|
| 1 | is repeatable with same seed | seed=42, slopMaxMs=20, zwei Runs | events[A]==events[B], clock[A]==clock[B] | ✅ |
| 2 | variance affects total duration | slopMaxMs=0 vs 30, seed=7 | clock(30) !== clock(0) | ✅ |


### performance: Arpeggiate  ·  4/4 PASS

**Requirement:** Arpeggio läuft synchron zur Clock (24 PPQN): 1/8 = 12 Ticks, 1/16 = 6 Ticks. Loop verlängert sich mit Akkord-Größe. Arpeggiate2Octaves erweitert die Sequenz um +12.

**Input:** Diverse Akkorde, advanceTicks für n Schritte.

**Erwartete Ausgabe:**

Siehe pro Test.

**Pass-Kriterium:** 4 Tests grün.


| # | Test | Input | Erwartet | Status |
|--:|---|---|---|:--:|
| 1 | 1/8 fires every 12 ticks (24 PPQN) | [60,64,67], 48 Ticks | 4 noteOn [60,64,67,60], letztes Event noteOff nach stop() | ✅ |
| 2 | 1/16 fires every 6 ticks | [60,64], 24 Ticks | 4 noteOn | ✅ |
| 3 | Arpeggiate2Octaves extends sequence with +12 | [60,64,67], 72 Ticks | [60,64,67,72,76,79] | ✅ |
| 4 | adding extensions grows the loop length | [60,64,67,71,74] (M7+9), 60 Ticks | [60,64,67,71,74] in Reihenfolge | ✅ |


### performance: Pattern  ·  2/2 PASS

**Requirement:** Mind. **10 Patterns** verfügbar; jeder Step hat gültige `tickOffset` (< lengthTicks) und `velocityScale ∈ (0,1]`. Eingangs-Velocity wird mit `velocityScale` skaliert.

**Input:** PATTERNS-Array bzw. Custom-Pattern mit 2 Steps (scale 0.5 und 1.0).

**Erwartete Ausgabe:**

≥10 Patterns valid. Test-Pattern erzeugt Output-Velocities [50, 100].

**Pass-Kriterium:** 2 Tests grün.


| # | Test | Input | Erwartet | Status |
|--:|---|---|---|:--:|
| 1 | has at least 10 valid patterns | PATTERNS | >=10, steps valid | ✅ |
| 2 | scales output velocity against input velocity | vel=100, scales 0.5/1.0 | Velocities sortiert == [50,100] | ✅ |


### performance: Harp  ·  2/2 PASS

**Requirement:** Harp spielt Basistöne und transponiert sie um Oktaven nach oben (harpOctaves). `stop()` sendet zu **jedem** noteOn ein passendes noteOff.

**Input:** [60,64,67] bzw. [60,64], harpOctaves=2, harpDeltaMs=10.

**Erwartete Ausgabe:**

Sequenz [60,64,67,72,76,79]; noteOff-Count == noteOn-Count.

**Pass-Kriterium:** 2 Tests grün.


| # | Test | Input | Erwartet | Status |
|--:|---|---|---|:--:|
| 1 | plays base notes then transposed up by octaves | [60,64,67], oct=2 | [60,64,67,72,76,79] | ✅ |
| 2 | stop() emits matching note offs | [60,64], oct=2 → stop() | noteOff == noteOn | ✅ |


---

## `src/tests/voicing.test.ts` — Voicing-Engine (Up/Down, Split, Octave)


### voicing engine  ·  7/7 PASS

**Requirement:** Voice Up/Down rotieren den tiefsten/höchsten Ton ±12. Split verschiebt Noten unterhalb von `splitKey` um +12 (Grenze: Note == splitKey bleibt). Octave faltet alle Noten ins Fenster `[base, base+11]`.

**Input:** Diverse Akkord-Arrays, splitKey/base typisch 60.

**Erwartete Ausgabe:**

Siehe pro Test.

**Pass-Kriterium:** Alle 7 Tests grün.


| # | Test | Input | Erwartet | Status |
|--:|---|---|---|:--:|
| 1 | voice up rotates lowest +12 | [60,64,67] | [64,67,72] | ✅ |
| 2 | voice down rotates highest -12 | [64,67,72] | [60,64,67] | ✅ |
| 3 | voice up is reverse of voice down | [60,64,67] | voiceDown(voiceUp(x)) === x | ✅ |
| 4 | split mode shifts notes below splitKey up an octave | [55,60,64] split=60 | [60,64,67] | ✅ |
| 5 | split mode boundary: note equal to splitKey is unchanged | [60,64,67] split=60 | [60,64,67] | ✅ |
| 6 | split mode boundary: splitKey-1 shifts up | [59] split=60 | [71] | ✅ |
| 7 | octave mode folds notes into [base, base+11] | [48,60,76] base=60 und [0,60,100,127] | [60,60,64] bzw. alle ∈ [60..71] | ✅ |


---

## Requirements-Abdeckung

| Requirement | Abgedeckt durch |
|---|---|
| Akkord-Engine: 4 Typen × alle Extension-Kombinationen | `chord engine — all combinations` (64 Tests) |
| Akkord-Anzeige: Sonderregeln (Dominant-7, JAZZ, WTF) | `chord notation` (10 Tests) |
| Tonart-Skalen-Snapping | `key mode` (4 Tests) |
| Voicing Up / Down (Rotations-Inversen) | `voicing engine` voice up/down/inverse (3 Tests) |
| Voicing Split-Mode inkl. Grenzfälle | `voicing engine` split tests (3 Tests) |
| Voicing Octave-Folding | `voicing engine` octave fold (1 Test) |
| Performance Off (Block-Akkord) | `performance: Off / Manual` (1 Test) |
| Performance Strum & Strum2Octaves | `performance: Strum` (2 Tests) |
| Performance Slop (Reproduzierbarkeit + Varianz) | `performance: Slop` (2 Tests) |
| Performance Arpeggio 1/8, 1/16, 2-Oktaven, Loop-Länge | `performance: Arpeggiate` (4 Tests) |
| Performance Pattern-Bibliothek ≥10 + Velocity-Skalierung | `performance: Pattern` (2 Tests) |
| Performance Harp + sauberes Note-Off auf Stop | `performance: Harp` (2 Tests) |
| MIDI-Mapping Learn (CC + Note) | `midi mapper — learn` (2 Tests) |
| MIDI-Mapping Dispatch + Channel-Filter | `midi mapper — learn` (2 Tests) |
| MIDI-Mapping Persistenz + Reset | `midi mapper — learn` (2 Tests) |

---

## Verhältnis zur In-App-Test-Seite `/tests`

Die 10 Tests in `src/ui/TestsScreen.tsx` (T1…T10) sind **visuelle Smoke-Tests** mit Piano- und Timeline-Grafik. Die obigen 104 Vitest-Tests sind die **vollständige Requirements-Suite** und laufen headless in CI/Lokal via `bunx vitest run`. Jeder T1…T10-Test hat ein direktes Vitest-Pendant oben:

| In-App | Vitest-Pendant |
|---|---|
| T1 Maj at C4 | chord engine: Maj + [] builds correct chord |
| T2 Am7 at A3 | chord engine: Min + [m7] (root 57 analog zu 60) |
| T3 Dsus9 | chord engine: Sus + [9] |
| T4 Split Voicing | voicing engine: split mode shifts notes below splitKey |
| T5 Key constrain | key mode: diatonic input in C major stays diatonic |
| T6 Perf Off | performance: Off / Manual |
| T7 Perf Strum | performance: Strum (50→80ms Variante) |
| T8 Pattern Four on Floor | performance: Pattern velocity scaling + has ≥10 patterns |
| T9 Loop Recorder | (nur in App — kein Vitest-Test, da reines DOM-Timing) |
| T10 Display string | chord notation: Min + m7 |
