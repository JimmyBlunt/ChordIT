import { describe, it, expect } from "vitest";
import { generateProposals, makePlayedChord } from "../propose/proposeEngine";
import { buildElectronicChord } from "../electronic/electronicTypes";
import { highlightsFromProposals } from "../ui/keyboardProposalHighlights";
import type { ProposeRequest } from "../propose/proposeTypes";

const NOTE_PC: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, "F#": 6, G: 7, A: 9, B: 11, Ab: 8, Bb: 10, Eb: 3, Db: 1,
};

function base(over: Partial<ProposeRequest>): ProposeRequest {
  return {
    selectedKey: "B minor",
    keyModeEnabled: true,
    harmonicMode: "Progression",
    harmonicStyle: "MelodicTechno",
    moodTarget: "Uplifting",
    chordHistory: [],
    maxSuggestions: 4,
    ...over,
  };
}

describe("Integration: Progression + Propose (spec §22)", () => {
  it("§22.1 — Bm in B minor with Uplifting Sweet Minor → D is highlighted green", () => {
    const req = base({
      activeProgressionPresetId: "uplifting_sweet_minor_6_1_3_7",
      chordHistory: [
        makePlayedChord({
          rootMidi: 71,
          chordType: "Min",
          extensions: [],
          midiNotes: [71, 74, 78],
          displayName: "Bm",
        }),
      ],
    });
    const proposals = generateProposals(req);
    expect(proposals[0].rootPitchClass).toBe(NOTE_PC.D);
    const highlights = highlightsFromProposals(proposals);
    expect(highlights[0].color).toBe("green");
    expect(highlights[0].pitchClass).toBe(NOTE_PC.D);
  });

  it("§22.2 — chord history of G → Bm → D → best next is A", () => {
    const history = [
      makePlayedChord({
        rootMidi: 67, chordType: "Maj", extensions: [],
        midiNotes: [67, 71, 74], displayName: "G",
      }),
      makePlayedChord({
        rootMidi: 71, chordType: "Min", extensions: [],
        midiNotes: [71, 74, 78], displayName: "Bm",
      }),
      makePlayedChord({
        rootMidi: 74, chordType: "Maj", extensions: [],
        midiNotes: [74, 78, 81], displayName: "D",
      }),
    ];
    const proposals = generateProposals(
      base({
        activeProgressionPresetId: "uplifting_sweet_minor_6_1_3_7",
        chordHistory: history,
      }),
    );
    expect(history).toHaveLength(3);
    expect(proposals[0].rootPitchClass).toBe(NOTE_PC.A);
  });

  it("§22.3 — Electronic Mode: Min + Deep + Air on C produces [60,63,67,70,74]", () => {
    const notes = buildElectronicChord(60, "Min", ["Deep", "Air"]);
    expect(notes).toEqual([60, 63, 67, 70, 74]);
  });

  it("§22.4 — Euphoric preset suggests OctaveSpread voicing + arp-style performance", () => {
    const proposals = generateProposals(
      base({
        selectedKey: "A# minor",
        keyModeEnabled: false,
        activeProgressionPresetId: "euphoric_minor_5_6_1_7",
        moodTarget: "Euphoric",
        chordHistory: [
          makePlayedChord({
            rootMidi: 70, chordType: "Min", extensions: [],
            midiNotes: [70, 73, 77], displayName: "A#m",
          }),
        ],
      }),
    );
    const best = proposals[0];
    expect(best.voicingRecipe).toBe("OctaveSpread");
    expect(["Arpeggiate2Octaves", "Harp", "Pattern"]).toContain(best.performanceModeSuggestion);
  });

  it("§22.5 — Avoid Diminished: no Bdim proposal in C major when avoidDiminished is on", () => {
    const proposals = generateProposals(
      base({
        selectedKey: "C major",
        keyModeEnabled: true,
        harmonicStyle: "MelodicTechno",
        activeProgressionPresetId: "pure_joy_major_6_4_1",
        chordHistory: [
          makePlayedChord({
            rootMidi: 60, chordType: "Maj", extensions: [],
            midiNotes: [60, 64, 67], displayName: "C",
          }),
        ],
      }),
    );
    for (const p of proposals) {
      // No Dim chord type ever surfaces in electronic style + avoidDiminished preset.
      expect(p.chordType).not.toBe("Dim");
    }
  });
});
