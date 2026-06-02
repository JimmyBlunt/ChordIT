# ChordIT · Test Report

_Generated 2026-05-30T22:57:41.518Z_

**Summary:** 10 / 10 PASS

> Live runner available in-app at `/tests`. Each test renders the same keyboard + timeline visuals below.

---

## T1 · Maj chord at C4  `PASS`

Root 60 + Maj → C-E-G

**Input (keys pressed):**

![T1_in](test_T1_in.svg)

**Output (notes sent):**

![T1_out](test_T1_out.svg)

---

## T2 · Am7 at A3  `PASS`

Root 57 + Min + m7 → A-C-E-G

**Input (keys pressed):**

![T2_in](test_T2_in.svg)

**Output (notes sent):**

![T2_out](test_T2_out.svg)

---

## T3 · Dsus9  `PASS`

Root 62 + Sus + 9

**Input (keys pressed):**

![T3_in](test_T3_in.svg)

**Output (notes sent):**

![T3_out](test_T3_out.svg)

---

## T4 · Voicing Split  `PASS`

C3 Maj in Split, splitKey=60

**Input (keys pressed):**

![T4_in](test_T4_in.svg)

**Output (notes sent):**

![T4_out](test_T4_out.svg)

---

## T5 · Key constrain C-major  `PASS`

CMaj in key C → unchanged

**Input (keys pressed):**

![T5_in](test_T5_in.svg)

**Output (notes sent):**

![T5_out](test_T5_out.svg)

---

## T6 · Performance · Off  `PASS`

Block-chord 3 simultaneous noteOns

**Input (keys pressed):**

![T6_in](test_T6_in.svg)

**Output (notes sent):**

![T6_out](test_T6_out.svg)

**Timeline:**

![T6_tl](test_T6_tl.svg)

---

## T7 · Performance · Strum 80ms  `PASS`

3 spaced noteOns

**Input (keys pressed):**

![T7_in](test_T7_in.svg)

**Output (notes sent):**

![T7_out](test_T7_out.svg)

**Timeline:**

![T7_tl](test_T7_tl.svg)

---

## T8 · Performance · Pattern Four-on-Floor  `PASS`

4 hits over 96 ticks (1 bar @120bpm)

**Input (keys pressed):**

![T8_in](test_T8_in.svg)

**Output (notes sent):**

![T8_out](test_T8_out.svg)

**Timeline:**

![T8_tl](test_T8_tl.svg)

---

## T9 · Loop Recorder roundtrip  `PASS`

Record 2 chord events, length 4 beats @120bpm = 2000ms

**Input (keys pressed):**

![T9_in](test_T9_in.svg)

**Output (notes sent):**

![T9_out](test_T9_out.svg)

**Timeline:**

![T9_tl](test_T9_tl.svg)

---

## T10 · Loop Length rotary  `PASS`

Rotary range 4..16 with 2s confirm

**Input (keys pressed):**

![T10_in](test_T10_in.svg)

**Output (notes sent):**

![T10_out](test_T10_out.svg)

_Implementiert in MockPanel: setLoopLengthPending → 2s Timer → setLoopLength._

---

## Loop & Record subsystem

- **LOOP button** toggles loop mode. While enabled, the **LOOP LEN** rotary adjusts pattern length (4–16 beats). After 2 s of no change, the new length is committed.
- **REC button** starts capture of chord triggers (root + chord type + extensions + timestamp). Pressing REC again stops capture and immediately starts loop playback at the configured length.
- Test T9 verifies the recorder: two captured events at t=0 and t≈600ms within a 2000ms / 4-beat / 120bpm loop.

## Mock Mode Hardware Panel

- Becomes visible on MAIN when MOCK MODE is ON in Settings.
- Exposes all 4 chord buttons, 4 extension buttons, 4 rotaries (PERFORM, VOICING, KEY, LOOP LEN), plus LOOP and REC buttons.
- 8 quick-play pads (C4..C5) trigger `playRoot` so the full pipeline can be exercised without external MIDI.

## MIDI Mapping Diagram

- Settings screen renders an SVG of the device chassis with every control as a labeled node.
- Assigned controls highlight in green and show `TYPE CH·NUM` underneath.
- Clicking a node starts LEARN (when Web MIDI is connected).

