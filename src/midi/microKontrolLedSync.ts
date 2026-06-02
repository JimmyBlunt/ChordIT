/**
 * Runtime LED sync — subscribes to the chord/extension store and pushes
 * Display LED SysEx to the active MIDI output whenever the state changes.
 *
 * Requires the microKONTROL to be in Native KORG mode (see
 * /mnt/documents/microkontrol-led-patch.md for the install procedure).
 */
import { useChorditStore } from "../app/store";
import { midiBridge } from "./midiBridge";
import {
  computeChordRowLedStates,
  diffLedStates,
  padLedSysex,
  type LedState,
} from "./microKontrolLeds";

let started = false;
let unsub: (() => void) | null = null;
let lastStates: Map<number, LedState> = new Map();

/** Send the full lower-row LED snapshot (used on connect / scene change). */
export function pushAllLeds(channel: number) {
  const s = useChorditStore.getState();
  const next = computeChordRowLedStates(s.selectedChordType, s.activeExtensions);
  for (const [pad, state] of next) {
    midiBridge.sendSysEx(padLedSysex(channel, pad, state));
  }
  lastStates = next;
}

/** Idempotent global start. */
export function startMicroKontrolLedSync(channel = 0): () => void {
  if (started) return () => {};
  started = true;
  // Initial snapshot so the LEDs match the current state immediately.
  pushAllLeds(channel);

  unsub = useChorditStore.subscribe((s) => {
    const next = computeChordRowLedStates(s.selectedChordType, s.activeExtensions);
    const changes = diffLedStates(lastStates, next);
    for (const { pad, state } of changes) {
      midiBridge.sendSysEx(padLedSysex(channel, pad, state));
    }
    lastStates = next;
  });

  return () => {
    unsub?.();
    unsub = null;
    started = false;
  };
}
