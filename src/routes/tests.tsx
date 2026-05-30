import { createFileRoute } from "@tanstack/react-router";
import { TestsScreen } from "@/ui/TestsScreen";

export const Route = createFileRoute("/tests")({
  head: () => ({
    meta: [
      { title: "ChordIT · Tests" },
      { name: "description", content: "Live test runner with per-test keyboard and timeline visualization." },
      { property: "og:title", content: "ChordIT · Tests" },
      { property: "og:description", content: "In-app test suite with graphics for keys pressed and notes sent." },
    ],
  }),
  component: TestsScreen,
});
