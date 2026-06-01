import { describe, it, expect } from "vitest";
import { highlightsFromProposals } from "./keyboardProposalHighlights";
import { generateProposals, makePlayedChord } from "../propose/proposeEngine";
import type { ProposeRequest } from "../propose/proposeTypes";

function req(): ProposeRequest {
  return {
    selectedKey: "B minor",
    keyModeEnabled: true,
    harmonicMode: "Progression",
    harmonicStyle: "MelodicTechno",
    moodTarget: "Uplifting",
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
    maxSuggestions: 4,
  };
}

describe("Virtual Keyboard proposal highlights (spec §21)", () => {
  it("§21.1 — count matches proposals", () => {
    const proposals = generateProposals(req());
    const h = highlightsFromProposals(proposals);
    expect(h).toHaveLength(proposals.length);
  });

  it("§21.2 — colour ordering green/yellow/blue/purple", () => {
    const proposals = generateProposals(req());
    const h = highlightsFromProposals(proposals);
    expect(h[0].color).toBe("green");
    expect(h[1].color).toBe("yellow");
    expect(h[2].color).toBe("blue");
    expect(h[3].color).toBe("purple");
    expect(h[0].strength).toBe("Best");
    expect(h[3].strength).toBe("Spicy");
  });

  it("§21.3 — pitch class is preserved from proposal", () => {
    const proposals = generateProposals(req());
    const h = highlightsFromProposals(proposals);
    for (let i = 0; i < h.length; i++) {
      expect(h[i].pitchClass).toBe(proposals[i].rootPitchClass);
    }
  });

  it("§21.4 — key mode keeps highlights in scale", () => {
    const proposals = generateProposals(req()); // B minor → F# allowed, F not
    const inKey = new Set([11, 1, 2, 4, 6, 7, 9]); // B minor pcs
    const h = highlightsFromProposals(proposals);
    for (const x of h) expect(inKey.has(x.pitchClass)).toBe(true);
  });
});
