import { expect, test } from "@playwright/test";

test.describe("US10 — manage rider profiles", () => {
  test("profile page shows parent account info", async ({ page }) => {
    await page.goto("/profile");

    await expect(page.getByText("Maria Johnson")).toBeVisible();
    await expect(page.getByText("maria@email.com")).toBeVisible();
  });

  test("child rider profiles are displayed", async ({ page }) => {
    await page.goto("/profile");

    await expect(page.getByText("Emma, 9")).toBeVisible();
    await expect(page.getByText("Lucas, 6")).toBeVisible();
  });

  test("emergency contact shown on child cards", async ({ page }) => {
    await page.goto("/profile");

    const rosaTexts = page.getByText("Rosa M.");
    await expect(rosaTexts.first()).toBeVisible();
  });

  test("add rider profile button is present", async ({ page }) => {
    await page.goto("/profile");

    await expect(page.getByText("Add Rider Profile")).toBeVisible();
  });

  test("quick links navigate correctly", async ({ page }) => {
    await page.goto("/profile");

    await expect(page.getByRole("link", { name: /safety settings/i })).toHaveAttribute("href", "/profile/safety");
    await expect(page.getByRole("link", { name: /notifications/i })).toHaveAttribute("href", "/profile/notifications");
  });
});
