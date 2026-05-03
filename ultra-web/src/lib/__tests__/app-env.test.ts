import { describe, expect, it } from "vitest";

import {
  getAppOrigin,
  getConfiguredDemoDriverUserId,
  getConfiguredDemoRideId,
  getConfiguredDemoUserId,
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

  it("only returns demo user ids when demo mode is enabled", () => {
    expect(
      getConfiguredDemoUserId({
        NODE_ENV: "production",
        AWS_BRANCH: "main",
        AMPLIFY_PRODUCTION_BRANCH: "main",
        ULTRA_DEFAULT_USER_ID: "rider-demo-1",
      }),
    ).toBe("rider-demo-1");

    expect(
      getConfiguredDemoUserId({
        NODE_ENV: "production",
        AWS_BRANCH: "main",
        AMPLIFY_PRODUCTION_BRANCH: "main",
        ULTRA_ENABLE_DEMO_MODE: "false",
        ULTRA_DEFAULT_USER_ID: "rider-demo-1",
      }),
    ).toBeNull();
  });

  it("prefers the configured driver demo id and falls back to the rider demo id", () => {
    expect(
      getConfiguredDemoDriverUserId({
        NODE_ENV: "production",
        AWS_BRANCH: "main",
        AMPLIFY_PRODUCTION_BRANCH: "main",
        ULTRA_DEFAULT_DRIVER_USER_ID: "driver-demo-1",
        ULTRA_DEFAULT_USER_ID: "rider-demo-1",
      }),
    ).toBe("driver-demo-1");

    expect(
      getConfiguredDemoDriverUserId({
        NODE_ENV: "production",
        AWS_BRANCH: "main",
        AMPLIFY_PRODUCTION_BRANCH: "main",
        ULTRA_DEFAULT_USER_ID: "rider-demo-1",
      }),
    ).toBe("rider-demo-1");
  });

  it("builds password reset redirects from the configured app origin", () => {
    expect(
      getPasswordResetRedirectUrl({
        NEXT_PUBLIC_APP_URL: "https://ultra.example.com/some/path",
      }),
    ).toBe("https://ultra.example.com/auth/reset-password");
  });
});
