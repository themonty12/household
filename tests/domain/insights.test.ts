import { describe, expect, it } from "vitest";

import { generateInsights } from "../../src/lib/domain/insights";
import type { MonthlyCloseMetrics } from "../../src/lib/domain/types";

describe("generateInsights", () => {
  it("includes budget, savings, and net worth insights for matching metrics", () => {
    const insights = generateInsights({
      month: "2026-05",
      incomeTotal: 5000,
      expenseTotal: 2000,
      transferTotal: 1000,
      budgetVariance: 100,
      savingsRate: 0.6,
      fixedCostRatio: 0.16,
      netWorthChange: 1200,
      categoryTotals: { food: 1200, rent: 800 },
      budgetByCategory: { food: 1100, rent: 800 },
      missingBudget: false,
      missingSnapshot: false
    });

    expect(insights.map((insight) => insight.title)).toEqual(
      expect.arrayContaining([
        "Budget overrun",
        "Strong savings rate",
        "Net worth increased"
      ])
    );
  });

  it("emits setup insights when budget and snapshot are missing", () => {
    const metrics: MonthlyCloseMetrics = {
      month: "2026-05",
      incomeTotal: 0,
      expenseTotal: 0,
      transferTotal: 0,
      budgetVariance: 0,
      savingsRate: null,
      fixedCostRatio: null,
      netWorthChange: null,
      categoryTotals: {},
      budgetByCategory: {},
      missingBudget: true,
      missingSnapshot: true
    };

    const insights = generateInsights(metrics);

    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Budgets missing",
          metricRefs: ["missingBudget"]
        }),
        expect.objectContaining({
          title: "Snapshot missing",
          metricRefs: ["missingSnapshot"]
        })
      ])
    );
  });

  it("explains unbudgeted expense categories", () => {
    const insights = generateInsights({
      month: "2026-05",
      incomeTotal: 0,
      expenseTotal: 250,
      transferTotal: 0,
      budgetVariance: 250,
      savingsRate: null,
      fixedCostRatio: null,
      netWorthChange: null,
      categoryTotals: { medical: 250 },
      budgetByCategory: {},
      missingBudget: false,
      missingSnapshot: false
    });

    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Unbudgeted spending",
          metricRefs: ["categoryTotals.medical", "budgetByCategory.medical"]
        })
      ])
    );
  });
});
