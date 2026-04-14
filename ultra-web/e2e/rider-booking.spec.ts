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

  test("request ride submits booking and transitions to an active ride route", async ({
    page,
  }) => {
    await page.goto("/book");

    await page.getByRole("button", { name: /request ride/i }).click();
    await expect(page).toHaveURL(/\/ride\/.+/);
  });

  test("request ride reaches the matched driver view with driver details", async ({
    page,
  }) => {
    let statusPollCount = 0;
    await page.route("**/api/rides/*/status", async (route) => {
      statusPollCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "new-ride",
          status: statusPollCount === 1 ? "matching" : "driver_en_route",
        }),
      });
    });

    await page.goto("/book");

    await page.getByRole("button", { name: /request ride/i }).click();
    await expect(page).toHaveURL(/\/ride\/.+/);
    await expect(page.getByText("Driver En Route")).toBeVisible();
    await expect(page.getByText("Marcus W.")).toBeVisible();
    await expect(page.getByText("Toyota Camry")).toBeVisible();
    await expect(page.getByText("ULT-2026")).toBeVisible();
  });
});
