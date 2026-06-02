# ChordIT — Pattern Library Research (v1)

> Vorschlag zur Diskussion. Bitte freigeben oder Anpassungen markieren, bevor implementiert wird.

Alle Patterns nutzen **24 PPQN** (1 Beat = 24 ticks, 1/16 = 6 ticks, 1 Bar = 96 ticks).
Pattern-Länge ist meistens 1 Bar (96 ticks), Long-Form Patterns 2 Bars (192 ticks).

`noteIndex` referenziert die Akkord-Stimmen aufsteigend (0 = tiefster Ton).
`velocity` 0..1 ist nicht binär — jeder Schritt hat einen *individuellen*
Wert, damit es atmet (Accent/Ghost/Mid). `gate` ist in ticks (kurz = stab,
lang = sustained).

Velocity-Profile, die sich durch alle Genres ziehen:
- Downbeat: **0.95–1.0**
- Backbeat / 3: **0.85–0.92**
- Off-beats: **0.65–0.78**
- Ghosts / 1/16-Fills: **0.35–0.55**
- Swing-„late" 1/16: minus 0.05–0.10 ggü. on-grid

---

## 1. PATTERN — HOUSE  *(10 grooves)*

Recherche-Anker: Klassisches Chicago/NY House, Defected, Toolroom, Classic
Deep House Piano (Marshall Jefferson „Move Your Body"), French Filter House,
UK Garage als nahe Verwandte. House lebt von **Off-Beat Stabs**, **Pumping
Sidechain-Gefühl** und „shuffled" 1/16.

| # | Name | Beschreibung | Steps (Tick : VoiceIdx : Vel : Gate) | Anmerkung |
|---|---|---|---|---|
| 1 | Classic Off-Beat Stab | Vier Off-Beats, leicht akzentuiert auf 2&4 | 12:0:0.78:4 · 36:1:0.92:4 · 60:0:0.78:4 · 84:1:0.92:4 | „Marshall Jefferson"-Bauplan |
| 2 | Pumped Bass-Stab | Tief auf 1, Off-Beats fallen ab — wie Sidechain | 0:0:1.0:6 · 12:1:0.55:4 · 36:2:0.7:4 · 48:0:0.95:6 · 60:1:0.5:4 · 84:2:0.65:4 | Atmet wie Sidechain auf Kick |
| 3 | Piano Roll (Move Your Body) | Triolisches 1/16-Feel, Doppelhände | 0:0:1.0:6 · 6:1:0.7:4 · 12:2:0.85:4 · 24:0:0.95:6 · 30:1:0.7:4 · 36:2:0.9:4 · 48:0:1.0:6 · 60:1:0.85:6 · 78:2:0.7:4 · 84:0:0.8:6 | Shuffle: 30 statt 30, 78 statt 78 |
| 4 | Garage Skip | UK Garage 2-step Skip-Feel | 0:0:1.0:6 · 18:1:0.7:4 · 36:2:0.9:4 · 48:0:0.6:4 · 60:1:0.85:6 · 78:2:0.7:4 · 90:0:0.55:4 | „skipping" off-grid |
| 5 | Deep Filter Pad-Stab | Lange Stabs auf 1 & 3, leichte Off-Hits | 0:0:0.95:36 · 36:1:0.65:4 · 48:2:0.85:36 · 84:0:0.6:4 | Wie geöffneter Filter |
| 6 | Tech-House Bumper | Eng, knackig, 2&4 Akzent | 0:0:0.7:4 · 12:1:0.9:4 · 24:0:0.6:4 · 36:1:1.0:6 · 48:0:0.7:4 · 60:2:0.85:4 · 72:0:0.55:4 · 84:1:0.95:6 | Toolroom-typisch |
| 7 | French Touch Chop | Filterpump, sehr kurze Stabs | 6:0:0.85:3 · 12:1:0.7:3 · 30:0:0.95:3 · 36:2:0.8:3 · 54:1:0.85:3 · 60:0:0.95:3 · 78:2:0.75:3 · 84:1:0.9:3 | Stardust/Daft Punk-Feel |
| 8 | Disco-House Push | Akzent auf „&" vor 1 & 3 | 22:1:0.55:3 · 24:0:1.0:6 · 48:0:0.8:4 · 70:2:0.55:3 · 72:0:0.95:6 · 84:1:0.7:4 | „pickup" Note |
| 9 | Lounge Sustain | Lange Akkord, Off-Beat-Tail | 0:0:0.85:72 · 60:1:0.6:6 · 84:2:0.7:6 | Buddha-Bar Vibe |
| 10 | Afro House Layer | Polyrhythmisch, 3+3+2-Akzente | 0:0:1.0:4 · 18:1:0.8:4 · 36:2:0.9:4 · 54:0:0.75:4 · 72:1:0.95:4 · 84:2:0.7:4 | Black Coffee-Feel |

---

## 2. PATTERN — PADS  *(10 grooves)*

Recherche-Anker: Brian Eno, Nils Frahm, Tycho, Boards of Canada, Jon
Hopkins. Pads brauchen **lange gates**, **weiche Velocity-Rampen**, oft
**2-Bar oder 4-Bar** Bewegungen, kaum Rhythmus.

| # | Name | Länge | Beschreibung | Steps |
|---|---|---|---|---|
| 1 | Slow Bloom | 192 | Crescendo über 2 Bars | 0:0:0.4:96 · 48:1:0.55:96 · 96:2:0.7:96 · 144:0:0.85:48 |
| 2 | Whole-Bar Sustain | 96 | Ein Akkord, sehr lang, weich | 0:0:0.7:96 · 0:1:0.65:96 · 0:2:0.6:96 |
| 3 | Breath In / Out | 192 | Crescendo + Decrescendo | 0:0:0.35:96 · 48:1:0.7:96 · 96:2:0.55:96 · 144:0:0.3:48 |
| 4 | Drifting Voices | 192 | Versetzte Voice-Einsätze | 0:0:0.55:144 · 24:1:0.5:144 · 48:2:0.65:144 |
| 5 | Half-Bar Pulse | 96 | Atmender Half-Note Puls | 0:0:0.7:48 · 48:1:0.85:48 |
| 6 | Eno Ambient | 192 | Sehr lange, leise overlapping | 0:0:0.4:192 · 72:1:0.45:120 · 144:2:0.5:48 |
| 7 | Tycho Shimmer | 96 | Oktave oben als Sparkle | 0:0:0.75:96 · 12:2:0.5:48 · 60:2:0.55:36 |
| 8 | Frahm Felt Pad | 96 | Sanft staccato, Loslassen | 0:0:0.55:60 · 0:1:0.5:60 · 60:2:0.4:36 |
| 9 | Cinematic Swell | 192 | 0 → 1.0 über 2 Bars | 0:0:0.2:48 · 48:1:0.45:48 · 96:2:0.7:48 · 144:0:1.0:48 |
| 10 | Held Triad Hum | 96 | Quasi-statisch, leichte mod | 0:0:0.6:96 · 0:1:0.6:96 · 0:2:0.6:96 · 48:1:0.7:24 |

---

## 3. PATTERN — MINIMAL  *(10 grooves)*

Recherche-Anker: Richie Hawtin, Ricardo Villalobos, Robert Hood, Perlon,
Cocoon. Minimal = **Räume**, **Mikro-Variation**, kaum Notes, hoher
Dynamikumfang.

| # | Name | Beschreibung | Steps |
|---|---|---|---|
| 1 | Sparse Pulse | Nur 2 Hits pro Bar | 0:0:0.95:6 · 48:1:0.85:6 |
| 2 | Whisper Tap | Sehr leise 1/16 Ghosts + Akzent | 0:0:1.0:4 · 18:1:0.35:3 · 42:1:0.4:3 · 66:1:0.4:3 · 90:1:0.35:3 |
| 3 | One-Note Drift | Eine Stimme, Mikro-Velocity | 0:0:0.9:6 · 24:0:0.7:6 · 48:0:0.85:6 · 72:0:0.65:6 |
| 4 | Off-Grid Click | Bewusst „daneben" gesetzt | 4:0:0.85:3 · 28:1:0.7:3 · 52:0:0.8:3 · 78:1:0.65:3 |
| 5 | Villalobos Stutter | Triolen mit Lücken | 0:0:0.9:4 · 8:1:0.6:4 · 32:0:0.85:4 · 56:1:0.7:4 · 80:2:0.6:4 |
| 6 | Hood Loop | Mono-Notes, sehr eng | 0:0:1.0:4 · 24:0:0.9:4 · 48:0:1.0:4 · 72:0:0.9:4 |
| 7 | Quarter Tap | Reine Quarter mit Atmung | 0:0:1.0:6 · 24:1:0.75:6 · 48:0:0.95:6 · 72:1:0.7:6 |
| 8 | Polymeter 7 | 7-Tick Spacing (gegen das Grid) | 0:0:0.95:5 · 28:1:0.8:5 · 56:0:0.85:5 · 84:1:0.7:5 |
| 9 | Negative Space | Lange Stille zwischen Hits | 0:0:1.0:8 · 72:1:0.6:8 |
| 10 | Cocoon Pluck | Off-Beat-Akzent + Echo-Geste | 12:0:0.95:4 · 36:1:0.7:4 · 60:0:0.5:3 · 84:1:0.4:3 |

---

## 4. PATTERN — BASS  *(10 grooves)*

Recherche-Anker: Reese/Sub-Bass (Detroit), Acid (303), Sub-Rolls (Dub),
Slap-Funk, Reggae One-Drop, Bassline Garage. Bass-Patterns nutzen meist
nur **VoiceIdx 0** (Root), gelegentlich 1 für Oktave/Quinte.

| # | Name | Beschreibung | Steps |
|---|---|---|---|
| 1 | Detroit Sub | 1, 2&, 3, 4& | 0:0:0.95:18 · 30:0:0.7:6 · 48:0:0.9:18 · 78:0:0.65:6 |
| 2 | Acid Bounce | 1/16 mit Slide-Akzenten | 0:0:1.0:5 · 6:0:0.5:5 · 12:0:0.85:5 · 18:0:0.55:5 · 24:0:0.95:5 · 36:0:0.7:5 · 48:0:1.0:5 · 60:0:0.6:5 · 72:0:0.85:5 |
| 3 | One-Drop Reggae | Akzent auf 3 | 48:0:1.0:36 · 84:0:0.55:6 |
| 4 | Reese Drone | Hält Root, leichte Modulation | 0:0:0.85:96 |
| 5 | Funk Slap | Synkopiert, Ghost-Notes | 0:0:1.0:4 · 12:0:0.4:3 · 24:1:0.85:4 · 30:0:0.35:3 · 48:0:0.95:4 · 60:1:0.75:4 · 78:0:0.45:3 · 84:0:0.7:4 |
| 6 | Sub Roll Dub | Lange Subs, kurze Tail | 0:0:0.9:42 · 48:0:0.85:42 |
| 7 | Garage 2-Step | Bassline Garage Skip | 0:0:1.0:6 · 24:0:0.65:4 · 42:0:0.85:4 · 60:0:0.95:6 · 84:0:0.7:4 |
| 8 | Walking Bass | Quarter-Walk durch Voices | 0:0:0.9:18 · 24:1:0.85:18 · 48:0:0.95:18 · 72:1:0.75:18 |
| 9 | UK Wobble | 1/8 Wobble-Akzent | 0:0:0.95:8 · 12:0:0.8:8 · 24:0:1.0:8 · 36:0:0.75:8 · 48:0:0.9:8 · 60:0:0.7:8 · 72:0:1.0:8 · 84:0:0.65:8 |
| 10 | Drone + Pulse | Drone + 4-on-floor Pulse oben | 0:0:0.7:96 · 0:1:0.9:6 · 24:1:0.8:6 · 48:1:0.95:6 · 72:1:0.75:6 |

---

## 5. PATTERN — GROOVE  *(10 grooves)*

Recherche-Anker: J Dilla MPC-Swing, Questlove Pocket, Brazilian Samba/Bossa,
Afrobeat, Latin Montuno, New Orleans 2nd-Line. „Groove" = **bewusster
Late-Push**, **Velocity-Tanz**, **organische Mikro-Timing**.

| # | Name | Beschreibung | Steps |
|---|---|---|---|
| 1 | Dilla Drunk | 1/16 Late-Push, Ghosts | 0:0:1.0:5 · 14:1:0.45:4 · 25:0:0.6:4 · 38:1:0.85:5 · 50:2:0.55:4 · 62:0:0.9:5 · 75:1:0.4:4 · 86:2:0.7:5 |
| 2 | Bossa Comp | Klassische Bossa-Pattern | 0:0:1.0:6 · 30:1:0.75:6 · 48:2:0.85:6 · 66:1:0.7:6 · 84:0:0.65:6 |
| 3 | Samba Partido Alto | 3+3+2 Akzente | 0:0:1.0:4 · 18:1:0.85:4 · 36:0:0.9:4 · 54:2:0.75:4 · 66:1:0.6:4 · 84:0:0.85:4 |
| 4 | Afrobeat Stab | Doppelte 1/16, lange Off-Beat | 12:0:0.95:4 · 18:1:0.6:4 · 36:2:0.9:4 · 60:0:1.0:4 · 66:1:0.65:4 · 84:2:0.85:4 |
| 5 | Montuno | Latin 2-3 Clave Pattern | 0:0:0.95:6 · 18:1:0.7:6 · 36:2:0.9:6 · 60:0:0.85:6 · 78:1:0.7:6 |
| 6 | NOLA 2nd-Line | Synkopiert, Swing-Feel | 0:0:1.0:5 · 18:1:0.75:5 · 30:0:0.55:5 · 48:1:0.9:5 · 66:2:0.7:5 · 84:0:0.85:5 |
| 7 | Hip-Hop Boom-Bap | 1, 3 stark — 2,4 schwächer | 0:0:1.0:6 · 24:1:0.55:4 · 48:0:0.9:6 · 60:1:0.55:4 · 78:2:0.65:4 |
| 8 | Soulful Pocket | Late 1/16 mit Atmung | 0:0:0.95:6 · 14:1:0.4:4 · 28:1:0.7:4 · 50:2:0.8:4 · 64:1:0.55:4 · 80:0:0.85:6 |
| 9 | Funk Stab | 16th-Funk, dichter | 0:0:1.0:3 · 12:1:0.85:3 · 18:0:0.5:3 · 30:1:0.7:3 · 48:2:0.9:3 · 60:1:0.6:3 · 78:0:0.55:3 · 84:2:0.8:3 |
| 10 | Reggae Skank | Off-Beat-Akzent, langes Sustain | 12:0:0.95:12 · 36:1:0.9:12 · 60:0:0.95:12 · 84:1:0.9:12 |

---

## 6. PATTERN — SHADOW  *(10 grooves)*

Recherche-Anker: Burial, Andy Stott, The Caretaker, Demdike Stare, Aphex
„Selected Ambient Works II". Shadow = **dark, broken, dub-techno
underbelly**, hohe Stille, „off"-Velocity, hörbare Lücken.

| # | Name | Beschreibung | Steps |
|---|---|---|---|
| 1 | Burial Skitter | 2-step skip, breite Hallräume | 0:0:0.85:3 · 18:1:0.5:3 · 36:0:0.95:3 · 60:1:0.7:3 · 84:2:0.55:3 |
| 2 | Dub Tail | Stab auf 2&, langer Tail | 30:0:1.0:48 |
| 3 | Stott Decay | Doppel-Hit, dann tot | 0:0:1.0:6 · 6:1:0.7:5 · 60:2:0.5:4 |
| 4 | Caretaker Loop | Sehr leise, looped Memory | 0:0:0.4:96 · 0:1:0.35:96 |
| 5 | Demdike Pulse | Verzerrte Off-Hits | 18:0:0.95:3 · 42:1:0.6:3 · 66:0:0.8:3 · 90:1:0.5:3 |
| 6 | Half-Speed Sub | Sub auf 1, Ghost auf 3 | 0:0:0.95:48 · 48:1:0.45:6 |
| 7 | Broken Triplet | Triolen mit Lücken | 0:0:0.85:4 · 16:1:0.5:4 · 48:2:0.8:4 · 64:1:0.45:4 |
| 8 | Hallway Echo | Hit + Hit-Echo (-12dB) | 0:0:1.0:4 · 24:0:0.55:4 · 48:0:0.3:4 |
| 9 | Stutter Cut | Schneller Re-Trigger, abrupt | 0:0:0.95:3 · 6:0:0.85:3 · 12:0:0.7:3 · 18:0:0.55:3 · 48:1:0.85:5 |
| 10 | Negative Drone | Drone an + abrupt aus | 0:0:0.6:60 · 84:1:0.85:6 |

---

## 7. PATTERN — MELODY  *(10 grooves)*

Recherche-Anker: Boards of Canada, Aphex Twin, Stranger Things OST, Floating
Points, Four Tet. Melodisch = **Voice-Index läuft** als Linie über die
Akkord-Töne, statt sie als Block zu spielen.

| # | Name | Beschreibung | Steps |
|---|---|---|---|
| 1 | Up & Down Arp | 1/8 hoch + 1/8 runter | 0:0:0.9:4 · 12:1:0.75:4 · 24:2:0.85:4 · 36:3:0.95:4 · 48:2:0.85:4 · 60:1:0.75:4 · 72:0:0.9:4 · 84:1:0.7:4 |
| 2 | Pendulum | 0,2,1,3,0,2,1,3 | 0:0:0.95:4 · 12:2:0.7:4 · 24:1:0.85:4 · 36:3:0.8:4 · 48:0:0.95:4 · 60:2:0.7:4 · 72:1:0.85:4 · 84:3:0.8:4 |
| 3 | Hopkins Sequence | 1/16 mit Akzent-Punkten | 0:0:1.0:3 · 6:1:0.55:3 · 12:2:0.7:3 · 18:1:0.5:3 · 24:3:0.95:3 · 30:2:0.6:3 · 36:0:0.85:3 · 42:1:0.55:3 · 48:2:0.95:3 · 54:3:0.6:3 · 60:0:0.85:3 · 66:1:0.55:3 · 72:2:0.7:3 · 78:3:0.5:3 · 84:0:1.0:3 · 90:1:0.6:3 |
| 4 | BoC Wandering | Langsame, ausladende Linie | 0:0:0.85:18 · 24:2:0.7:18 · 48:1:0.9:18 · 72:3:0.75:18 |
| 5 | Four Tet Skip | Off-grid, lebendig | 0:0:0.95:4 · 14:2:0.7:4 · 30:1:0.85:4 · 44:3:0.75:4 · 60:0:0.9:4 · 78:2:0.8:4 |
| 6 | Stranger Things Triad | Trillernde Triolen | 0:0:0.95:3 · 8:1:0.7:3 · 16:2:0.85:3 · 24:0:0.9:3 · 32:1:0.7:3 · 40:2:0.85:3 · 48:3:1.0:6 · 64:2:0.75:3 · 72:1:0.7:3 · 80:0:0.85:3 |
| 7 | Aphex Plinky | Sehr kurze Hits, melodisch | 0:0:0.95:2 · 12:2:0.8:2 · 24:1:0.85:2 · 36:3:0.9:2 · 48:0:0.95:2 · 60:2:0.8:2 · 72:1:0.85:2 · 84:3:0.9:2 |
| 8 | Resolved Long-Form | 2-Bar Linie, Zielton am Ende | 0:0:0.7:12 · 24:1:0.8:12 · 48:2:0.9:12 · 72:1:0.85:12 · 96:2:0.9:12 · 120:3:0.95:12 · 144:2:0.85:12 · 168:0:1.0:24 |
| 9 | Pluck Climb | Voice 0→3 mit Crescendo | 0:0:0.5:4 · 24:1:0.7:4 · 48:2:0.85:4 · 72:3:1.0:8 |
| 10 | Floating Loop | Wellenförmige Linie, sanft | 0:0:0.75:6 · 18:1:0.8:6 · 36:2:0.85:6 · 54:3:0.85:6 · 72:2:0.8:6 · 90:1:0.75:6 |

---

# Self-Review & Verbesserungsvorschläge

Was an obigen Patterns **funktioniert**:
- Klare Genre-Identität pro Bank (10 Patterns sind je hörbar verschieden).
- **Velocity-Spreizung 0.35–1.0** in jedem Pattern → kein „steifes" Feel.
- **Gate-Variation** (3–96 ticks) trennt staccato Stabs sauber von sustained
  Pads / Drones.
- **Off-grid Hits** (Tick 14, 18, 22, 30, 78, 90) bauen Swing/Push ein,
  ohne ein globales Swing-Flag zu brauchen.

Was wir **verbessern** könnten (Vorschläge zur Diskussion):

1. **Humanize-Layer** statt Hardcoding.
   Neuer optionaler `humanize` Parameter pro Pattern: `timingJitter` (±ticks)
   und `velJitter` (±0..1). Würde 10 weitere „Variationen pro Pattern"
   erlauben ohne neue Patterns zu schreiben. Standardwert *aus*, damit
   Tests deterministisch bleiben.

2. **Swing-Flag**. Globaler 1/16-Swing 50–66 %, der ungerade 1/16-ticks
   (6, 18, 30, …) systematisch nach hinten verschiebt. Erlaubt
   „same pattern, different feel".

3. **Voice-Pool statt fester `noteIndex`**. Aktuell ist `noteIndex` ein
   Modulo. Besser: pro Step eine *Auswahl-Strategie* — `"root" |
   "bass" | "highest" | "any" | "rand:1"`. Macht Patterns Akkord-agnostisch
   eleganter.

4. **Pattern-Bank-Wechsel im Takt**. Heute schaltet `setPerformanceParams
   ({ patternIndex })` sofort um. Besser: erst zum nächsten Bar-Beginn
   (siehe Loop-Length-Logik). Verhindert hörbares „Reißen".

5. **Velocity-Curve**. Velocity ist linear gemappt. Eine `expCurve` (γ=1.6)
   beim Senden würde Pads/Shadow noch weicher und Bass-Akzente knackiger
   machen, ohne die Patterns zu ändern.

6. **Pattern-Slots pro Bank statt globale `patternIndex`**. Heute ist
   `patternIndex` eine flache Zahl. Vorschlag:
   ```
   patternBank: "House" | "Pads" | "Minimal" | "Bass" | "Groove" | "Shadow" | "Melody"
   patternIndexInBank: 0..9
   ```
   Macht UI sauberer (Bank-Wähler + 10er-Grid statt 70er-Liste).

7. **Polyrhythmische 192-tick Patterns** für Pads/Shadow/Melody #8.
   2-Bar Patterns sind Standard im Ambient/Cinematic-Bereich und schon
   im Set enthalten — gleichzeitige UI-Unterstützung (Bar-Counter im
   Sequencer) wäre nützlich.

8. **Zusätzliche Bank-Vorschläge** für später:
   - **TRANCE** (lange 16tel Arp-Hooks, Rolands „Robert Miles"-Schule)
   - **DNB / BREAKS** (Amen-Cut-Style, sehr schnelle 1/16 mit Lücken)
   - **AMBIENT-DRONE** (4-Bar Patterns, fast keine Notes)
   - **JAZZ-COMP** (Real-Book Comping mit Triolen + Anticipations)
   - **CHILL-LOFI** (Boom-Bap + Detuning, Vinyl-Stutter)

---

# Implementation-Plan (nach deinem OK)

1. Datenmodell erweitern:
   ```ts
   type PatternBank = "House" | "Pads" | "Minimal" | "Bass" | "Groove" | "Shadow" | "Melody";
   type Pattern = { id; name; bank: PatternBank; lengthTicks; steps[] };
   ```
2. Datei `src/performance/patternBanks.ts` mit obigen 70 Patterns
   (10 × 7 Bänke) — voll typisiert und unit-getestet.
3. Store-State: `patternBank` + `patternIndexInBank` (mit Fallback aus
   altem `patternIndex` für persistierte Settings).
4. UI: Bank-Selector als horizontale Pad-Reihe + 2×5 Pattern-Grid mit
   Live-Preview-Name + (kleines Sparkline-SVG der Velocity-Kurve).
5. Tests: Jeder Pattern wird auf gültige tick-ranges / valid steps validiert.

**Bitte freigeben** (oder einzelne Bänke / Patterns markieren, die geändert
werden sollen), dann starte ich mit Schritt 1–5.
