/**
 * Runtime LED sync — subscribes to the chord/extension store and pushes
 * Display LED SysEx to the active MIDI output whenever the state changes.
 *
 * On start it runs the full Native-Mode init handshake (Native ON + 4 init
 * packets), exactly like the working Python reference (microkontrol_native_v4.py),
 * because Display-LED/LCD-Befehle erst nach diesem Handshake akzeptiert werden.
 */
import { useChorditStore } from "../app/store";
import { midiBridge } from "./midiBridge";
import {
  computeChordRowLedStates,
  diffLedStates,
  nativeModeInRequestSysex,
  nativeModeOutRequestSysex,
  packetInitSysex,
  padLedSysex,
  type LedState,
} from "./microKontrolLeds";

let started = false;
let unsub: (() => void) | null = null;
let lastStates: Map<number, LedState> = new Map();

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Sendet Native-Mode-On + 4-Packet-Init mit den gleichen Delays wie
 * das Python-Referenzscript (150ms / 250ms / 120ms zwischen Packets).
 * Rückgabe: true wenn alle Packets verschickt wurden.
 */
export async function runNativeModeInit(channel = 0): Promise<boolean> {
  let ok = midiBridge.sendSysEx(nativeModeInRequestSysex(channel));
  if (!ok) return false;
  await sleep(250);

  const packets = packetInitSysex(channel);
  for (const p of packets) {
    ok = midiBridge.sendSysEx(p) && ok;
    await sleep(120);
  }
  return ok;
}

/** Send the full lower-row LED snapshot (used on connect / scene change). */
export function pushAllLeds(channel: number) {
  const s = useChorditStore.getState();
  const next = computeChordRowLedStates(s.selectedChordType, s.activeExtensions);
  for (const [pad, state] of next) {
    midiBridge.sendSysEx(padLedSysex(channel, pad, state));
  }
  lastStates = next;
}

/** Sendet Native-Off — Controller fällt zurück in normalen MIDI-Mode. */
export function releaseNativeMode(channel = 0): boolean {
  return midiBridge.sendSysEx(nativeModeOutRequestSysex(channel));
}

/** Idempotent global start. Returns Promise that resolves once init is done. */
export async function startMicroKontrolLedSync(channel = 0): Promise<() => void> {
  if (started) return () => {};
  const ready = await runNativeModeInit(channel);
  if (!ready) return () => {};
  started = true;
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
