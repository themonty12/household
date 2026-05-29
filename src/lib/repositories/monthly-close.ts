import type { SupabaseClient } from "@supabase/supabase-js";

import type { InsightItem, MonthlyCloseMetrics } from "@/lib/domain/types";

export async function upsertMonthlyClose(
  supabase: SupabaseClient,
  householdId: string,
  metrics: MonthlyCloseMetrics,
  insights: InsightItem[]
) {
  const { error } = await supabase.from("monthly_closes").upsert(
    {
      household_id: householdId,
      month: metrics.month,
      income_total: metrics.incomeTotal,
      expense_total: metrics.expenseTotal,
      transfer_total: metrics.transferTotal,
      budget_variance: metrics.budgetVariance,
      savings_rate: metrics.savingsRate,
      fixed_cost_ratio: metrics.fixedCostRatio,
      net_worth_change: metrics.netWorthChange,
      insight_items: insights
    },
    { onConflict: "household_id,month" }
  );

  if (error) {
    throw error;
  }
}
