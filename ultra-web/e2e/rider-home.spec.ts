import { expect, test } from "@playwright/test";

test.describe("US11 — rider home / destination entry", () => {
  test("home page loads with map and search", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Map View")).toBeVisible();
    await expect(page.getByText("Where to?")).toBeVisible();
  });

  test("saved places are visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("742 Elm St")).toBeVisible();
    await expect(page.getByText("Downtown Office")).toBeVisible();
  });

  test("ride pass banner links to passes page", async ({ page }) => {
    await page.goto("/");

    await page.getByText("Ride Pass").click();
    await expect(page).toHaveURL("/passes");
  });

  test("where to link navigates to booking", async ({ page }) => {
    await page.goto("/");

    await page.getByText("Where to?").click();
    await expect(page).toHaveURL("/book");
  });

  test("bottom nav tabs are present", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav");
    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Passes" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Profile" })).toBeVisible();
  });
});
