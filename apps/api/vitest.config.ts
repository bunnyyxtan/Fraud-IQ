import { defineConfig } from "vitest/config";

// The api-server's workspace deps (e.g. @fraud-iq/db) publish their source via
// the "workspace" export condition, matching tsconfig.base.json's
// customConditions. Vitest must resolve the same condition to load the route
// module under test. Tests here exercise only pure validation helpers and never
// touch the database, so no live DATABASE_URL / connection is required.
export default defineConfig({
  resolve: {
    conditions: ["workspace"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // @fraud-iq/db throws at import time without DATABASE_URL and eagerly
    // constructs a pg Pool. A pg Pool does not open a connection until a query
    // runs, and these tests never query, so a placeholder keeps the import
    // hermetic. A real DATABASE_URL in the environment takes precedence.
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ?? "postgres://test:test@localhost:5432/test",
    },
  },
});
