import { expect, test } from "@playwright/test";

test.describe("US13-US16 — ride tracking", () => {
  test("ride page loads with matching screen", async ({ page }) => {
    await page.goto("/ride/test-ride-1");

    await expect(page.getByText("Finding your driver")).toBeVisible();
  });

  test("matching screen shows pickup and destination", async ({ page }) => {
    await page.goto("/ride/test-ride-1");

    await expect(page.getByText("742 Elm St")).toBeVisible();
    await expect(page.getByText("Metro General Hospital")).toBeVisible();
  });

  test("matching screen shows fare estimate", async ({ page }) => {
    await page.goto("/ride/test-ride-1");

    await expect(page.getByText("$19.00")).toBeVisible();
  });

  test("cancel button is visible during matching", async ({ page }) => {
    await page.goto("/ride/test-ride-1");

    await expect(
      page.getByRole("button", { name: /cancel/i })
    ).toBeVisible();
  });

  test("status updates live on the ride page", async ({ page }) => {
    await page.goto("/ride/test-ride-1");

    await expect(page.getByText("Finding your driver")).toBeVisible();
    await page.waitForFunction(() => {
      return Boolean((window as Window & { __ultraRideStatusListenerReady?: boolean }).__ultraRideStatusListenerReady);
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("ultra:ride-status-update", {
          detail: { rideId: "test-ride-1", status: "driver_en_route" },
        }),
      );
    });
    await expect(page.getByText("Driver En Route")).toBeVisible();

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("ultra:ride-status-update", {
          detail: { rideId: "test-ride-1", status: "arrived" },
        }),
      );
    });
    await expect(page.getByText("Your driver is here!")).toBeVisible();

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("ultra:ride-status-update", {
          detail: { rideId: "test-ride-1", status: "in_progress" },
        }),
      );
    });
    await expect(page.getByText("Ride In Progress")).toBeVisible();
  });

  test("driver location updates live on rider tracking cards", async ({ page }) => {
    await page.goto("/ride/test-ride-1");

    await expect(page.getByText("Finding your driver")).toBeVisible();
    await page.waitForFunction(() => {
      return Boolean((window as Window & { __ultraRideStatusListenerReady?: boolean }).__ultraRideStatusListenerReady);
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("ultra:ride-status-update", {
          detail: { rideId: "test-ride-1", status: "driver_en_route" },
        }),
      );
    });
    await expect(page.getByText("Driver En Route")).toBeVisible();
    await page.waitForFunction(() => {
      return Boolean((window as Window & { __ultraDriverLocationListenerReady?: boolean }).__ultraDriverLocationListenerReady);
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("ultra:driver-location-update", {
          detail: { driverId: "d1", lat: 35.1495, lng: -90.049, heading: 180 },
        }),
      );
    });

    await expect(page.getByText("Live location")).toBeVisible();
    await expect(page.getByText("35.1495, -90.0490")).toBeVisible();
  });
});
