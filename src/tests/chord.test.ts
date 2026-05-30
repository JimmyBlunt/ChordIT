import { describe, expect, it } from "vitest";
import { buildChord } from "@/chord/chordEngine";
import { getChordDisplayString } from "@/chord/chordNotation";
import {
  ALL_CHORD_TYPES,
  ALL_EXTENSIONS,
  CHORD_TYPE_INTERVALS,
  EXTENSION_INTERVALS,
  type ChordExtension,
} from "@/chord/chordTypes";

function subsets<T>(arr: T[]): T[][] {
  const out: T[][] = [[]];
  for (const x of arr) {
    const len = out.length;
    for (let i = 0; i < len; i++) out.push([...out[i], x]);
  }
  return out;
}

describe("chord engine — all combinations", () => {
  const ROOT = 60; // C
  const allExtSubsets = subsets(ALL_EXTENSIONS);

  for (const type of ALL_CHORD_TYPES) {
    for (const exts of allExtSubsets) {
      it(`${type} + [${exts.join(",")}] builds correct chord`, () => {
        const notes = buildChord(ROOT, type, exts);
        // sorted ascending
        for (let i = 1; i < notes.length; i++) {
          expect(notes[i]).toBeGreaterThan(notes[i - 1]);
        }
        // no duplicates
        expect(new Set(notes).size).toBe(notes.length);
        // contains base intervals + extension intervals
        const expected = new Set([
          ...CHORD_TYPE_INTERVALS[type].map((i) => ROOT + i),
          ...exts.map((e) => ROOT + EXTENSION_INTERVALS[e]),
        ]);
        expect(new Set(notes)).toEqual(expected);
      });
    }
  }
});

describe("chord notation", () => {
  it("Maj alone is just root", () => {
    expect(getChordDisplayString(60, "Maj", [])).toBe("C");
  });
  it("Min is suffix m", () => {
    expect(getChordDisplayString(60, "Min", [])).toBe("Cm");
  });
  it("Sus is suffix sus", () => {
    expect(getChordDisplayString(60, "Sus", [])).toBe("Csus");
  });
  it("Dim is suffix dim", () => {
    expect(getChordDisplayString(60, "Dim", [])).toBe("Cdim");
  });
  it("dominant 7 special rule: Maj + m7 → C⁷", () => {
    expect(getChordDisplayString(60, "Maj", ["m7"])).toBe("C⁷");
  });
  it("Maj + M7 → Cᴹ⁷", () => {
    expect(getChordDisplayString(60, "Maj", ["M7"])).toBe("Cᴹ⁷");
  });
  it("Maj + 6 → C⁶", () => {
    expect(getChordDisplayString(60, "Maj", ["6"])).toBe("C⁶");
  });
  it("Maj + 9 → C⁹", () => {
    expect(getChordDisplayString(60, "Maj", ["9"])).toBe("C⁹");
  });
  it("three extensions → JAZZ", () => {
    expect(getChordDisplayString(60, "Maj", ["6", "M7", "9"])).toBe("Cᴶᴬᶻᶻ");
    expect(getChordDisplayString(60, "Min", ["6", "m7", "9"])).toBe("Cmᴶᴬᶻᶻ");
  });
  it("four extensions → WTF", () => {
    const all: ChordExtension[] = ["6", "m7", "M7", "9"];
    expect(getChordDisplayString(60, "Maj", all)).toBe("Cᵂᵀᶠ");
    expect(getChordDisplayString(60, "Min", all)).toBe("Cmᵂᵀᶠ");
    expect(getChordDisplayString(60, "Sus", all)).toBe("Csusᵂᵀᶠ");
    expect(getChordDisplayString(60, "Dim", all)).toBe("Cdimᵂᵀᶠ");
  });
});
