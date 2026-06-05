import { describe, expect, it } from "vitest";

import { accountBalanceDelta } from "../../src/lib/domain/account-balance";

describe("accountBalanceDelta", () => {
  it("decreases asset accounts for expenses", () => {
    expect(accountBalanceDelta({ accountType: "bank", amount: 12000, role: "source", transactionType: "expense" })).toBe(-12000);
  });

  it("increases asset accounts for income", () => {
    expect(accountBalanceDelta({ accountType: "cash", amount: 50000, role: "source", transactionType: "income" })).toBe(50000);
  });

  it("moves money between asset accounts for transfers", () => {
    expect(accountBalanceDelta({ accountType: "bank", amount: 30000, role: "source", transactionType: "transfer" })).toBe(-30000);
    expect(accountBalanceDelta({ accountType: "investment", amount: 30000, role: "destination", transactionType: "transfer" })).toBe(30000);
  });

  it("increases liability accounts when spending with a card", () => {
    expect(accountBalanceDelta({ accountType: "card", amount: 45000, role: "source", transactionType: "expense" })).toBe(45000);
  });

  it("decreases liability accounts when a transfer pays the liability account", () => {
    expect(accountBalanceDelta({ accountType: "loan", amount: 100000, role: "destination", transactionType: "transfer" })).toBe(-100000);
  });
});
