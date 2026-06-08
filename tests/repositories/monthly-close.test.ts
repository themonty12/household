import { describe, expect, it } from "vitest";

import { nextMonth, normalizeMonth } from "../../src/lib/repositories/finance";
import { upsertMonthlyClose } from "../../src/lib/repositories/monthly-close";
import type { InsightItem, MonthlyCloseMetrics } from "../../src/lib/domain/types";

describe("monthly close repositories", () => {
  it("calculates the next month from a month boundary date", () => {
    expect(nextMonth("2026-12-01")).toBe("2027-01-01");
  });

  it("normalizes a month input to the first day of that month", () => {
    expect(normalizeMonth("2026-05")).toBe("2026-05-01");
    expect(normalizeMonth("2026-05-20")).toBe("2026-05-01");
  });

  it("upserts monthly close metrics and insights by household and month", async () => {
    const upsertCalls: unknown[] = [];
    const supabase = {
      from(table: string) {
        return {
          upsert(payload: unknown, options: unknown) {
            upsertCalls.push({ table, payload, options });
            return Promise.resolve({ error: null });
          }
        };
      }
    };

    const metrics: MonthlyCloseMetrics = {
      month: "2026-05-01",
      incomeTotal: 5000,
      expenseTotal: 3200,
      transferTotal: 750,
      budgetVariance: 200,
      savingsRate: 0.36,
      fixedCostRatio: 0.42,
      netWorthChange: 1200,
      categoryTotals: { food: 1200 },
      budgetByCategory: { food: 1000 },
      categoryBreakdown: [],
      accountBreakdown: [],
      missingBudget: false,
      missingSnapshot: false
    };
    const insights: InsightItem[] = [
      {
        severity: "warning",
        title: "Budget overrun",
        message: "Food is over budget.",
        metricRefs: ["categoryTotals.food"],
        suggestedAction: "Review recent spending."
      }
    ];

    await upsertMonthlyClose(supabase as never, "household-1", metrics, insights);

    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0]).toMatchObject({
      table: "monthly_closes",
      payload: {
        household_id: "household-1",
        month: "2026-05-01",
        income_total: 5000,
        expense_total: 3200,
        transfer_total: 750,
        budget_variance: 200,
        savings_rate: 0.36,
        fixed_cost_ratio: 0.42,
        net_worth_change: 1200,
        insight_items: insights
      },
      options: { onConflict: "household_id,month" }
    });
    expect(
      (upsertCalls[0] as { payload: { generated_at: string } }).payload.generated_at
    ).toEqual(expect.any(String));
  });
});
