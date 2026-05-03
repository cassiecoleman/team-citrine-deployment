import { describe, expect, it } from "vitest";

import {
  getAppOrigin,
  getConfiguredDemoRideId,
  getDeploymentTarget,
  getPasswordResetRedirectUrl,
  isDemoModeEnabled,
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

  it("treats hosted builds as demo mode by default", () => {
    expect(
      isDemoModeEnabled({
        NODE_ENV: "production",
        AWS_BRANCH: "main",
        AMPLIFY_PRODUCTION_BRANCH: "main",
      }),
    ).toBe(true);

    expect(
      isDemoModeEnabled({
        NODE_ENV: "development",
      }),
    ).toBe(false);
  });

  it("allows explicit bypasses for local development and deployed demo mode", () => {
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
    ).toBe(true);

    expect(
      isExplicitLocalBypassEnabled({
        NODE_ENV: "production",
        AWS_BRANCH: "main",
        AMPLIFY_PRODUCTION_BRANCH: "main",
        ULTRA_ENABLE_DEMO_MODE: "false",
        ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS: "true",
      }),
    ).toBe(false);
  });

  it("returns the configured demo ride id when present", () => {
    expect(
      getConfiguredDemoRideId({
        ULTRA_DEMO_RIDE_ID: "ride-seeded-demo-1",
      }),
    ).toBe("ride-seeded-demo-1");

    expect(getConfiguredDemoRideId({})).toBeNull();
  });

  it("builds password reset redirects from the configured app origin", () => {
    expect(
      getPasswordResetRedirectUrl({
        NEXT_PUBLIC_APP_URL: "https://ultra.example.com/some/path",
      }),
    ).toBe("https://ultra.example.com/auth/reset-password");
  });
});
