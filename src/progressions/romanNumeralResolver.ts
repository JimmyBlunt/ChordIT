/**
 * Roman numeral → chord resolver for major and natural-minor keys.
 *
 * Outputs are returned with a canonical `rootPc` (pitch class 0-11) so tests
 * can compare regardless of enharmonic spelling. The pretty `rootName`/
 * `displayName` use sharps or flats based on a per-key accidental preference.
 */

const NOTE_TO_PC: Record<string, number> = {
  C: 0, "B#": 0, Cb: 11, B: 11, "C#": 1, Db: 1, D: 2,
  "D#": 3, Eb: 3, E: 4, Fb: 4, "E#": 5, F: 5, "F#": 6,
  Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10,
};

const PC_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const PC_FLAT  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const KEYS_PREFER_FLAT = new Set([
  "F major", "Bb major", "Eb major", "Ab major", "Db major", "Gb major",
  "D minor", "G minor", "C minor", "F minor", "Bb minor", "Eb minor",
]);

const MAJOR_DEGREE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_DEGREE_QUALITY = ["Maj", "Min", "Min", "Maj", "Maj", "Min", "Dim"] as const;

const MINOR_DEGREE_OFFSETS = [0, 2, 3, 5, 7, 8, 10];
const MINOR_DEGREE_QUALITY = ["Min", "Dim", "Maj", "Min", "Min", "Maj", "Maj"] as const;

const ROMAN_TO_DEGREE: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7,
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7,
};

export type ResolverChordType = "Maj" | "Min" | "Dim" | "Sus2" | "Sus4" | "Pow";

export type ResolvedChord = {
  rootPc: number;
  rootName: string;
  chordType: ResolverChordType;
  extensions: string[];
  displayName: string;
  substituted: boolean;
  reason?: string;
};

export type ParsedKey = {
  raw: string;
  rootPc: number;
  rootName: string;
  mode: "major" | "minor";
  preferFlat: boolean;
};

