/**
 * Snapshot fixture: expected chord roots for every progression preset's
 * `exampleKey` and `romanNumerals`. Used by the roman numeral resolver tests
 * and the integration tests. Enharmonic equivalents are normalised by
 * comparing pitch classes rather than exact spelling.
 */
export const expectedProgressionExamples = [
  { id: "uplifting_sweet_minor_6_1_3_7", key: "B minor", expectedChords: ["G", "Bm", "D", "A"] },
  { id: "groovy_funk_minor_1_3_4", key: "F# minor", expectedChords: ["F#m", "A", "B"] },
  { id: "ominous_minor_drone", key: "A minor", expectedChords: ["Am"] },
  { id: "serious_minor_1_6_4_5", key: "C minor", expectedChords: ["Cm", "Ab", "Fm", "Gm"] },
  { id: "pure_joy_major_6_4_1", key: "C major", expectedChords: ["Am", "F", "C"] },
  { id: "pop_funk_minor_1_7_3_4_6_7", key: "F minor", expectedChords: ["Fm", "Eb", "Ab", "Bbm", "Db", "Eb"] },
  { id: "happy_major_6_4_1_5", key: "Bb major", expectedChords: ["Gm", "Eb", "Bb", "F"] },
  { id: "sad_minor_1_5_6_4_coloured", key: "D minor", expectedChords: ["Dm", "Am7", "Bbmaj9", "Gm7"] },
  { id: "bittersweet_sad_minor_6_1_7", key: "F# minor", expectedChords: ["D", "F#m", "E"] },
  { id: "indie_dreamy_natural_minor_1_6_3_7", key: "F# minor", expectedChords: ["F#m", "D", "A", "E"] },
  { id: "sad_neutral_minor_1_7_6_7", key: "F minor", expectedChords: ["Fm", "Eb", "Db", "Eb"] },
  { id: "resolute_uplifting_minor_6_7_1_7", key: "F minor", expectedChords: ["Db", "Eb", "Fm", "Eb"] },
  { id: "melancholy_minor_1_3_5", key: "C minor", expectedChords: ["Cm", "Eb", "Gm"] },
  { id: "warm_love_stepdown_majorish", key: "Eb major / C minor context", expectedChords: ["Eb", "Dm", "Cm", "Ab"] },
  { id: "euphoric_minor_5_6_1_7", key: "A# minor", expectedChords: ["Fm", "F#", "A#m", "G#"] },
];
