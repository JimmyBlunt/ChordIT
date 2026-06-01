import { describe, it, expect } from "vitest";
import { applyVoicingRecipe } from "./voicingRecipes";

const baseCtx = { rootMidiNote: 60, splitKey: 60, octaveBase: 60 };

describe("Voicing recipes (spec §19)", () => {
  it("Close — keeps span ≤ 12 when possible", () => {
    const out = applyVoicingRecipe("Close", [60, 64, 67, 72], baseCtx);
    expect(out).toEqual([...out].sort((a, b) => a - b));
    expect(new Set(out).size).toBe(out.length);
    expect(out[out.length - 1] - out[0]).toBeLessThanOrEqual(12);
  });

  it("Open — span >= input span", () => {
    const input = [60, 64, 67];
    const inSpan = input[input.length - 1] - input[0];
    const out = applyVoicingRecipe("Open", input, baseCtx);
    expect(out[out.length - 1] - out[0]).toBeGreaterThanOrEqual(inSpan);
    expect(out).toEqual([...out].sort((a, b) => a - b));
  });

  it("Smooth — reduces total movement vs naive root position", () => {
    const prev = [60, 64, 67];
    const candidate = [67, 71, 74]; // root-position G major up
    const smoothed = applyVoicingRecipe("Smooth", candidate, {
      ...baseCtx,
      previousChordNotes: prev,
    });
    const naiveDist = candidate.reduce(
      (s, n) => s + Math.min(...prev.map((p) => Math.abs(n - p))),
      0,
    );
    const smoothDist = smoothed.reduce(
      (s, n) => s + Math.min(...prev.map((p) => Math.abs(n - p))),
      0,
    );
    expect(smoothDist).toBeLessThanOrEqual(naiveDist);
  });

  it("BassLow — places bass at/below splitKey", () => {
    const out = applyVoicingRecipe("BassLow", [72, 76, 79], {
      ...baseCtx,
      splitKey: 60,
      rootMidiNote: 48,
    });
    expect(out[0]).toBeLessThanOrEqual(60);
    for (let i = 1; i < out.length; i++) expect(out[i]).toBeGreaterThan(out[0]);
  });

  it("PedalTop — keeps shared top pitch class", () => {
    const prev = [60, 64, 67, 72]; // top = C
    const newChord = [62, 65, 69, 72]; // contains C
    const out = applyVoicingRecipe("PedalTop", newChord, {
      ...baseCtx,
      previousChordNotes: prev,
    });
    expect(out[out.length - 1] % 12).toBe(72 % 12);
  });

  it("PedalBass — keeps shared bass pitch class", () => {
    const prev = [48, 64, 67, 72]; // bass C
    const newChord = [60, 64, 67];
    const out = applyVoicingRecipe("PedalBass", newChord, {
      ...baseCtx,
      previousChordNotes: prev,
    });
    expect(out[0] % 12).toBe(0);
  });

  it("TopLine — prefers nearer top note (77 over 84) given prev top 76", () => {
    const prev = [60, 64, 76];
    const candidates = [65, 69, 77]; // includes 77 (close) and would have 84 as far option
    const out = applyVoicingRecipe("TopLine", candidates, {
      ...baseCtx,
      previousChordNotes: prev,
    });
    expect(Math.abs(out[out.length - 1] - 76)).toBeLessThanOrEqual(2);
  });

  it("Drop2 — drops second-highest by 12", () => {
    const out = applyVoicingRecipe("Drop2", [60, 64, 67, 71], baseCtx);
    expect(out).toContain(55); // 67 - 12
    expect(out).toEqual([...out].sort((a, b) => a - b));
  });

  it("OctaveSpread — contains base + +12 copies", () => {
    const out = applyVoicingRecipe("OctaveSpread", [60, 64, 67], baseCtx);
    expect(out).toContain(60);
    expect(out).toContain(72);
    expect(out).toContain(76);
    expect(out).toContain(79);
  });

  it("NoDiminishedSubstitute — Dim → Sus2 on root", () => {
    const out = applyVoicingRecipe(
      "NoDiminishedSubstitute",
      [60, 63, 66], // Dim
      {
        ...baseCtx,
        avoidDiminished: true,
        chordIntervals: [0, 3, 6],
      },
    );
    expect(out).toEqual([60, 62, 67]);
  });
});
