import { createFileRoute } from "@tanstack/react-router";
import { MainScreen } from "@/ui/MainScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChordIT — MIDI Chord Generator & Performance Instrument" },
      {
        name: "description",
        content:
          "ChordIT turns a single keyboard note into expressive MIDI chords with voicing, key-mode, and 8 performance modes.",
      },
      { property: "og:title", content: "ChordIT" },
      {
        property: "og:description",
        content: "MIDI chord generator and performance instrument.",
      },
    ],
  }),
  component: MainScreen,
});
