import { describe, it, expect } from "vitest";
import { progressionPresets } from "./progressionPresets";
import { expectedProgressionExamples } from "./expectedExamples";

describe("Progression preset library (spec §17)", () => {
  it("contains exactly 15 presets", () => {
    expect(progressionPresets).toHaveLength(15);
  });

  it("all preset ids are unique", () => {
    const ids = progressionPresets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const p of progressionPresets) {
    it(`preset ${p.id} has all required fields`, () => {
      expect(p.id).toBeTruthy();
      expect(typeof p.number).toBe("number");
      expect(p.name).toBeTruthy();
      expect(p.scaleContext).toBeTruthy();
      expect(p.romanNumerals.length).toBeGreaterThan(0);
      expect(p.emotion).toBeTruthy();
      expect(p.exampleKey).toBeTruthy();
      expect(p.exampleChords.length).toBeGreaterThan(0);
      expect(p.preferredChordColours.length).toBeGreaterThan(0);
      expect(p.preferredVoicingRecipes.length).toBeGreaterThan(0);
      expect(p.preferredPerformanceModes.length).toBeGreaterThan(0);
      expect(p.preferredStyles.length).toBeGreaterThan(0);
      expect(p.notes).toBeTruthy();
    });
  }

  it("preset 1 — Uplifting Sweet Minor", () => {
    const p = progressionPresets.find((x) => x.id === "uplifting_sweet_minor_6_1_3_7")!;
    expect(p.scaleContext).toBe("minor");
    expect(p.romanNumerals).toEqual(["VI", "i", "III", "VII"]);
    expect(p.exampleKey).toBe("B minor");
    expect(p.exampleChords).toEqual(["G", "Bm", "D", "A"]);
    expect(p.emotion).toMatch(/uplifting/);
    expect(p.emotion).toMatch(/sweet/);
    expect(p.avoidDiminished).toBe(true);
  });

  it("preset 8 — Sad Minor With 7ths and 9ths", () => {
    const p = progressionPresets.find((x) => x.id === "sad_minor_1_5_6_4_coloured")!;
    expect(p.exampleKey).toBe("D minor");
    expect(p.exampleChords).toEqual(["Dm", "Am7", "Bbmaj9", "Gm7"]);
    expect(p.preferredChordColours).toContain("min7");
    expect(p.preferredChordColours).toContain("maj9");
  });

  it("preset 10 — Indie Dreamy Natural Minor avoids diminished", () => {
    const p = progressionPresets.find((x) => x.id === "indie_dreamy_natural_minor_1_6_3_7")!;
    expect(p.avoidDiminished).toBe(true);
    expect(p.notes.toLowerCase()).toMatch(/diminished/);
  });

  it("preset 15 — Euphoric Minor recipe + performance", () => {
    const p = progressionPresets.find((x) => x.id === "euphoric_minor_5_6_1_7")!;
    expect(p.preferredVoicingRecipes).toContain("OctaveSpread");
    expect(
      p.preferredPerformanceModes.includes("Arpeggiate2Octaves") ||
        p.preferredPerformanceModes.includes("Harp"),
    ).toBe(true);
  });

  it("every preset has a matching snapshot fixture", () => {
    for (const p of progressionPresets) {
      const fix = expectedProgressionExamples.find((e) => e.id === p.id);
      expect(fix).toBeDefined();
    }
  });
});
