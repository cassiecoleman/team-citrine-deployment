import { expect, test } from "@playwright/test";

test.describe("US17 — ride completion, tip, rate", () => {
  test("completion page shows fare breakdown", async ({ page }) => {
    await page.goto("/ride/test-ride-1/complete");

    await expect(page.getByText("Ride Complete!")).toBeVisible();
    await expect(page.getByText(/Total/)).toBeVisible();
  });

  test("star rating is present", async ({ page }) => {
    await page.goto("/ride/test-ride-1/complete");

    await expect(page.getByText(/rate your ride/i)).toBeVisible();
  });

  test("tip options are visible", async ({ page }) => {
    await page.goto("/ride/test-ride-1/complete");

    await expect(page.getByRole("button", { name: "$1" })).toBeVisible();
    await expect(page.getByRole("button", { name: "$2" })).toBeVisible();
    await expect(page.getByRole("button", { name: "$5" })).toBeVisible();
  });

  test("report an issue toggle works", async ({ page }) => {
    await page.goto("/ride/test-ride-1/complete");

    await page.getByRole("button", { name: /report an issue/i }).click();
    await expect(page.getByText("Unsafe driving")).toBeVisible();
    await expect(page.getByText("Submit Report")).toBeVisible();
  });

  test("done button links to home", async ({ page }) => {
    await page.goto("/ride/test-ride-1/complete");

    const doneLink = page.getByRole("link", { name: /done/i });
    await expect(doneLink).toBeVisible();
    await expect(doneLink).toHaveAttribute("href", "/");
  });
});
