import { expect, test } from "@playwright/test";

test.describe("driver wireframes", () => {
  test("shows the driver dashboard summary and queue entry point", async ({
    page,
  }) => {
    await page.goto("/driver");

    await expect(page.getByText("Driver shift")).toBeVisible();
    await expect(page.getByText("Marcus W.")).toBeVisible();
    await expect(page.getByText("Trips today")).toBeVisible();
    await expect(page.getByRole("link", { name: "Review Queue" })).toBeVisible();
  });

  test("shows the trip assignment details required for accept or reject", async ({
    page,
  }) => {
    await page.goto("/queue");

    await expect(page.getByText("Incoming assignment")).toBeVisible();
    await expect(page.getByText("Offered fare")).toBeVisible();
    await expect(page.getByText("Trip time")).toBeVisible();
    await expect(page.getByText("Mileage")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Accept Trip" })).toBeVisible();
  });

  test("lets the driver move from navigation to passenger pickup confirmation", async ({
    page,
  }) => {
    await page.goto("/trip/trip-204");

    await expect(page.getByText("En route to rider")).toBeVisible();
    await expect(page.getByText("Turn-by-turn map preview")).toBeVisible();

    await page.getByRole("link", { name: "Arrived at Pickup" }).click();

    await expect(page.getByText("At pickup pin")).toBeVisible();
    await expect(page.getByText("Passenger name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Pickup" })).toBeVisible();
  });
});
