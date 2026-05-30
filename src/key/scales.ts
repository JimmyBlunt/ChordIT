export type KeyName =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export const ALL_KEYS: KeyName[] = [
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

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

const KEY_TO_ROOT_PC: Record<KeyName, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

/** Returns the set of pitch classes (0-11) for a major key. */
export function majorScalePitchClasses(key: KeyName): number[] {
  const root = KEY_TO_ROOT_PC[key];
  return MAJOR_INTERVALS.map((i) => (root + i) % 12);
}

export function isInScale(midi: number, key: KeyName): boolean {
  const pc = ((midi % 12) + 12) % 12;
  return majorScalePitchClasses(key).includes(pc);
}
