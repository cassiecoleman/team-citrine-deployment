import { describe, expect, it } from "vitest";

import { getPlaywrightRuntimeConfig } from "@/lib/playwright-env";

describe("playwright env helpers", () => {
  it("targets a hosted base URL without starting a local dev server", () => {
    expect(
      getPlaywrightRuntimeConfig({
        PLAYWRIGHT_BASE_URL: "https://preview.ultra.example.com",
      }),
    ).toEqual({
      baseURL: "https://preview.ultra.example.com",
      webServerCommand: null,
      webServerUrl: null,
    });
  });

  it("falls back to localhost with a port-scoped dev server", () => {
    expect(
      getPlaywrightRuntimeConfig({
        PLAYWRIGHT_PORT: "4100",
      }),
    ).toEqual({
      baseURL: "http://localhost:4100",
      webServerCommand: "PORT=4100 npm run dev",
      webServerUrl: "http://localhost:4100",
    });
  });
});
