import { expect, test } from "@playwright/test";

test.describe("US05 — ride pass subscription", () => {
  test("passes page displays available plan cards", async ({ page }) => {
    await page.goto("/passes");

    await expect(page.getByText("Weekly Commute")).toBeVisible();
    await expect(page.getByText("5 rides/week").first()).toBeVisible();
    await expect(page.getByText("10 rides/week").first()).toBeVisible();
    await expect(page.getByText("$75.00").first()).toBeVisible();
    await expect(page.getByText("$140.00").first()).toBeVisible();
  });

  test("clicking a plan navigates to review page", async ({ page }) => {
    await page.goto("/passes");

    await page.getByText("Weekly Commute").click();
    await expect(page).toHaveURL(/\/passes\/review/);
  });

  test("active pass page shows pass details", async ({ page }) => {
    await page.goto("/passes/active");

    await expect(page.getByText(/active/i).first()).toBeVisible();
  });
});
