import { describe, it, expect } from "vitest";
import { parseKey, resolveRoman, resolveRomans } from "./romanNumeralResolver";
import { progressionPresets } from "./progressionPresets";
import { expectedProgressionExamples } from "./expectedExamples";

const NOTE_PC: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
  "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

/** Parse a chord name like "Bbmaj9" or "F#m" → pitch class (only root). */
function chordRootPc(name: string): number {
  const m = name.match(/^([A-G][#b]?)/);
  if (!m) throw new Error(`Bad chord ${name}`);
  return NOTE_PC[m[1]];
}

describe("Roman numeral resolver — major key degrees (§18.1)", () => {
  const key = parseKey("C major");
  const cases: Array<[string, string, string]> = [
    ["I", "C", "Maj"],
    ["ii", "D", "Min"],
    ["iii", "E", "Min"],
    ["IV", "F", "Maj"],
    ["V", "G", "Maj"],
    ["vi", "A", "Min"],
    ["vii°", "B", "Dim"],
  ];
  for (const [roman, root, type] of cases) {
    it(`C major ${roman} → ${root} ${type}`, () => {
      const r = resolveRoman(roman, key);
      expect(r.rootPc).toBe(NOTE_PC[root]);
      expect(r.chordType).toBe(type);
    });
  }
});

describe("Roman numeral resolver — natural minor degrees (§18.2)", () => {
  const key = parseKey("A minor");
  const cases: Array<[string, string, string]> = [
    ["i", "A", "Min"],
    ["ii°", "B", "Dim"],
    ["III", "C", "Maj"],
    ["iv", "D", "Min"],
    ["v", "E", "Min"],
    ["VI", "F", "Maj"],
    ["VII", "G", "Maj"],
  ];
  for (const [roman, root, type] of cases) {
    it(`A minor ${roman} → ${root} ${type}`, () => {
      const r = resolveRoman(roman, key);
      expect(r.rootPc).toBe(NOTE_PC[root]);
      expect(r.chordType).toBe(type);
    });
  }
});

describe("Roman numeral resolver — preset example resolutions (§18.3)", () => {
  for (const fix of expectedProgressionExamples) {
    const preset = progressionPresets.find((p) => p.id === fix.id)!;
    it(`${preset.id} resolves to expected root pitch classes`, () => {
      const resolved = resolveRomans(preset.romanNumerals, fix.key, {
        avoidDiminished: false,
      });
      const expectedPcs = fix.expectedChords.map(chordRootPc);
      expect(resolved.map((r) => r.rootPc)).toEqual(expectedPcs);
    });
  }
});

describe("Roman numeral resolver — avoidDiminished (§18.4)", () => {
  const key = parseKey("C major");
  it("vii° → Dim by default", () => {
    expect(resolveRoman("vii°", key).chordType).toBe("Dim");
  });
  it("vii° → Sus2 substitute when avoidDiminished is on", () => {
    const r = resolveRoman("vii°", key, { avoidDiminished: true });
    expect(r.chordType).not.toBe("Dim");
    expect(r.substituted).toBe(true);
    expect(r.reason).toMatch(/diminished/i);
  });
});
