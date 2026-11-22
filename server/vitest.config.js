import { defineConfig } from "vitest/config";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";

const migrations = await readD1Migrations("./migrations");

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.toml" },
      miniflare: {
        bindings: { ADMIN_TOKEN: "test-admin-token-123456", SESSION_SECRET: "test-session-secret-abcdefghijkl", TEST_MIGRATIONS: migrations },
      },
    }),
  ],
  test: { include: ["test/**/*.test.js"], setupFiles: ["./test/setup.js"], testTimeout: 30000 },
});
