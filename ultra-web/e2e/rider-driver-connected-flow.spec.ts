import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import {
  createTestDriver,
  createTestRider,
  deleteTestUser,
  injectAuthenticatedSession,
  type TestDriver,
  type TestUser,
} from "./helpers/auth";

test.describe("rider + driver connected flow", () => {
  let rider: TestUser;
  let driver: TestDriver;

  test.beforeAll(async () => {
    rider = await createTestRider("connected-flow-rider");
    driver = await createTestDriver("connected-flow-driver");
  });

  test.afterAll(async () => {
    await deleteTestUser(rider.userId);
    await deleteTestUser(driver.userId);
  });

  test("connects rider and driver and advances rider status after driver actions", async ({
    page,
  }) => {
    await writeFile("/tmp/ultra-demo-ride-state.json", "{}", "utf-8");

    const riderPage = page;
    const driverPage = await page.context().newPage();
    await injectAuthenticatedSession(riderPage.context(), rider);
    await injectAuthenticatedSession(driverPage.context(), driver);

    await riderPage.goto("/ride/new-ride");
    await expect(riderPage.getByText("Finding your driver")).toBeVisible();

    await driverPage.goto("/queue");
    await expect(
      driverPage.getByRole("heading", { name: "Incoming assignment" }),
    ).toBeVisible();

    const acceptTripHref = await driverPage
      .getByRole("link", { name: "Accept Trip" })
      .getAttribute("href");
    expect(acceptTripHref).toBe("/trip/new-ride");

    await Promise.all([
      driverPage.waitForURL(/\/trip\/new-ride$/),
      driverPage.getByRole("link", { name: "Accept Trip" }).click(),
    ]);

    await expect(riderPage.getByText("Driver En Route")).toBeVisible({
      timeout: 10000,
    });

    await driverPage
      .getByRole("link", { name: "Advance to pickup confirmation" })
      .click();
    await expect(driverPage).toHaveURL(/\/trip\/new-ride\/pickup$/);

    await driverPage
      .getByRole("button", {
        name: "1. Confirm the rider says the name on screen.",
      })
      .click();
    await driverPage
      .getByRole("button", {
        name: "2. Confirm curbside pickup matches the app pin.",
      })
      .click();

    await driverPage
      .getByRole("button", { name: "Confirm Pickup" })
      .click();
    await expect(driverPage.getByText("Pickup confirmed")).toBeVisible();

    await expect(riderPage.getByText("Ride In Progress")).toBeVisible({
      timeout: 10000,
    });

    await driverPage.close();
  });
});
