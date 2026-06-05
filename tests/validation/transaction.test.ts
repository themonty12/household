import { describe, expect, it } from "vitest";

import { transactionSchema, transactionUpdateSchema } from "../../src/lib/validation/transaction";

describe("transactionSchema", () => {
  it("accepts positive expense and coerces amount to number", () => {
    const transaction = transactionSchema.parse({
      date: "2026-05-29",
      type: "expense",
      amount: "12500",
      accountId: "checking",
      categoryId: "groceries"
    });

    expect(transaction.amount).toBe(12500);
    expect(transaction.memo).toBe("");
  });

  it("rejects transfer without destination account", () => {
    const result = transactionSchema.safeParse({
      date: "2026-05-29",
      type: "transfer",
      amount: "10000",
      accountId: "checking"
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("toAccountId"))).toBe(true);
  });

  it("rejects transfer to the same account", () => {
    const result = transactionSchema.safeParse({
      date: "2026-05-29",
      type: "transfer",
      amount: "10000",
      accountId: "checking",
      toAccountId: "checking"
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("toAccountId"))).toBe(true);
  });

  it("accepts transfer between different accounts without category", () => {
    const transaction = transactionSchema.parse({
      date: "2026-05-29",
      type: "transfer",
      amount: "10000",
      accountId: "checking",
      toAccountId: "savings",
      categoryId: ""
    });

    expect(transaction.toAccountId).toBe("savings");
    expect(transaction.categoryId).toBeUndefined();
  });

  it("rejects transfer with category", () => {
    const result = transactionSchema.safeParse({
      date: "2026-05-29",
      type: "transfer",
      amount: "10000",
      accountId: "checking",
      toAccountId: "savings",
      categoryId: "groceries"
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("categoryId"))).toBe(true);
  });

  it("rejects non-transfer with destination account", () => {
    const result = transactionSchema.safeParse({
      date: "2026-05-29",
      type: "expense",
      amount: "10000",
      accountId: "checking",
      toAccountId: "savings",
      categoryId: "groceries"
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("toAccountId"))).toBe(true);
  });

  it("rejects adjustment without category", () => {
    const result = transactionSchema.safeParse({
      date: "2026-05-29",
      type: "adjustment",
      amount: "5000",
      accountId: "checking"
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("categoryId"))).toBe(true);
  });

  it("accepts updates when a transaction id is provided", () => {
    const transaction = transactionUpdateSchema.parse({
      id: "transaction-1",
      date: "2026-05-29",
      type: "expense",
      amount: "12500",
      accountId: "checking",
      categoryId: "groceries"
    });

    expect(transaction.id).toBe("transaction-1");
    expect(transaction.amount).toBe(12500);
  });
});
