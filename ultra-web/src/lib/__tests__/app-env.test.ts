import { describe, expect, it } from "vitest";

import {
  getAppOrigin,
  getDeploymentTarget,
  isExplicitLocalBypassEnabled,
} from "@/lib/app-env";

describe("app env helpers", () => {
  it("prefers NEXT_PUBLIC_APP_URL for hosted origins", () => {
    expect(
      getAppOrigin({
        NEXT_PUBLIC_APP_URL: "https://ultra.example.com",
      }),
    ).toBe("https://ultra.example.com");
  });

  it("falls back to localhost when no app origin is configured", () => {
    expect(getAppOrigin({})).toBe("http://localhost:3000");
  });

  it("treats Amplify non-production branches as preview deployments", () => {
    expect(
      getDeploymentTarget({
        NODE_ENV: "production",
        AWS_BRANCH: "feature/p6-amplify-ssr-deployment",
        AMPLIFY_PRODUCTION_BRANCH: "main",
      }),
    ).toBe("preview");
  });

  it("treats the configured production branch as production", () => {
    expect(
      getDeploymentTarget({
        NODE_ENV: "production",
        AWS_BRANCH: "main",
        AMPLIFY_PRODUCTION_BRANCH: "main",
      }),
    ).toBe("production");
  });

  it("only enables explicit bypasses for local development", () => {
    expect(
      isExplicitLocalBypassEnabled({
        NODE_ENV: "development",
        ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS: "true",
      }),
    ).toBe(true);

    expect(
      isExplicitLocalBypassEnabled({
        NODE_ENV: "production",
        AWS_BRANCH: "feature/p6-amplify-ssr-deployment",
        AMPLIFY_PRODUCTION_BRANCH: "main",
        ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS: "true",
      }),
    ).toBe(false);
  });
});
