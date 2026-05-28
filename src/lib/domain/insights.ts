import type { InsightItem, MonthlyCloseMetrics } from "./types";

export function generateInsights(metrics: MonthlyCloseMetrics): InsightItem[] {
  const insights: InsightItem[] = [];

  for (const [categoryId, actual] of Object.entries(metrics.categoryTotals)) {
    const budget = metrics.budgetByCategory[categoryId];

    if (budget !== undefined && actual > budget) {
      insights.push({
        severity: "warning",
        title: "Budget overrun",
        message: `${categoryId} spending is ${actual - budget} over budget.`,
        metricRefs: [`categoryTotals.${categoryId}`, `budgetByCategory.${categoryId}`],
        suggestedAction: "Review recent spending and adjust the category plan."
      });
    }

    if (budget === undefined && actual > 0) {
      insights.push({
        severity: "info",
        title: "Unbudgeted spending",
        message: `${categoryId} spending has no budget for this month.`,
        metricRefs: [
          `categoryTotals.${categoryId}`,
          `budgetByCategory.${categoryId}`
        ],
        suggestedAction: "Add a budget or recategorize the transaction."
      });
    }
  }

  if (metrics.savingsRate !== null && metrics.savingsRate >= 0.3) {
    insights.push({
      severity: "positive",
      title: "Strong savings rate",
      message: "Savings rate is at least 30% for the month.",
      metricRefs: ["savingsRate"],
      suggestedAction: "Consider directing surplus toward priority goals."
    });
  }

  if (metrics.fixedCostRatio !== null && metrics.fixedCostRatio >= 0.5) {
    insights.push({
      severity: "warning",
      title: "Fixed costs are high",
      message: "Fixed costs are at least 50% of income.",
      metricRefs: ["fixedCostRatio"],
      suggestedAction: "Review recurring bills and fixed commitments."
    });
  }

  if (metrics.netWorthChange !== null && metrics.netWorthChange > 0) {
    insights.push({
      severity: "positive",
      title: "Net worth increased",
      message: "Net worth improved compared with the previous snapshot.",
      metricRefs: ["netWorthChange"],
      suggestedAction: "Keep the monthly close cadence going."
    });
  }

  if (metrics.missingBudget) {
    insights.push({
      severity: "info",
      title: "Budgets missing",
      message: "Add budgets to compare planned and actual spending.",
      metricRefs: ["missingBudget"],
      suggestedAction: "Create category budgets for the month."
    });
  }

  if (metrics.missingSnapshot) {
    insights.push({
      severity: "info",
      title: "Snapshot missing",
      message: "Add a monthly snapshot to calculate net worth movement.",
      metricRefs: ["missingSnapshot"],
      suggestedAction: "Record assets, liabilities, and net worth."
    });
  }

  return insights;
}
