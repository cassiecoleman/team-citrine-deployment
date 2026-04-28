import { expect, test } from "@playwright/test";
import {
  createMatchingRideFixture,
  createTestDriver,
  createTestRider,
  deleteRide,
  deleteTestUser,
  injectAuthenticatedSession,
  type TestUser,
} from "./helpers/auth";

test.describe("driver flows", () => {
  let driver: TestUser;

  test.beforeAll(async () => {
    driver = await createTestDriver("e2e-driver-flows", { name: "Marcus W." });
  });

  test.afterAll(async () => {
    if (driver?.userId) {
      await deleteTestUser(driver.userId);
    }
  });

  test("lets the driver toggle shift status and open the active trip", async ({
    context,
    page,
  }) => {
    await injectAuthenticatedSession(context, driver);
    await page.goto("/driver");

    await expect(page.getByText("Driver shift")).toBeVisible();
    await expect(page.getByText("Marcus W.")).toBeVisible();
    await expect(page.getByText("Trips today")).toBeVisible();
    await expect(
      page.getByText("Available for the next assignment"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Go Offline" }).click();

    await expect(
      page.getByText("Offline until the next dispatch window"),
    ).toBeVisible();

    await page.getByRole("link", { name: "Open active trip details" }).click();

    await expect(page).toHaveURL(/\/trip\/new-ride$/);
    await expect(page.getByText("En route to rider")).toBeVisible();
    await expect(page.getByText("Turn-by-turn map preview")).toBeVisible();
    await expect(
      page.getByText("0 of 3 arrival checks complete"),
    ).toBeVisible();
  });

  test("handles queue review, navigation, and pickup confirmation", async ({
    context,
    page,
  }) => {
    const rider = await createTestRider("e2e-driver-queue", { name: "Aisha R." });
    let rideId: string | undefined;

    try {
      rideId = await createMatchingRideFixture({
        riderUserId: rider.userId,
      });
      await injectAuthenticatedSession(context, driver);
      await page.goto("/queue");

      await expect(page).toHaveURL(/\/queue$/);
      await expect(
        page.getByRole("heading", { name: "Incoming assignment" }),
      ).toBeVisible();
      await expect(page.getByText("Offered fare", { exact: true })).toBeVisible();
      await expect(page.getByText("Standard ride")).toBeVisible();

      await page.getByRole("link", { name: "Accept Trip" }).click();

      await expect(page).toHaveURL(new RegExp(`/trip/${rideId}$`));
      await expect(page.getByText("Pickup pin ready")).toBeVisible();

      await page
        .getByRole("button", { name: "Hazards ready for curb pickup" })
        .click();
      await expect(
        page.getByText("1 of 3 arrival checks complete"),
      ).toBeVisible();

      await page
        .getByRole("link", { name: "Advance to pickup confirmation" })
        .click();

      await expect(page).toHaveURL(new RegExp(`/trip/${rideId}/pickup$`));
      await expect(page.getByText("At pickup pin")).toBeVisible();

      const confirmPickupButton = page.getByRole("button", {
        name: "Confirm Pickup",
      });
      await expect(confirmPickupButton).toBeDisabled();

      const firstCheck = page.getByRole("button", {
        name: /confirm the rider says the name on screen/i,
      });
      const secondCheck = page.getByRole("button", {
        name: /confirm curbside pickup matches the app pin/i,
      });

      await firstCheck.click();
      await expect(firstCheck).toHaveAttribute("aria-pressed", "true");

      await secondCheck.click();
      await expect(secondCheck).toHaveAttribute("aria-pressed", "true");

      await expect(confirmPickupButton).toBeEnabled();
      await confirmPickupButton.click();

      await expect(page.getByText("Pickup confirmed")).toBeVisible();
      await page.getByRole("link", { name: "Return to Shift Board" }).click();

      await expect(page).toHaveURL(/\/driver$/);
    } finally {
      if (rideId) {
        await deleteRide(rideId);
      }
      await deleteTestUser(rider.userId);
    }
  });
});
