import { expect, test } from "@playwright/test";

test.describe("admin workflows", () => {
  test("shows the admin dashboard and links into the admin tables", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Drivers", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Drivers", exact: true }).click();

    await expect(page).toHaveURL("/admin/drivers");
    await expect(page.getByText("All Drivers")).toBeVisible();
    await expect(page.getByText("Maria Lopez")).toBeVisible();
  });

  test("admin can view active rides, completed rides, and search results", async ({ page }) => {
    await page.goto("/admin/requests");
    await expect(page.getByRole("heading", { name: "Pending Ride Requests" })).toBeVisible();
    await expect(page.getByText("Maya Brooks")).toBeVisible();

    await page.goto("/admin/rides");
    await expect(page.getByRole("heading", { name: "Active Rides" })).toBeVisible();
    await page.getByRole("searchbox", { name: "Search active rides" }).fill("Carlos");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Carlos Vega")).toBeVisible();

    await page.goto("/admin/completed");
    await expect(page.getByRole("heading", { name: "Completed Rides" })).toBeVisible();
    await page.getByRole("searchbox", { name: "Search completed rides" }).fill("Maya");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Maya Brooks")).toBeVisible();
  });
});
