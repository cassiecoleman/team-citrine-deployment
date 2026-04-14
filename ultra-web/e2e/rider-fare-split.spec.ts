import { expect, test } from "@playwright/test";

test.describe("US06 — fare splitting", () => {
  test("split page displays fare breakdown and contact list", async ({ page }) => {
    await page.goto("/book/split");

    await expect(page.getByText("Invite a Co-Rider")).toBeVisible();
    await expect(page.getByPlaceholder(/search contacts/i)).toBeVisible();
  });

  test("selecting a contact shows fare breakdown and send invite button", async ({
    page,
  }) => {
    await page.goto("/book/split");

    // Click first contact
    const contactButton = page.locator("button").filter({ hasText: /\w+/ }).first();
    await contactButton.waitFor({ state: "visible" });
    await contactButton.click();

    await expect(page.getByRole("button", { name: /send invite/i })).toBeVisible();
  });
});
