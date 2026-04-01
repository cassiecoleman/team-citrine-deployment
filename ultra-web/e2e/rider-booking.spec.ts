import { expect, test } from "@playwright/test";

test.describe("US12 — request a ride", () => {
  test("booking page shows route and fare estimate", async ({ page }) => {
    await page.goto("/book");

    await expect(page.getByText("742 Elm St")).toBeVisible();
    await expect(page.getByText("Metro General Hospital")).toBeVisible();
    await expect(page.getByText("$19.00").first()).toBeVisible();
  });

  test("split fare button navigates to split flow", async ({ page }) => {
    await page.goto("/book");

    await page.getByText("Split Fare").click();
    await expect(page).toHaveURL("/book/split");
  });
});
