/**
 * Maps ranked ChordProposals → keyboard highlight state.
 * Version 1: only the root pitch class is highlighted per proposal.
 */
import type { ChordProposal, ProposalColor, ProposalStrength } from "../propose/proposeTypes";

export type KeyboardProposalHighlight = {
  pitchClass: number;
  rootName: string;
  color: ProposalColor;
  strength: ProposalStrength;
  proposalId: string;
  displayName: string;
};

export function highlightsFromProposals(
  proposals: ChordProposal[],
): KeyboardProposalHighlight[] {
  return proposals.map((p, i) => ({
    pitchClass: p.rootPitchClass,
    rootName: p.rootName,
    color: p.color,
    strength: p.strength,
    proposalId: `${i}-${p.rootPitchClass}-${p.displayName}`,
    displayName: p.displayName,
  }));
}
