import path from "path";
import { defineConfig } from "vitest/config";

// A minimal, self-contained test config. The app's vite.config.ts requires
// PORT/BASE_PATH env and loads UI-only plugins, none of which the pure game
// engine tests need, so we only mirror the "@" source alias here.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
