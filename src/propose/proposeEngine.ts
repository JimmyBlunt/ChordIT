/**
 * Propose Engine — generates scored next-chord suggestions based on:
 *   - active key (with strict Key Mode filtering)
 *   - active progression preset (next-step boost)
 *   - harmonic style + mood (preferred movements and colours)
 *   - smooth voice-leading from chord history
 *
 * Output: ranked `ChordProposal[]` with strength + colour assignments
 * (Best/green, Good/yellow, Alternative/blue, Spicy/purple).
 */
import type { PerformanceMode } from "../chord/chordTypes";
import type { ProgressionPreset, VoicingRecipeName, MoodTarget, HarmonicStyle } from "../progressions/progressionTypes";
import { progressionPresets } from "../progressions/progressionPresets";
import { parseKey, resolveRomans, pcName, type ResolverChordType } from "../progressions/romanNumeralResolver";
import { STYLE_MOVEMENTS } from "./styleMovements";
import {
  COLOR_ORDER,
  STRENGTH_ORDER,
  scoringWeights,
  type ChordProposal,
  type PlayedChord,
  type ProposeRequest,
} from "./proposeTypes";

const MAJOR_PCS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_PCS = [0, 2, 3, 5, 7, 8, 10];
const MAJOR_QUAL: ResolverChordType[] = ["Maj", "Min", "Min", "Maj", "Maj", "Min", "Dim"];
const MINOR_QUAL: ResolverChordType[] = ["Min", "Dim", "Maj", "Min", "Min", "Maj", "Maj"];
const MAJOR_NUMERALS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const MINOR_NUMERALS = ["i", "ii°", "III", "iv", "v", "VI", "VII"];

type ColourProfile = {
  id: string;
  extensions: string[];
  /** Bias chord type: when set, override diatonic quality (e.g. "pow" → Pow). */
  forceType?: ResolverChordType;
  intervals: number[];
  moodAffinity?: MoodTarget[];
};

const COLOUR_PROFILES: ColourProfile[] = [
  { id: "triad", extensions: [], intervals: [0] },
  { id: "m7", extensions: ["m7"], intervals: [10], moodAffinity: ["Deep", "Dark", "Melancholic", "Groovy"] },
  { id: "M7", extensions: ["M7"], intervals: [11], moodAffinity: ["Dreamy", "Warm", "Love"] },
  { id: "add9", extensions: ["9"], intervals: [14], moodAffinity: ["Dreamy", "Uplifting", "Bittersweet", "Euphoric"] },
  { id: "m9", extensions: ["m7", "9"], intervals: [10, 14], moodAffinity: ["Deep", "Dreamy", "Melancholic"] },
  { id: "maj9", extensions: ["M7", "9"], intervals: [11, 14], moodAffinity: ["Dreamy", "Uplifting", "Warm"] },
  { id: "6", extensions: ["6"], intervals: [9], moodAffinity: ["Warm", "Resolved"] },
  { id: "sus2", extensions: [], forceType: "Sus2", intervals: [0], moodAffinity: ["Dreamy", "Minimal"] },
  { id: "pow", extensions: [], forceType: "Pow", intervals: [0], moodAffinity: ["Dark", "Minimal", "Tension"] },
];

const ELECTRONIC_STYLES = new Set<HarmonicStyle>([
  "Techno", "TechHouse", "Minimal", "Electro", "MelodicTechno", "DeepHouse",
]);

const COLOUR_ID_ALIASES: Record<string, string[]> = {
  triad: ["min", "maj", "simple", "warm", "pedal", "octave"],
  m7: ["m7", "min7", "dom7"],
  M7: ["M7", "maj7"],
  add9: ["add9", "9"],
  m9: ["min9", "m9"],
  maj9: ["maj9"],
  "6": ["6", "maj6"],
  sus2: ["sus2", "sus2add9"],
  pow: ["pow", "pow9", "dim7_tension"],
};

function colourIdMatches(profileId: string, prefStrings: string[]): boolean {
  const aliases = COLOUR_ID_ALIASES[profileId] ?? [profileId];
  return prefStrings.some((p) => aliases.includes(p));
}

