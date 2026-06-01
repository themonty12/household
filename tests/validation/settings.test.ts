import { describe, expect, it } from "vitest";

import {
  accountSettingsSchema,
  budgetSettingsSchema,
  categorySettingsSchema
} from "../../src/lib/validation/settings";

describe("settings validation schemas", () => {
  it("accepts a valid account form and coerces numeric balance", () => {
    const account = accountSettingsSchema.parse({
      name: "주거래 통장",
      type: "bank",
      currentBalance: "125000",
      includeInNetWorth: "on",
      status: "active"
    });

    expect(account.currentBalance).toBe(125000);
    expect(account.includeInNetWorth).toBe(true);
  });

  it("rejects an invalid account type", () => {
    const result = accountSettingsSchema.safeParse({
      name: "이상한 계좌",
      type: "wallet",
      currentBalance: "0",
      status: "active"
    });

    expect(result.success).toBe(false);
  });

  it("accepts a category sort order and trims name", () => {
    const category = categorySettingsSchema.parse({
      name: " 식비 ",
      type: "expense",
      sortOrder: "10",
      status: "active"
    });

    expect(category.name).toBe("식비");
    expect(category.sortOrder).toBe(10);
  });

  it("rejects negative budget amounts", () => {
    const result = budgetSettingsSchema.safeParse({
      month: "2026-06",
      categoryId: "category-1",
      amount: "-1"
    });

    expect(result.success).toBe(false);
  });

  it("normalizes budget month to the first day", () => {
    const budget = budgetSettingsSchema.parse({
      month: "2026-06",
      categoryId: "category-1",
      amount: "500000"
    });

    expect(budget.month).toBe("2026-06-01");
  });
});
