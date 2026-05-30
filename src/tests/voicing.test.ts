import { describe, expect, it } from "vitest";
import { applyOctave, applySplit, voiceDown, voiceUp } from "@/voicing/voicingEngine";

describe("voicing engine", () => {
  it("voice up rotates lowest +12", () => {
    expect(voiceUp([60, 64, 67])).toEqual([64, 67, 72]);
  });
  it("voice down rotates highest -12", () => {
    expect(voiceDown([64, 67, 72])).toEqual([60, 64, 67]);
  });
  it("voice up is reverse of voice down", () => {
    const a = [60, 64, 67];
    expect(voiceDown(voiceUp(a))).toEqual(a);
  });

  it("split mode shifts notes below splitKey up an octave", () => {
    expect(applySplit([55, 60, 64], 60)).toEqual([60, 64, 67]);
  });
  it("split mode boundary: note equal to splitKey is unchanged", () => {
    expect(applySplit([60, 64, 67], 60)).toEqual([60, 64, 67]);
  });
  it("split mode boundary: splitKey-1 shifts up", () => {
    expect(applySplit([59], 60)).toEqual([71]);
  });

  it("octave mode folds notes into [base, base+11]", () => {
    expect(applyOctave([48, 60, 76], 60)).toEqual([60, 64, 72]);
    const out = applyOctave([0, 60, 100, 127], 60);
    for (const n of out) {
      expect(n).toBeGreaterThanOrEqual(60);
      expect(n).toBeLessThanOrEqual(71);
    }
  });
});
