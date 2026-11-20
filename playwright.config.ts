import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default defineConfig({
  testDir: "./e2e",
  outputDir: join(tmpdir(), "student-manager-playwright-results"),
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    locale: "en-US",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
  },
});
