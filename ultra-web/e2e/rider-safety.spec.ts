import { expect, test } from "@playwright/test";

test.describe("US03 — trusted drivers", () => {
  test("trusted drivers page loads with driver list", async ({ page }) => {
    await page.goto("/safety/trusted-drivers");

    await expect(page.getByText("Maria S.")).toBeVisible();
    await expect(page.getByText("Carlos R.")).toBeVisible();
  });

  test("drivers show rating and verification", async ({ page }) => {
    await page.goto("/safety/trusted-drivers");

    await expect(page.getByText("4.9").first()).toBeVisible();
    await expect(page.getByText("142 rides").first()).toBeVisible();
    await expect(page.getByText(/Verified/).first()).toBeVisible();
  });

  test("add trusted driver button is present", async ({ page }) => {
    await page.goto("/safety/trusted-drivers");

    await expect(page.getByText("Add Trusted Driver")).toBeVisible();
  });
});

test.describe("US04 — safety sharing settings", () => {
  test("safety settings page loads with contacts", async ({ page }) => {
    await page.goto("/profile/safety");

    await expect(page.getByText("Emergency Contacts")).toBeVisible();
    await expect(page.getByText("Rosa M.")).toBeVisible();
    await expect(page.getByText("David M.")).toBeVisible();
  });

  test("trip sharing toggles are present", async ({ page }) => {
    await page.goto("/profile/safety");

    await expect(page.getByText("Live Trip Sharing")).toBeVisible();
    await expect(page.getByText(/auto-share all child rides/i)).toBeVisible();
    await expect(page.getByText(/include live map link/i)).toBeVisible();
    await expect(page.getByText(/notify on arrival/i)).toBeVisible();
  });
});

test.describe("US09 — notification preferences", () => {
  test("notification settings page loads", async ({ page }) => {
    await page.goto("/profile/notifications");

    await expect(page.getByText("SMS Alerts")).toBeVisible();
    await expect(page.getByText("+1 (555) 123-4567")).toBeVisible();
  });

  test("SMS event toggles are present", async ({ page }) => {
    await page.goto("/profile/notifications");

    await expect(page.getByText("Ride confirmed")).toBeVisible();
    await expect(page.getByText("Driver arrives")).toBeVisible();
    await expect(page.getByText("Trip ends")).toBeVisible();
    await expect(page.getByText("Trip cancelled")).toBeVisible();
  });

  test("in-app notification section is present", async ({ page }) => {
    await page.goto("/profile/notifications");

    await expect(page.getByText("In-App Notifications")).toBeVisible();
  });
});
