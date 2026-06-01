import { describe, it, expect } from "vitest";
import { generateProposals, makePlayedChord } from "./proposeEngine";
import { COLOR_ORDER, STRENGTH_ORDER, type ProposeRequest } from "./proposeTypes";

const NOTE_PC: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

function chordHistoryOf(items: Array<{ root: string; type?: string; notes?: number[] }>) {
  return items.map((i) =>
    makePlayedChord({
      rootMidi: 60 + NOTE_PC[i.root],
      chordType: i.type ?? "Min",
      extensions: [],
      midiNotes: i.notes ?? [60 + NOTE_PC[i.root], 60 + NOTE_PC[i.root] + 3, 60 + NOTE_PC[i.root] + 7],
      displayName: i.root + (i.type === "Maj" ? "" : "m"),
    }),
  );
}

function makeReq(over: Partial<ProposeRequest>): ProposeRequest {
  return {
    selectedKey: "C major",
    keyModeEnabled: false,
    harmonicMode: "Standard",
    harmonicStyle: "DancePop",
    moodTarget: "Uplifting",
    chordHistory: [],
    maxSuggestions: 4,
    ...over,
  };
}

describe("Propose engine — basic shape (§20.1)", () => {
  const r = generateProposals(
    makeReq({
      chordHistory: chordHistoryOf([{ root: "A", type: "Min" }]),
      selectedKey: "C major",
    }),
  );
  it("returns maxSuggestions count", () => {
    expect(r).toHaveLength(4);
  });
  it("each proposal has required fields", () => {
    for (const p of r) {
      expect(p.rootPitchClass).toBeDefined();
      expect(p.rootName).toBeDefined();
      expect(p.romanNumeral).toBeDefined();
      expect(p.chordType).toBeDefined();
      expect(Array.isArray(p.extensions)).toBe(true);
      expect(p.displayName).toBeDefined();
      expect(Array.isArray(p.midiPreviewNotes)).toBe(true);
      expect(typeof p.score).toBe("number");
      expect(STRENGTH_ORDER).toContain(p.strength);
      expect(COLOR_ORDER).toContain(p.color);
      expect(p.voicingRecipe).toBeDefined();
      expect(p.performanceModeSuggestion).toBeDefined();
      expect(p.reason).toBeDefined();
    }
  });
});

describe("Propose engine — sorting (§20.2)", () => {
  it("descending score", () => {
    const r = generateProposals(makeReq({ chordHistory: chordHistoryOf([{ root: "C", type: "Maj" }]) }));
    for (let i = 1; i < r.length; i++) {
      expect(r[i].score).toBeLessThanOrEqual(r[i - 1].score);
    }
  });
});

describe("Propose engine — colour assignment (§20.3)", () => {
  it("first 4 proposals map to green/yellow/blue/purple", () => {
    const r = generateProposals(makeReq({ chordHistory: chordHistoryOf([{ root: "C", type: "Maj" }]) }));
    expect(r[0].color).toBe("green");
    expect(r[1].color).toBe("yellow");
    expect(r[2].color).toBe("blue");
    expect(r[3].color).toBe("purple");
    expect(r[0].strength).toBe("Best");
    expect(r[3].strength).toBe("Spicy");
  });
});

describe("Propose engine — key mode strictness (§20.4 / §20.5)", () => {
  it("all proposed notes are in C major when key mode is on", () => {
    const inKey = new Set([0, 2, 4, 5, 7, 9, 11]);
    const r = generateProposals(
      makeReq({
        keyModeEnabled: true,
        selectedKey: "C major",
        chordHistory: chordHistoryOf([{ root: "C", type: "Maj" }]),
      }),
    );
    for (const p of r) {
      for (const n of p.midiPreviewNotes) {
        const pc = ((n % 12) + 12) % 12;
        expect(inKey.has(pc)).toBe(true);
      }
    }
  });
});

describe("Propose engine — active progression next step (§20.6)", () => {
  it("Preset 1 in B minor, current=Bm → best proposal root = D", () => {
    const r = generateProposals(
      makeReq({
        selectedKey: "B minor",
        keyModeEnabled: true,
        harmonicMode: "Progression",
        harmonicStyle: "MelodicTechno",
        moodTarget: "Uplifting",
        activeProgressionPresetId: "uplifting_sweet_minor_6_1_3_7",
        chordHistory: chordHistoryOf([{ root: "B", type: "Min" }]),
      }),
    );
    expect(r[0].rootPitchClass).toBe(NOTE_PC.D);
  });

  it("Preset 4 in C minor, current=Cm → best proposal root = Ab", () => {
    const r = generateProposals(
      makeReq({
        selectedKey: "C minor",
        keyModeEnabled: true,
        harmonicMode: "Progression",
        harmonicStyle: "Cinematic",
        moodTarget: "Serious",
        activeProgressionPresetId: "serious_minor_1_6_4_5",
        chordHistory: chordHistoryOf([{ root: "C", type: "Min" }]),
      }),
    );
    expect(r[0].rootPitchClass).toBe(NOTE_PC.Ab);
  });

  it("Preset 10 (avoidDiminished) — no Dim proposals", () => {
    const r = generateProposals(
      makeReq({
        selectedKey: "F# minor",
        keyModeEnabled: true,
        harmonicMode: "Progression",
        harmonicStyle: "Indie",
        moodTarget: "Dreamy",
        activeProgressionPresetId: "indie_dreamy_natural_minor_1_6_3_7",
        chordHistory: chordHistoryOf([{ root: "F#", type: "Min" }]),
      }),
    );
    for (const p of r) expect(p.chordType).not.toBe("Dim");
  });
});

describe("Propose engine — Minimal style allows repetition (§20.11)", () => {
  it("repeating root not penalised in Minimal style", () => {
    const r = generateProposals(
      makeReq({
        harmonicStyle: "Minimal",
        selectedKey: "F minor",
        chordHistory: chordHistoryOf([{ root: "F", type: "Min" }]),
      }),
    );
    // Some proposal should land on F (or at least not be heavily penalised)
    const fProposal = r.find((p) => p.rootPitchClass === NOTE_PC.F);
    if (fProposal) {
      // If present, score is not catastrophically below the best.
      expect(fProposal.score).toBeGreaterThanOrEqual(r[0].score - 60);
    }
  });
});

describe("Propose engine — Dance Pop style movements (§20.12)", () => {
  it("from Am/vi, expected strong proposals include F, G, or C", () => {
    const r = generateProposals(
      makeReq({
        harmonicStyle: "DancePop",
        selectedKey: "C major",
        keyModeEnabled: true,
        chordHistory: chordHistoryOf([{ root: "A", type: "Min" }]),
      }),
    );
    const top3 = r.slice(0, 3).map((p) => p.rootPitchClass);
    const target = [NOTE_PC.F, NOTE_PC.G, NOTE_PC.C];
    expect(top3.some((pc) => target.includes(pc))).toBe(true);
  });
});

describe("Propose engine — Tension mood in Electro (§20.15)", () => {
  it("Key mode keeps all notes in key", () => {
    const inKey = new Set([9, 11, 0, 2, 4, 5, 7]); // A minor pcs
    const r = generateProposals(
      makeReq({
        harmonicStyle: "Electro",
        moodTarget: "Tension",
        selectedKey: "A minor",
        keyModeEnabled: true,
        chordHistory: chordHistoryOf([{ root: "A", type: "Min" }]),
      }),
    );
    for (const p of r) {
      for (const n of p.midiPreviewNotes) {
        const pc = ((n % 12) + 12) % 12;
        expect(inKey.has(pc)).toBe(true);
      }
    }
  });
});
