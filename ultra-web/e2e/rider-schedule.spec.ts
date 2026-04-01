import { expect, test } from "@playwright/test";

test.describe("US01/US02 — schedule a ride", () => {
  test("schedule page loads with addresses", async ({ page }) => {
    await page.goto("/book/schedule");

    await expect(page.getByText("742 Elm St")).toBeVisible();
    await expect(page.getByText("Metro General Hospital")).toBeVisible();
  });

  test("date and time inputs are present", async ({ page }) => {
    await page.goto("/book/schedule");

    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="time"]')).toBeVisible();
  });

  test("recurring toggle reveals day selectors", async ({ page }) => {
    await page.goto("/book/schedule");

    await page.getByRole("button", { name: /recurring/i }).click();
    await expect(page.getByRole("button", { name: "M", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "F", exact: true })).toBeVisible();
  });

  test("fare estimate is shown", async ({ page }) => {
    await page.goto("/book/schedule");

    await expect(page.getByText("$12.00")).toBeVisible();
  });

  test("confirm button is present", async ({ page }) => {
    await page.goto("/book/schedule");

    await expect(
      page.getByRole("button", { name: /confirm schedule/i })
    ).toBeVisible();
  });
});
