import { createFileRoute } from "@tanstack/react-router";
import { SettingsScreen } from "@/ui/SettingsScreen";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "ChordIT · Settings" },
      { name: "description", content: "Configure MIDI input, output, mappings and engine parameters." },
      { property: "og:title", content: "ChordIT · Settings" },
      { property: "og:description", content: "Configure MIDI mappings, BPM, voicing and Key Mode." },
    ],
  }),
  component: SettingsScreen,
});
