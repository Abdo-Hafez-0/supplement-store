import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Unit tests for pure server logic (pricing engine). Add jsdom per file when testing components.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