/** Parse a key string like "B minor", "Eb major", or "Eb major / C minor context". */
export function parseKey(keyStr: string): ParsedKey {
  // First "<root> major|minor" token wins. Special: drone preset "A minor".
  const m = keyStr.match(/([A-G][#b]?)\s+(major|minor)/i);
  const rootRaw = m ? m[1] : "C";
  const mode = (m ? m[2].toLowerCase() : "major") as "major" | "minor";
  const rootName = rootRaw[0].toUpperCase() + rootRaw.slice(1).toLowerCase();
  const pc = NOTE_TO_PC[rootName] ?? 0;
  const preferFlat = KEYS_PREFER_FLAT.has(`${rootName} ${mode}`);
  return { raw: keyStr, rootPc: pc, rootName, mode, preferFlat };
}

export function pcName(pc: number, preferFlat: boolean): string {
  const p = ((pc % 12) + 12) % 12;
  return (preferFlat ? PC_FLAT : PC_SHARP)[p];
}

function parseRomanCore(rn: string): { token: string; suffix: string; isDim: boolean } | null {
  // Special preset-14 token.
  if (rn === "vii_or_V_over_7") {
    return { token: "vii", suffix: "", isDim: false };
  }
  // Match leading roman letters: V, VI, VII, IV, III, II, I (and lowercase).
  const m = rn.match(/^(VII|VI|IV|III|II|I|vii|vi|iv|iii|ii|i|V|v)([°o]?)(.*)$/);
  if (!m) return null;
  return { token: m[1], suffix: m[3], isDim: m[2] === "°" || m[2] === "o" };
}

function parseExtensions(suffix: string, defaultQuality: ResolverChordType): {
  chordType: ResolverChordType;
  extensions: string[];
} {
  let chordType = defaultQuality;
  const extensions: string[] = [];
  if (!suffix) return { chordType, extensions };
  const s = suffix.trim();
  // maj7 / maj9 / Maj7 / M7
  if (/^(maj9|Maj9)$/.test(s)) return { chordType, extensions: ["M7", "9"] };
  if (/^(maj7|Maj7|M7)$/.test(s)) return { chordType, extensions: ["M7"] };
  if (/^(m7)$/.test(s)) {
    chordType = "Min";
    return { chordType, extensions: ["m7"] };
  }
  if (/^(m9)$/.test(s)) {
    chordType = "Min";
    return { chordType, extensions: ["m7", "9"] };
  }
  if (/^(add9|add2)$/.test(s)) return { chordType, extensions: ["9"] };
  if (/^9$/.test(s)) {
    // bare 9: dominant feel — m7 + 9
    return { chordType, extensions: ["m7", "9"] };
  }
  if (/^7$/.test(s)) {
    // bare 7 → minor seventh interval. On major root this becomes a dom7;
    // on minor root, a min7. ChordIT only carries the extension flag.
    return { chordType, extensions: ["m7"] };
  }
  if (/^6$/.test(s)) return { chordType, extensions: ["6"] };
  // Unknown suffix: ignore but keep chord type.
  return { chordType, extensions };
}

/** Resolve a single roman numeral against a parsed key. */
export function resolveRoman(
  roman: string,
  key: ParsedKey,
  opts: { avoidDiminished?: boolean } = {},
): ResolvedChord {
  const parsed = parseRomanCore(roman);
  if (!parsed) {
    return {
      rootPc: key.rootPc,
      rootName: key.rootName,
      chordType: "Maj",
      extensions: [],
      displayName: key.rootName,
      substituted: false,
      reason: "Unparsable roman numeral; defaulted to tonic major.",
    };
  }
  const degree = ROMAN_TO_DEGREE[parsed.token];
  const isLower = parsed.token === parsed.token.toLowerCase();
  const offsets =
    key.mode === "major" ? MAJOR_DEGREE_OFFSETS : MINOR_DEGREE_OFFSETS;
  const quals =
    key.mode === "major" ? MAJOR_DEGREE_QUALITY : MINOR_DEGREE_QUALITY;

  const rootPc = (key.rootPc + offsets[degree - 1]) % 12;
  let defaultQuality: ResolverChordType = quals[degree - 1];
  // Case override: explicit lowercase = minor, uppercase = major, ° = dim.
  if (parsed.isDim) defaultQuality = "Dim";
  else if (isLower && defaultQuality === "Maj") defaultQuality = "Min";
  else if (!isLower && defaultQuality === "Min") defaultQuality = "Maj";

  // Special preset-14 token: force minor seventh-degree even when major-key
  // diatonic would give diminished.
  if (roman === "vii_or_V_over_7") defaultQuality = "Min";

  const { chordType: typedChord, extensions } = parseExtensions(
    parsed.suffix,
    defaultQuality,
  );
  let chordType = typedChord;
  let substituted = false;
  let reason: string | undefined;

  if (chordType === "Dim" && opts.avoidDiminished) {
    chordType = "Sus2";
    substituted = true;
    reason =
      "Substituted diminished movement with Sus2 (avoidDiminished is on).";
  }

  const rootName = pcName(rootPc, key.preferFlat);
  const displayName = buildDisplayName(rootName, chordType, extensions);
  return { rootPc, rootName, chordType, extensions, displayName, substituted, reason };
}

function buildDisplayName(
  root: string,
  type: ResolverChordType,
  extensions: string[],
): string {
  let base = root;
  if (type === "Min") base = `${root}m`;
  else if (type === "Dim") base = `${root}dim`;
  else if (type === "Sus2") base = `${root}sus2`;
  else if (type === "Sus4") base = `${root}sus4`;
  else if (type === "Pow") base = `${root}5`;
  // Maj → just root
  const hasMaj7 = extensions.includes("M7");
  const has9 = extensions.includes("9");
  const hasM7 = extensions.includes("m7");
  const has6 = extensions.includes("6");
  if (hasMaj7 && has9) return `${base}maj9`;
  if (hasMaj7) return `${base}maj7`;
  if (hasM7 && has9) return `${base}9`;
  if (hasM7) return `${base}7`;
  if (has9) return `${base}add9`;
  if (has6) return `${base}6`;
  return base;
}

/** Resolve every roman numeral of a preset. */
export function resolveRomans(
  romans: string[],
  keyStr: string,
  opts: { avoidDiminished?: boolean } = {},
): ResolvedChord[] {
  const key = parseKey(keyStr);
  return romans.map((r) => resolveRoman(r, key, opts));
}
