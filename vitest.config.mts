import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolves the "@/..." alias from tsconfig.json
  resolve: { tsconfigPaths: true },
  test: {
    // Unit tests for pure server logic (pricing engine). Add jsdom per file when testing components.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
