import { expect, test } from "@playwright/test";

test.describe("app shell smoke", () => {
  test("login route renders Korean login heading", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  });
});
