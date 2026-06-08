import { describe, expect, it } from "vitest";

import { calculateMonthlyClose } from "../../src/lib/domain/monthly-close";

describe("calculateMonthlyClose", () => {
  it("aggregates monthly totals and derived metrics", () => {
    const metrics = calculateMonthlyClose({
      month: "2026-05",
      transactions: [
        {
          id: "income-1",
          date: "2026-05-01",
          type: "income",
          amount: 5000,
          categoryId: "salary",
          accountId: "checking"
        },
        {
          id: "food-1",
          date: "2026-05-02",
          type: "expense",
          amount: 1200,
          categoryId: "food",
          accountId: "checking"
        },
        {
          id: "rent-1",
          date: "2026-05-03",
          type: "expense",
          amount: 800,
          categoryId: "rent",
          accountId: "checking"
        },
        {
          id: "transfer-1",
          date: "2026-05-04",
          type: "transfer",
          amount: 1000,
          categoryId: "savings",
          accountId: "checking",
          toAccountId: "savings"
        }
      ],
      budgets: [
        { categoryId: "food", amount: 1100 },
        { categoryId: "rent", amount: 800 }
      ],
      fixedCategoryIds: ["rent"],
      snapshot: {
        month: "2026-05",
        totalAssets: 15000,
        totalLiabilities: 3000,
        netWorth: 12000
      },
      previousSnapshot: {
        month: "2026-04",
        totalAssets: 14000,
        totalLiabilities: 3200,
        netWorth: 10800
      }
    });

    expect(metrics.incomeTotal).toBe(5000);
    expect(metrics.expenseTotal).toBe(2000);
    expect(metrics.transferTotal).toBe(1000);
    expect(metrics.budgetVariance).toBe(100);
    expect(metrics.savingsRate).toBe(0.6);
    expect(metrics.fixedCostRatio).toBe(0.16);
    expect(metrics.netWorthChange).toBe(1200);
    expect(metrics.categoryTotals.food).toBe(1200);
    expect(metrics.categoryBreakdown).toEqual([
      {
        budget: 1100,
        categoryId: "food",
        count: 1,
        expense: 1200,
        income: 0,
        total: 1200,
        type: "expense",
        variance: 100
      },
      {
        budget: 800,
        categoryId: "rent",
        count: 1,
        expense: 800,
        income: 0,
        total: 800,
        type: "expense",
        variance: 0
      },
      {
        budget: 0,
        categoryId: "salary",
        count: 1,
        expense: 0,
        income: 5000,
        total: 5000,
        type: "income",
        variance: 5000
      }
    ]);
    expect(metrics.accountBreakdown).toEqual([
      {
        accountId: "checking",
        count: 4,
        expense: 2000,
        income: 5000,
        netChange: 2000,
        transferIn: 0,
        transferOut: 1000
      },
      {
        accountId: "savings",
        count: 1,
        expense: 0,
        income: 0,
        netChange: 1000,
        transferIn: 1000,
        transferOut: 0
      }
    ]);
  });

  it("subtracts budgeted categories with zero actual spend from budget variance", () => {
    const metrics = calculateMonthlyClose({
      month: "2026-05",
      transactions: [],
      budgets: [{ categoryId: "food", amount: 400 }]
    });

    expect(metrics.budgetVariance).toBe(-400);
  });

  it("adds unbudgeted expense categories to budget variance", () => {
    const metrics = calculateMonthlyClose({
      month: "2026-05",
      transactions: [
        {
          id: "expense-1",
          date: "2026-05-12",
          type: "expense",
          amount: 250,
          categoryId: "medical",
          accountId: "checking"
        }
      ],
      budgets: []
    });

    expect(metrics.budgetVariance).toBe(250);
  });

  it("returns null fixed cost ratio when fixed category metadata is unavailable", () => {
    const metrics = calculateMonthlyClose({
      month: "2026-05",
      transactions: [
        {
          id: "income-1",
          date: "2026-05-01",
          type: "income",
          amount: 5000,
          categoryId: "salary",
          accountId: "checking"
        },
        {
          id: "expense-1",
          date: "2026-05-12",
          type: "expense",
          amount: 250,
          categoryId: "medical",
          accountId: "checking"
        }
      ],
      budgets: []
    });

    expect(metrics.fixedCostRatio).toBeNull();
  });
});
