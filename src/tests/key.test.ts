import { describe, expect, it } from "vitest";
import { constrainToKey } from "@/key/keyModeEngine";
import { isInScale, majorScalePitchClasses } from "@/key/scales";
import { buildChord } from "@/chord/chordEngine";

describe("key mode", () => {
  it("C major has the right pitch classes", () => {
    expect(majorScalePitchClasses("C")).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it("diatonic input in C major stays diatonic", () => {
    // Maj triad on C, D, E (with snapping if needed)
    for (const root of [60, 62, 64]) {
      const chord = constrainToKey(buildChord(root, "Maj", []), "C");
      for (const n of chord) expect(isInScale(n, "C")).toBe(true);
    }
  });

  it("non-diatonic root snaps every output into the scale (C# in C major)", () => {
    const chord = constrainToKey(buildChord(61, "Maj", []), "C");
    for (const n of chord) expect(isInScale(n, "C")).toBe(true);
  });

  it("changing key changes the allowed pitch classes", () => {
    const cMaj = constrainToKey(buildChord(60, "Maj", []), "C");
    const gMaj = constrainToKey(buildChord(60, "Maj", []), "G");
    for (const n of cMaj) expect(isInScale(n, "C")).toBe(true);
    for (const n of gMaj) expect(isInScale(n, "G")).toBe(true);
  });
});
