import { describe, it, expect } from "vitest";
import {
  padLedSysex,
  computeChordRowLedStates,
  diffLedStates,
  DEFAULT_CHORD_PADS,
  DEFAULT_EXTENSION_PADS,
  nativeModeInRequestSysex,
} from "@/midi/microKontrolLeds";

describe("microKontrolLeds — SysEx builder", () => {
  it("encodes Native KORG mode in request (9 bytes)", () => {
    expect(nativeModeInRequestSysex(0)).toEqual([
      0xf0, 0x42, 0x40, 0x6e, 0x08, 0x00, 0x00, 0x01, 0xf7,
    ]);
  });

  it("encodes ON for pad 11 on global channel 0 (Maj default)", () => {
    expect(padLedSysex(0, 11, "on")).toEqual([
      0xf0, 0x42, 0x40, 0x6e, 0x08, 0x01, 0x0a, 0x20, 0xf7,
    ]);
  });

  it("encodes OFF for pad 1 on channel 0", () => {
    expect(padLedSysex(0, 1, "off")).toEqual([
      0xf0, 0x42, 0x40, 0x6e, 0x08, 0x01, 0x00, 0x00, 0xf7,
    ]);
  });

  it("encodes BLINK for pad 16 on channel 5", () => {
    expect(padLedSysex(5, 16, "blink")).toEqual([
      0xf0, 0x42, 0x45, 0x6e, 0x08, 0x01, 0x0f, 0x60, 0xf7,
    ]);
  });

  it("rejects out-of-range pad numbers", () => {
    expect(() => padLedSysex(0, 0, "on")).toThrow();
    expect(() => padLedSysex(0, 17, "on")).toThrow();
  });
});

describe("microKontrolLeds — state computation", () => {
  it("turns on only the active chord-type pad and active extension pads", () => {
    const states = computeChordRowLedStates("Min", ["m7", "9"]);
    expect(states.get(DEFAULT_CHORD_PADS.Min)).toBe("on");
    expect(states.get(DEFAULT_CHORD_PADS.Maj)).toBe("off");
    expect(states.get(DEFAULT_EXTENSION_PADS.m7)).toBe("on");
    expect(states.get(DEFAULT_EXTENSION_PADS["9"])).toBe("on");
    expect(states.get(DEFAULT_EXTENSION_PADS["6"])).toBe("off");
    expect(states.get(DEFAULT_EXTENSION_PADS.M7)).toBe("off");
  });

  it("covers all 8 lower-row pads", () => {
    const states = computeChordRowLedStates("Maj", []);
    expect([...states.keys()].sort((a, b) => a - b)).toEqual([
      9, 10, 11, 12, 13, 14, 15, 16,
    ]);
  });
});

describe("microKontrolLeds — diff", () => {
  it("returns only changed pads", () => {
    const a = computeChordRowLedStates("Maj", []);
    const b = computeChordRowLedStates("Min", ["m7"]);
    const diff = diffLedStates(a, b);
    const padsChanged = diff.map((d) => d.pad).sort((x, y) => x - y);
    expect(padsChanged).toEqual([
      DEFAULT_CHORD_PADS.Maj,
      DEFAULT_CHORD_PADS.Min,
      DEFAULT_EXTENSION_PADS.m7,
    ].sort((x, y) => x - y));
  });

  it("returns empty array when nothing changed", () => {
    const a = computeChordRowLedStates("Maj", ["6"]);
    const b = computeChordRowLedStates("Maj", ["6"]);
    expect(diffLedStates(a, b)).toEqual([]);
  });
});
