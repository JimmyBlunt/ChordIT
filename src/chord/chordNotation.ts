import type { ChordExtension, ChordType } from "./chordTypes";
import { sortExtensions } from "./chordEngine";

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export function rootName(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

// Superscript glyphs for the extension marks.
const SUPER: Record<string, string> = {
  "6": "⁶",
  "7": "⁷",
  "9": "⁹",
  M: "ᴹ",
  m: "ᵐ",
  J: "ᴶ",
  A: "ᴬ",
  Z: "ᶻ",
  W: "ᵂ",
  T: "ᵀ",
  F: "ᶠ",
};

function toSuper(s: string): string {
  return s
    .split("")
    .map((c) => SUPER[c] ?? c)
    .join("");
}

const EXT_GLYPH: Record<ChordExtension, string> = {
  "6": toSuper("6"),
  m7: toSuper("m7"),
  M7: toSuper("M7"),
  "9": toSuper("9"),
};

function baseNotation(type: ChordType, root: string): string {
  switch (type) {
    case "Maj":
      return root;
    case "Min":
      return `${root}m`;
    case "Sus":
      return `${root}sus`;
    case "Dim":
      return `${root}dim`;
  }
}

/**
 * Render the chord display string per the ChordIT notation rules.
 */
export function getChordDisplayString(
  rootMidi: number,
  type: ChordType,
  extensions: ChordExtension[],
): string {
  const root = rootName(rootMidi);
  const exts = sortExtensions(extensions);
  const base = baseNotation(type, root);

  // Dominant 7 special rule: Maj + only m7 → C⁷ (not Cm7)
  if (type === "Maj" && exts.length === 1 && exts[0] === "m7") {
    return `${root}${toSuper("7")}`;
  }

  if (exts.length === 0) return base;
  if (exts.length === 3) return `${base}${toSuper("JAZZ")}`;
  if (exts.length === 4) return `${base}${toSuper("WTF")}`;

  return base + exts.map((e) => EXT_GLYPH[e]).join("");
}
