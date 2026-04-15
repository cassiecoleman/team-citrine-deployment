import { expect, test } from "@playwright/test";
import {
  createTestRider,
  deleteTestUser,
  injectAuthenticatedSession,
  type TestUser,
} from "./helpers/auth";

/**
 * Issue #24 / US10 — rider manages child profiles at /profile.
 *
 * Covers the end-to-end add → edit → delete flow, driving the real
 * Supabase-backed server actions through the ProfilePage UI. Uses
 * session injection (same pattern as the rest of the suite).
 */

test.describe("Issue #24 — manage child profiles", () => {
  test("rider can add, edit, and remove a child profile", async ({
    context,
    page,
  }) => {
    test.setTimeout(90_000);

    const rider: TestUser = await createTestRider("e2e-child-profiles");
    try {
      await injectAuthenticatedSession(context, rider);
      await page.goto("/profile");
      await expect(page).toHaveURL(/\/profile$/);

      // --- ADD ---
      await page
        .getByRole("button", { name: /add rider profile/i })
        .click({ force: true });
      // Wait for the inline form to expand before filling.
      await expect(page.getByTestId("add-child-form")).toBeVisible();
      await page.getByLabel("New child name").fill("Emma");
      await page.getByLabel("New child emergency contact").fill("Rosa M.");
      await page
        .getByTestId("add-child-form")
        .getByRole("button", { name: /^add$/i })
        .click();

      const emmaCard = page
        .getByTestId("child-profile-card")
        .filter({ hasText: "Emma" });
      await expect(emmaCard).toBeVisible({ timeout: 10_000 });
      await expect(emmaCard.getByText(/Rosa M\./)).toBeVisible();

      // --- EDIT ---
      await emmaCard.getByRole("button", { name: /^Edit Emma$/ }).click();
      await page.getByLabel(/Edit name for Emma/).fill("Emma R.");
      await page.getByLabel(/Edit emergency contact for Emma/).fill("Rosa M. Alt");
      // Scope to whichever card is in edit mode (only one at a time).
      await page
        .getByTestId("child-profile-card")
        .filter({ has: page.getByRole("button", { name: /^save$/i }) })
        .getByRole("button", { name: /^save$/i })
        .click();

      const renamedCard = page
        .getByTestId("child-profile-card")
        .filter({ hasText: "Emma R." });
      await expect(renamedCard).toBeVisible({ timeout: 10_000 });
      await expect(renamedCard.getByText(/Rosa M\. Alt/)).toBeVisible();

      // --- DELETE ---
      page.once("dialog", (d) => d.accept());
      await renamedCard.getByRole("button", { name: /^Remove Emma R\.$/ }).click();

      await expect(
        page.getByTestId("child-profile-card").filter({ hasText: "Emma R." })
      ).toHaveCount(0, { timeout: 10_000 });
    } finally {
      await deleteTestUser(rider.userId);
    }
  });
});
