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
      categoryBreakdown: [],
      accountBreakdown: [],
      missingBudget: false,
      missingSnapshot: false
    });

    expect(insights.map((insight) => insight.title)).toEqual(
      expect.arrayContaining([
        "예산 초과",
        "저축률 양호",
        "순자산 증가"
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
      categoryBreakdown: [],
      accountBreakdown: [],
      missingBudget: true,
      missingSnapshot: true
    };

    const insights = generateInsights(metrics);

    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "예산 미설정",
          metricRefs: ["missingBudget"]
        }),
        expect.objectContaining({
          title: "스냅샷 없음",
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
      categoryBreakdown: [],
      accountBreakdown: [],
      missingBudget: false,
      missingSnapshot: false
    });

    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "예산 없는 지출",
          metricRefs: ["categoryTotals.medical", "budgetByCategory.medical"]
        })
      ])
    );
  });
});
