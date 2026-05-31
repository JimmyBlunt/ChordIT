/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environmentMatchGlobs: [
      ["src/tests/**/*.tsx", "happy-dom"],
      ["src/tests/**/*.test.ts", "node"],
    ],
    include: ["src/tests/**/*.test.ts", "src/tests/**/*.test.tsx"],
  },
});