function intervalsOf(type: ResolverChordType, extensions: string[]): number[] {
  const base: Record<ResolverChordType, number[]> = {
    Maj: [0, 4, 7],
    Min: [0, 3, 7],
    Dim: [0, 3, 6],
    Sus2: [0, 2, 7],
    Sus4: [0, 5, 7],
    Pow: [0, 7],
  };
  const extMap: Record<string, number> = { "6": 9, m7: 10, M7: 11, "9": 14 };
  const set = new Set<number>(base[type]);
  for (const e of extensions) {
    const v = extMap[e];
    if (v !== undefined) set.add(v);
  }
  return [...set].sort((a, b) => a - b);
}

function midiPreviewFor(rootPc: number, type: ResolverChordType, extensions: string[]): number[] {
  const base = 60 + rootPc; // root in octave 4
  return intervalsOf(type, extensions).map((i) => base + i);
}

function pcOf(n: number): number {
  return ((n % 12) + 12) % 12;
}

/** Normalise a key string: accept "C", "C major", "B minor", etc. */
function normaliseKey(keyStr: string): string {
  if (/\s+(major|minor)/i.test(keyStr)) return keyStr;
  return `${keyStr} major`;
}

function pickPerformance(
  preset: ProgressionPreset | undefined,
  mood: MoodTarget,
  style: HarmonicStyle,
): PerformanceMode {
  if (preset && preset.preferredPerformanceModes.length > 0) {
    return preset.preferredPerformanceModes[0];
  }
  if (mood === "Euphoric") return "Arpeggiate2Octaves";
  if (mood === "Uplifting" || mood === "Dreamy") return "Arpeggiate";
  if (mood === "Sad" || mood === "Melancholic") return "Strum";
  if (mood === "Groovy") return "Pattern";
  if (mood === "Dark" || mood === "Tension") return "Off";
  if (style === "Minimal") return "Pattern";
  if (style === "TechHouse" || style === "Techno") return "Pattern";
  return "Strum";
}

function pickVoicing(
  preset: ProgressionPreset | undefined,
  style: HarmonicStyle,
): VoicingRecipeName {
  if (preset && preset.preferredVoicingRecipes.length > 0) {
    return preset.preferredVoicingRecipes[0];
  }
  if (style === "Minimal" || style === "Techno") return "BassLow";
  if (style === "Electro") return "Open";
  return "Smooth";
}

