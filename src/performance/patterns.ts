export type PatternStep = {
  tickOffset: number; // 0..pattern.lengthTicks-1
  noteIndex: number; // index into active chord notes (modulo length)
  velocityScale: number; // 0..1
  gateLengthTicks: number;
};

export type Pattern = {
  id: string;
  name: string;
  lengthTicks: number; // total pattern length in ticks (24 ppqn => 1 beat = 24)
  steps: PatternStep[];
};

// 24 PPQN => 1 beat = 24 ticks, 1/8 = 12 ticks, 1/16 = 6 ticks, 1 bar (4/4) = 96 ticks
const STEP = (t: number, i: number, v = 1, g = 6): PatternStep => ({
  tickOffset: t,
  noteIndex: i,
  velocityScale: v,
  gateLengthTicks: g,
});

export const PATTERNS: Pattern[] = [
  {
    id: "four-on-floor",
    name: "Four on Floor",
    lengthTicks: 96,
    steps: [
      STEP(0, 0, 1.0),
      STEP(24, 1, 0.9),
      STEP(48, 2, 1.0),
      STEP(72, 1, 0.85),
    ],
  },
  {
    id: "off-beat",
    name: "Off Beat",
    lengthTicks: 96,
    steps: [STEP(12, 0, 0.9), STEP(36, 1, 0.9), STEP(60, 2, 0.9), STEP(84, 1, 0.9)],
  },
  {
    id: "16th-pulse",
    name: "16th Pulse",
    lengthTicks: 96,
    steps: Array.from({ length: 16 }, (_, i) =>
      STEP(i * 6, i % 3, i % 4 === 0 ? 1 : 0.6, 4),
    ),
  },
  {
    id: "syncopated",
    name: "Syncopated",
    lengthTicks: 96,
    steps: [
      STEP(0, 0, 1.0),
      STEP(18, 1, 0.7),
      STEP(36, 2, 0.9),
      STEP(54, 1, 0.7),
      STEP(72, 0, 0.95),
      STEP(90, 2, 0.6),
    ],
  },
  {
    id: "bossa",
    name: "Bossa",
    lengthTicks: 96,
    steps: [
      STEP(0, 0, 1.0),
      STEP(30, 1, 0.8),
      STEP(48, 2, 0.9),
      STEP(66, 1, 0.75),
      STEP(84, 0, 0.7),
    ],
  },
  {
    id: "house",
    name: "House Stab",
    lengthTicks: 96,
    steps: [STEP(12, 0, 1.0, 4), STEP(36, 1, 1.0, 4), STEP(60, 2, 1.0, 4), STEP(84, 1, 1.0, 4)],
  },
  {
    id: "triplet",
    name: "Triplet Roll",
    lengthTicks: 96,
    steps: Array.from({ length: 12 }, (_, i) => STEP(i * 8, i % 4, 0.8, 6)),
  },
  {
    id: "ambient",
    name: "Ambient Pulse",
    lengthTicks: 192,
    steps: [
      STEP(0, 0, 0.9, 48),
      STEP(48, 1, 0.7, 48),
      STEP(96, 2, 0.85, 48),
      STEP(144, 1, 0.7, 48),
    ],
  },
  {
    id: "double-time",
    name: "Double Time",
    lengthTicks: 48,
    steps: [STEP(0, 0, 1), STEP(12, 1, 0.8), STEP(24, 2, 1), STEP(36, 1, 0.8)],
  },
  {
    id: "trance-gate",
    name: "Trance Gate",
    lengthTicks: 96,
    steps: Array.from({ length: 8 }, (_, i) =>
      STEP(i * 12, i % 3, i % 2 === 0 ? 1 : 0.5, 8),
    ),
  },
  {
    id: "shuffle",
    name: "Shuffle",
    lengthTicks: 96,
    steps: [
      STEP(0, 0, 1),
      STEP(16, 1, 0.7),
      STEP(24, 2, 0.85),
      STEP(40, 1, 0.7),
      STEP(48, 0, 1),
      STEP(64, 1, 0.7),
      STEP(72, 2, 0.85),
      STEP(88, 1, 0.7),
    ],
  },
];
