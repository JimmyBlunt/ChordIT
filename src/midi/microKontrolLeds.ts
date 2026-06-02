/**
 * Korg microKONTROL — Native KORG Mode LED control.
 *
 * Reference: microKONTROL MIDI Implementation Rev 1.0 (2003-07-18),
 * Section 3-2 (1) "Native KORG mode Display LEDs".
 *
 *   SysEx layout (Host -> Controller):
 *     F0 42 4g 6E 00 01 <ledNum> <state> F7
 *
 *     g        = Global MIDI channel (0..F)
 *     ledNum   = 0x00..0x0F  -> PAD 1..16
 *                0x10..0x1D  -> SETTING / MESSAGE / SCENE / EXIT / ENTER /
 *                               HEX / Tempo / >Grn / <Grn / >Red / <Red
 *     state    = ee t-tttt
 *                ee  = 0 Off, 1 On, 2 OneShot, 3 Blink
 *                ttttt = OneShot timer in 9 ms units
 *
 * In Native KORG mode the controller no longer manages pad LEDs locally — the
 * host owns them entirely. This module is the single source of truth for that
 * outbound traffic.
 */

import type { ChordExtension, ChordType } from "../chord/chordTypes";

export const CHORD_TYPE_ORDER: ChordType[] = ["Dim", "Min", "Maj", "Sus"];
export const EXTENSION_ORDER: ChordExtension[] = ["6", "m7", "M7", "9"];

/** Default pad assignments (user request: lower two pad rows = pads 9..16). */
export const DEFAULT_CHORD_PADS: Record<ChordType, number> = {
  Dim: 9,
  Min: 10,
  Maj: 11,
  Sus: 12,
};
export const DEFAULT_EXTENSION_PADS: Record<ChordExtension, number> = {
  "6": 13,
  m7: 14,
  M7: 15,
  "9": 16,
};

export type LedState = "off" | "on" | "blink";

/** Build the 9-byte Display LED SysEx for one pad (1..16). */
export function padLedSysex(
  globalChannel: number,
  padNumber1to16: number,
  state: LedState,
): number[] {
  if (padNumber1to16 < 1 || padNumber1to16 > 16) {
    throw new Error(`pad must be 1..16, got ${padNumber1to16}`);
  }
  const g = globalChannel & 0x0f;
  const ledNum = (padNumber1to16 - 1) & 0x7f;
  const stateByte =
    state === "off" ? 0x00 : state === "on" ? 0x20 : /* blink */ 0x60;
  return [0xf0, 0x42, 0x40 | g, 0x6e, 0x00, 0x01, ledNum, stateByte, 0xf7];
}

/**
 * Pure: compute the desired pad LED states for the lower two rows
 * given the current chord type and active extensions.
 */
export function computeChordRowLedStates(
  chordType: ChordType,
  activeExtensions: ChordExtension[],
  pads: {
    chord?: Record<ChordType, number>;
    extension?: Record<ChordExtension, number>;
  } = {},
): Map<number, LedState> {
  const chordPads = pads.chord ?? DEFAULT_CHORD_PADS;
  const extPads = pads.extension ?? DEFAULT_EXTENSION_PADS;
  const out = new Map<number, LedState>();

  for (const t of CHORD_TYPE_ORDER) {
    out.set(chordPads[t], t === chordType ? "on" : "off");
  }
  for (const e of EXTENSION_ORDER) {
    out.set(extPads[e], activeExtensions.includes(e) ? "on" : "off");
  }
  return out;
}

/**
 * Native KORG Mode In Request (Host -> Controller).
 * Reference: microKONTROL MIDI Implementation, Section 3 (15).
 *   F0 42 4g 6E 00 00 00 01 F7
 * Sending this puts the controller into Native KORG mode, which is required
 * for the Display LED SysEx (Section 3 (15)/(16)) to take effect.
 */
export function nativeModeInRequestSysex(globalChannel = 0): number[] {
  const g = globalChannel & 0x0f;
  return [0xf0, 0x42, 0x40 | g, 0x6e, 0x00, 0x00, 0x00, 0x01, 0xf7];
}

/** Native KORG Mode Out Request — returns the controller to normal MIDI mode. */
export function nativeModeOutRequestSysex(globalChannel = 0): number[] {
  const g = globalChannel & 0x0f;
  return [0xf0, 0x42, 0x40 | g, 0x6e, 0x00, 0x00, 0x00, 0x00, 0xf7];
}

/**
 * Diff two LED-state maps and return only pads whose state changed.
 * Used by the runtime sync to avoid flooding the controller with SysEx.
 */
export function diffLedStates(
  prev: Map<number, LedState>,
  next: Map<number, LedState>,
): Array<{ pad: number; state: LedState }> {
  const changes: Array<{ pad: number; state: LedState }> = [];
  for (const [pad, state] of next) {
    if (prev.get(pad) !== state) changes.push({ pad, state });
  }
  return changes;
}
