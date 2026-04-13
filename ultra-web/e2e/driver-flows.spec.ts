import { expect, test } from "@playwright/test";

test.describe("driver flows", () => {
  test("lets the driver toggle shift status and open the active trip", async ({
    page,
  }) => {
    await page.goto("/driver");

    await expect(page.getByText("Driver shift")).toBeVisible();
    await expect(page.getByText("Marcus W.")).toBeVisible();
    await expect(page.getByText("Trips today")).toBeVisible();
    await expect(
      page.getByText("Available for the next assignment"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Go Offline" }).click();

    await expect(
      page.getByText("Offline until the next dispatch window"),
    ).toBeVisible();

    await page.getByRole("link", { name: "Open active trip details" }).click();

    await expect(page).toHaveURL(/\/trip\/new-ride$/);
    await expect(page.getByText("En route to rider")).toBeVisible();
    await expect(page.getByText("Turn-by-turn map preview")).toBeVisible();
    await expect(
      page.getByText("0 of 3 arrival checks complete"),
    ).toBeVisible();
  });

  test("handles queue review, navigation, and pickup confirmation", async ({
    page,
  }) => {
    await page.goto("/queue");

    await expect(page).toHaveURL(/\/queue$/);
    await expect(
      page.getByRole("heading", { name: "Incoming assignment" }),
    ).toBeVisible();
    await expect(page.getByText("Offered fare", { exact: true })).toBeVisible();
    await expect(page.getByText("Medical appointment")).toBeVisible();

    await page.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByText("Assignment declined")).toBeVisible();

    await page.getByRole("button", { name: "Review Next Request" }).click();
    await page.getByRole("link", { name: "Accept Trip" }).click();

    await expect(page).toHaveURL(/\/trip\/new-ride$/);
    await expect(page.getByText("Pickup pin ready")).toBeVisible();

    await page
      .getByRole("button", { name: "Hazards ready for curb pickup" })
      .click();
    await expect(
      page.getByText("1 of 3 arrival checks complete"),
    ).toBeVisible();

    await page
      .getByRole("link", { name: "Advance to pickup confirmation" })
      .click();

    await expect(page).toHaveURL(/\/trip\/new-ride\/pickup$/);
    await expect(page.getByText("At pickup pin")).toBeVisible();

    const confirmPickupButton = page.getByRole("button", {
      name: "Confirm Pickup",
    });
    await expect(confirmPickupButton).toBeDisabled();

    await page
      .getByRole("button", {
        name: "1. Confirm the rider says the name on screen.",
      })
      .click();
    await page
      .getByRole("button", {
        name: "2. Confirm curbside pickup matches the app pin.",
      })
      .click();

    await expect(confirmPickupButton).toBeEnabled();
    await confirmPickupButton.click();

    await expect(page.getByText("Pickup confirmed")).toBeVisible();
    await page.getByRole("link", { name: "Return to Shift Board" }).click();

    await expect(page).toHaveURL(/\/driver$/);
  });
});
