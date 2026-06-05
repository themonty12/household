import { describe, expect, it } from "vitest";

import {
  categoryOptionLabel,
  editableCategoriesForTransaction
} from "../../src/lib/domain/transaction-detail";

const categories = [
  { id: "income-root", name: "수입", type: "income", parent_category_id: null },
  { id: "salary", name: "급여", type: "income", parent_category_id: "income-root" },
  { id: "expense-root", name: "생활비", type: "expense", parent_category_id: null },
  { id: "groceries", name: "식비", type: "expense", parent_category_id: "expense-root" },
  { id: "transfer", name: "계좌이동", type: "transfer", parent_category_id: null }
] as const;

describe("categoryOptionLabel", () => {
  it("shows the parent category before a child category", () => {
    expect(categoryOptionLabel(categories[3], [...categories])).toBe("생활비 > 식비");
  });

  it("shows only the category name when there is no parent", () => {
    expect(categoryOptionLabel(categories[2], [...categories])).toBe("생활비");
  });
});

describe("editableCategoriesForTransaction", () => {
  it("returns only expense categories for expense transactions", () => {
    expect(editableCategoriesForTransaction("expense", [...categories]).map((category) => category.id)).toEqual([
      "expense-root",
      "groceries"
    ]);
  });

  it("returns income and expense categories for adjustment transactions", () => {
    expect(editableCategoriesForTransaction("adjustment", [...categories]).map((category) => category.id)).toEqual([
      "income-root",
      "salary",
      "expense-root",
      "groceries"
    ]);
  });

  it("returns no categories for transfer transactions", () => {
    expect(editableCategoriesForTransaction("transfer", [...categories])).toEqual([]);
  });
});
