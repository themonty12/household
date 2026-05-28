import { expect, test } from "@playwright/test";

test.describe("app shell smoke", () => {
  test("login route renders sign in heading", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});
