import { expect, test } from "@playwright/test";
import {
  createTestRider,
  deleteTestUser,
  injectAuthenticatedSession,
  seedChildProfiles,
  type TestUser,
} from "./helpers/auth";

test.describe("US10 — manage rider profiles", () => {
  let rider: TestUser;

  test.beforeAll(async () => {
    rider = await createTestRider("profile");
    await seedChildProfiles(rider.userId, [
      { name: "Emma", emergencyContactName: "Rosa M." },
      { name: "Lucas", emergencyContactName: "Rosa M." },
    ]);
  });

  test.afterAll(async () => {
    await deleteTestUser(rider.userId);
  });

  test("profile page shows parent account info", async ({ page }) => {
    await injectAuthenticatedSession(page.context(), rider);
    await page.goto("/profile");

    await expect(page.getByText("E2E Rider profile")).toBeVisible();
    await expect(page.getByText(rider.email)).toBeVisible();
  });

  test("child rider profiles are displayed", async ({ page }) => {
    await injectAuthenticatedSession(page.context(), rider);
    await page.goto("/profile");

    await expect(page.getByText("Emma")).toBeVisible();
    await expect(page.getByText("Lucas")).toBeVisible();
  });

  test("emergency contact shown on child cards", async ({ page }) => {
    await injectAuthenticatedSession(page.context(), rider);
    await page.goto("/profile");

    const rosaTexts = page.getByText("Rosa M.");
    await expect(rosaTexts.first()).toBeVisible();
  });

  test("add rider profile button is present", async ({ page }) => {
    await injectAuthenticatedSession(page.context(), rider);
    await page.goto("/profile");

    await expect(page.getByText("Add Rider Profile")).toBeVisible();
  });

  test("quick links navigate correctly", async ({ page }) => {
    await injectAuthenticatedSession(page.context(), rider);
    await page.goto("/profile");

    await expect(page.getByRole("link", { name: /safety settings/i })).toHaveAttribute("href", "/profile/safety");
    await expect(page.getByRole("link", { name: /notifications/i })).toHaveAttribute("href", "/profile/notifications");
  });
});
