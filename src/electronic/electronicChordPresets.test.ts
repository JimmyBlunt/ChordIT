import { describe, it, expect } from "vitest";
import {
  ELECTRONIC_CHORD_INTERVALS,
  COLOUR_PAD_TO_EXTENSION,
  COLOUR_PAD_INTERVAL,
  buildElectronicIntervals,
  buildElectronicChord,
} from "./electronicTypes";
import { electronicChordPresets } from "./electronicChordPresets";

describe("Electronic chord types (spec §16.1)", () => {
  it("Min outputs [0,3,7]", () => {
    expect(ELECTRONIC_CHORD_INTERVALS.Min).toEqual([0, 3, 7]);
  });
  it("Maj outputs [0,4,7]", () => {
    expect(ELECTRONIC_CHORD_INTERVALS.Maj).toEqual([0, 4, 7]);
  });
  it("Sus2 outputs [0,2,7]", () => {
    expect(ELECTRONIC_CHORD_INTERVALS.Sus2).toEqual([0, 2, 7]);
  });
  it("Sus4 outputs [0,5,7]", () => {
    expect(ELECTRONIC_CHORD_INTERVALS.Sus4).toEqual([0, 5, 7]);
  });
  it("Pow outputs [0,7]", () => {
    expect(ELECTRONIC_CHORD_INTERVALS.Pow).toEqual([0, 7]);
  });
  it("Dim outputs [0,3,6]", () => {
    expect(ELECTRONIC_CHORD_INTERVALS.Dim).toEqual([0, 3, 6]);
  });
});

describe("Colour pad mapping (spec §16.2)", () => {
  it("Deep → m7 / 10", () => {
    expect(COLOUR_PAD_TO_EXTENSION.Deep).toBe("m7");
    expect(COLOUR_PAD_INTERVAL.Deep).toBe(10);
  });
  it("Air → 9 / 14", () => {
    expect(COLOUR_PAD_TO_EXTENSION.Air).toBe("9");
    expect(COLOUR_PAD_INTERVAL.Air).toBe(14);
  });
  it("Warm → 6 / 9", () => {
    expect(COLOUR_PAD_TO_EXTENSION.Warm).toBe("6");
    expect(COLOUR_PAD_INTERVAL.Warm).toBe(9);
  });
  it("Dream → M7 / 11", () => {
    expect(COLOUR_PAD_TO_EXTENSION.Dream).toBe("M7");
    expect(COLOUR_PAD_INTERVAL.Dream).toBe(11);
  });
});

describe("Electronic chord presets (spec §16.3)", () => {
  it("all preset ids are unique", () => {
    const ids = electronicChordPresets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const p of electronicChordPresets) {
    it(`preset ${p.id} satisfies shape constraints`, () => {
      expect(p.name).not.toBe("");
      expect(p.intervals).toEqual([...p.intervals].sort((a, b) => a - b));
      expect(new Set(p.intervals).size).toBe(p.intervals.length);
      expect(p.bestFor.length).toBeGreaterThan(0);
      expect(p.moodTags.length).toBeGreaterThan(0);
      expect(p.description).not.toBe("");
    });
  }
});

describe("Electronic Mode generation (spec §16.4)", () => {
  const cases: Array<[string, number[]]> = [
    ["Min + Deep", buildElectronicIntervals("Min", ["Deep"])],
    ["Min + Air", buildElectronicIntervals("Min", ["Air"])],
    ["Min + Deep+Air", buildElectronicIntervals("Min", ["Deep", "Air"])],
    ["Maj + Deep", buildElectronicIntervals("Maj", ["Deep"])],
    ["Maj + Warm", buildElectronicIntervals("Maj", ["Warm"])],
    ["Maj + Dream", buildElectronicIntervals("Maj", ["Dream"])],
    ["Sus2 + Air", buildElectronicIntervals("Sus2", ["Air"])],
    ["Pow + Air", buildElectronicIntervals("Pow", ["Air"])],
  ];
  const expected: Record<string, number[]> = {
    "Min + Deep": [0, 3, 7, 10],
    "Min + Air": [0, 3, 7, 14],
    "Min + Deep+Air": [0, 3, 7, 10, 14],
    "Maj + Deep": [0, 4, 7, 10],
    "Maj + Warm": [0, 4, 7, 9],
    "Maj + Dream": [0, 4, 7, 11],
    "Sus2 + Air": [0, 2, 7, 14],
    "Pow + Air": [0, 7, 14],
  };
  for (const [label, actual] of cases) {
    it(label, () => expect(actual).toEqual(expected[label]));
  }

  it("buildElectronicChord transposes intervals by root", () => {
    expect(buildElectronicChord(60, "Min", ["Deep", "Air"])).toEqual([60, 63, 67, 70, 74]);
  });
});
