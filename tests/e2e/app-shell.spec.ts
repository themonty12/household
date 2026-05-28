import { expect, test } from "@playwright/test";

test.describe("app shell smoke", () => {
  test.skip("login route renders sign in heading after Task 6 creates /login", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});
