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
});
