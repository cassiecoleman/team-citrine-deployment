import { defineConfig, devices } from "@playwright/test";
import { getPlaywrightRuntimeConfig } from "./src/lib/playwright-env";

const runtime = getPlaywrightRuntimeConfig();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: runtime.baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: runtime.webServerCommand
    ? {
        command: runtime.webServerCommand,
        url: runtime.webServerUrl!,
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
});