export function generateProposals(req: ProposeRequest): ChordProposal[] {
  const keyStr = normaliseKey(req.selectedKey);
  const key = parseKey(keyStr);
  const scalePcs = key.mode === "major" ? MAJOR_PCS : MINOR_PCS;
  const quals = key.mode === "major" ? MAJOR_QUAL : MINOR_QUAL;
  const numerals = key.mode === "major" ? MAJOR_NUMERALS : MINOR_NUMERALS;
  const inKeyPcs = scalePcs.map((o) => (key.rootPc + o) % 12);

  const preset = req.activeProgressionPresetId
    ? progressionPresets.find((p) => p.id === req.activeProgressionPresetId)
    : undefined;
  const avoidDim = preset?.avoidDiminished ?? ELECTRONIC_STYLES.has(req.harmonicStyle);

  const resolvedPreset = preset
    ? resolveRomans(preset.romanNumerals, preset.exampleKey, { avoidDiminished: avoidDim })
    : [];

  const last = req.chordHistory[req.chordHistory.length - 1];
  const prev = req.chordHistory[req.chordHistory.length - 2];

  // Determine next step in preset cycle.
  let nextStepPc: number | undefined;
  let nextStepColours: string[] = preset?.preferredChordColours ?? [];
  if (preset && resolvedPreset.length > 0) {
    let curIdx = -1;
    if (last) {
      curIdx = resolvedPreset.findIndex((c) => c.rootPc === last.rootPitchClass);
    }
    if (curIdx === -1) curIdx = 0;
    const nextIdx = (curIdx + 1) % resolvedPreset.length;
    nextStepPc = resolvedPreset[nextIdx].rootPc;
  }

  const style = STYLE_MOVEMENTS[req.harmonicStyle];
  const preferredColours = [
    ...nextStepColours,
    ...style.preferredColours,
  ];

  type Candidate = {
    rootPc: number;
    chordType: ResolverChordType;
    extensions: string[];
    colourId: string;
    inKey: boolean;
    diatonicIdx: number; // 0-6 or -1
  };

  const candidates: Candidate[] = [];
  for (let pc = 0; pc < 12; pc++) {
    const idx = inKeyPcs.indexOf(pc);
    const inKey = idx !== -1;
    const diatonicQual: ResolverChordType = inKey ? quals[idx] : "Min";
    for (const profile of COLOUR_PROFILES) {
      let chordType: ResolverChordType = profile.forceType ?? diatonicQual;
      if (chordType === "Dim" && avoidDim) chordType = "Sus2";
      candidates.push({
        rootPc: pc,
        chordType,
        extensions: profile.extensions,
        colourId: profile.id,
        inKey,
        diatonicIdx: idx,
      });
    }
  }

  // Filter out out-of-key candidates entirely when Key Mode is enabled.
  const filtered = req.keyModeEnabled
    ? candidates.filter((c) => {
        if (!c.inKey) return false;
        const notes = intervalsOf(c.chordType, c.extensions).map((i) => c.rootPc + i);
        return notes.every((n) => inKeyPcs.includes(pcOf(n)));
      })
    : candidates;

  // Score.
  const scored = filtered.map((c) => {
    const profile = COLOUR_PROFILES.find((p) => p.id === c.colourId)!;
    let score = 0;
    const reasons: string[] = [];

    if (c.inKey) {
      score += scoringWeights.belongsToKey;
    } else {
      score += scoringWeights.outOfKeyPenalty;
    }

    if (nextStepPc !== undefined && c.rootPc === nextStepPc) {
      score += scoringWeights.matchesActiveProgressionNextStep;
      reasons.push("matches active progression's next step");
    }

    if (last) {
      const delta = ((c.rootPc - last.rootPitchClass) + 12) % 12;
      if (style.preferredDeltas.some((d) => ((d + 12) % 12) === delta)) {
        score += scoringWeights.matchesGenreMovement;
        reasons.push(`${req.harmonicStyle} root movement`);
      }

      // Voice leading: nearest chord-note distance sum (lower = better).
      const candNotes = intervalsOf(c.chordType, c.extensions).map((i) => 60 + c.rootPc + i);
      const distSum = candNotes.reduce(
        (s, n) =>
          s + Math.min(...last.midiNotes.map((p) => Math.min(Math.abs(n - p), Math.abs(n - p - 12), Math.abs(n - p + 12)))),
        0,
      ) / Math.max(1, candNotes.length);
      if (distSum < 3) {
        score += scoringWeights.smoothVoiceLeading;
        reasons.push("smooth voice leading");
      }

      // Common tones.
      const prevPcs = new Set(last.midiNotes.map(pcOf));
      const candPcs = candNotes.map(pcOf);
      const common = candPcs.filter((pc) => prevPcs.has(pc)).length;
      if (common >= 2) {
        score += scoringWeights.sharedCommonTones;
        reasons.push(`${common} common tones`);
      }

      // Bass movement.
      const bassDelta = Math.abs(((c.rootPc - last.rootPitchClass + 18) % 12) - 6);
      if (bassDelta <= 5) {
        score += scoringWeights.smallBassMovement;
      }

      // Repetition.
      if (c.rootPc === last.rootPitchClass) {
        if (req.harmonicStyle !== "Minimal") {
          score += scoringWeights.repeatedChordPenalty;
        }
      }
      if (
        prev &&
        c.rootPc === last.rootPitchClass &&
        last.rootPitchClass === prev.rootPitchClass &&
        req.harmonicStyle !== "Minimal"
      ) {
        score += scoringWeights.tooMuchRecentRepetitionPenalty;
      }
    }

    // Colour preference.
    if (colourIdMatches(c.colourId, preferredColours)) {
      score += scoringWeights.preferredChordColour;
      reasons.push("preferred chord colour");
    }

    // Mood match.
    if (profile.moodAffinity?.includes(req.moodTarget)) {
      score += scoringWeights.matchesMood;
      reasons.push(`mood: ${req.moodTarget}`);
    }

    // Dim in electronic style.
    if (c.chordType === "Dim" && ELECTRONIC_STYLES.has(req.harmonicStyle)) {
      score += scoringWeights.diminishedInElectronicPenalty;
    }

    // Jazzy in minimal: M7 colour in Minimal style.
    if (req.harmonicStyle === "Minimal" && c.extensions.includes("M7")) {
      score += scoringWeights.tooJazzyForMinimalPenalty;
    }

    // Tension mood gets a tiny boost for tritone / bII moves.
    if (req.moodTarget === "Tension" && last) {
      const delta = ((c.rootPc - last.rootPitchClass) + 12) % 12;
      if (delta === 6 || delta === 1) score += 10;
    }

    const romanIdx = c.diatonicIdx;
    const romanNumeral = romanIdx >= 0 ? numerals[romanIdx] : "—";
    const rootName = pcName(c.rootPc, key.preferFlat);
    const displayName = buildDisplay(rootName, c.chordType, c.extensions);
    const performanceModeSuggestion = pickPerformance(preset, req.moodTarget, req.harmonicStyle);
    const voicingRecipe = pickVoicing(preset, req.harmonicStyle);

    if (preset && preset.preferredPerformanceModes.length > 0) {
      score += scoringWeights.preferredPerformanceMode;
    }

    return {
      candidate: c,
      score,
      reasons,
      proposal: {
        rootPitchClass: c.rootPc,
        rootName,
        romanNumeral,
        chordType: c.chordType,
        extensions: c.extensions,
        displayName,
        midiPreviewNotes: midiPreviewFor(c.rootPc, c.chordType, c.extensions),
        score,
        strength: "Best",
        color: "green",
        voicingRecipe,
        performanceModeSuggestion,
        reason: reasons.length ? reasons.join("; ") : "fallback candidate",
      } as ChordProposal,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  // Deduplicate by (rootPc, displayName) — keep the highest-scored variant
  // per root so the user sees four distinct chord roots.
  const seenRoots = new Set<number>();
  const unique: typeof scored = [];
  for (const s of scored) {
    if (seenRoots.has(s.candidate.rootPc)) continue;
    seenRoots.add(s.candidate.rootPc);
    unique.push(s);
    if (unique.length >= req.maxSuggestions) break;
  }

  return unique.map((s, i) => ({
    ...s.proposal,
    score: s.score,
    strength: STRENGTH_ORDER[Math.min(i, STRENGTH_ORDER.length - 1)],
    color: COLOR_ORDER[Math.min(i, COLOR_ORDER.length - 1)],
  }));
}

function buildDisplay(root: string, type: ResolverChordType, exts: string[]): string {
  let base = root;
  if (type === "Min") base = `${root}m`;
  else if (type === "Dim") base = `${root}dim`;
  else if (type === "Sus2") base = `${root}sus2`;
  else if (type === "Sus4") base = `${root}sus4`;
  else if (type === "Pow") base = `${root}5`;
  const hasMaj7 = exts.includes("M7");
  const has9 = exts.includes("9");
  const hasM7 = exts.includes("m7");
  const has6 = exts.includes("6");
  if (hasMaj7 && has9) return `${base}maj9`;
  if (hasMaj7) return `${base}maj7`;
  if (hasM7 && has9) return `${base}9`;
  if (hasM7) return `${base}7`;
  if (has9) return `${base}add9`;
  if (has6) return `${base}6`;
  return base;
}

/** Build a PlayedChord record for the history. Helper for store integration. */
export function makePlayedChord(args: {
  rootMidi: number;
  chordType: string;
  extensions: string[];
  midiNotes: number[];
  displayName: string;
}): PlayedChord {
  return {
    rootMidiNote: args.rootMidi,
    rootPitchClass: pcOf(args.rootMidi),
    rootName: pcName(pcOf(args.rootMidi), false),
    chordType: args.chordType,
    extensions: args.extensions,
    midiNotes: args.midiNotes,
    displayName: args.displayName,
    timestamp: Date.now(),
  };
}
