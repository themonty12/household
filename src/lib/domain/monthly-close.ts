import type {
  BudgetInput,
  MonthlyCloseMetrics,
  SnapshotInput,
  TransactionInput
} from "./types";

export type CalculateMonthlyCloseInput = {
  month: string;
  transactions: TransactionInput[];
  budgets: BudgetInput[];
  fixedCategoryIds?: string[];
  snapshot?: SnapshotInput | null;
  previousSnapshot?: SnapshotInput | null;
};

export function calculateMonthlyClose(
  input: CalculateMonthlyCloseInput
): MonthlyCloseMetrics {
  const categoryTotals: Record<string, number> = {};
  const budgetByCategory = input.budgets.reduce<Record<string, number>>(
    (budgets, budget) => {
      budgets[budget.categoryId] = budget.amount;
      return budgets;
    },
    {}
  );

  let incomeTotal = 0;
  let expenseTotal = 0;
  let transferTotal = 0;

  for (const transaction of input.transactions) {
    if (transaction.type === "income") {
      incomeTotal += transaction.amount;
    }

    if (transaction.type === "expense") {
      expenseTotal += transaction.amount;
      categoryTotals[transaction.categoryId] =
        (categoryTotals[transaction.categoryId] ?? 0) + transaction.amount;
    }

    if (transaction.type === "transfer") {
      transferTotal += transaction.amount;
    }
  }

  const fixedCategories = new Set(input.fixedCategoryIds ?? []);
  const hasFixedCategoryMetadata = fixedCategories.size > 0;
  const fixedExpenses = Object.entries(categoryTotals).reduce(
    (total, [categoryId, amount]) =>
      fixedCategories.has(categoryId) ? total + amount : total,
    0
  );

  const varianceCategoryIds = new Set([
    ...Object.keys(budgetByCategory),
    ...Object.keys(categoryTotals)
  ]);
  const budgetVariance = Array.from(varianceCategoryIds).reduce(
    (total, categoryId) =>
      total +
      ((categoryTotals[categoryId] ?? 0) - (budgetByCategory[categoryId] ?? 0)),
    0
  );

  return {
    month: input.month,
    incomeTotal,
    expenseTotal,
    transferTotal,
    budgetVariance,
    savingsRate:
      incomeTotal > 0
        ? roundToFourDecimals((incomeTotal - expenseTotal) / incomeTotal)
        : null,
    fixedCostRatio:
      hasFixedCategoryMetadata && incomeTotal > 0
        ? roundToFourDecimals(fixedExpenses / incomeTotal)
        : null,
    netWorthChange:
      input.snapshot && input.previousSnapshot
        ? input.snapshot.netWorth - input.previousSnapshot.netWorth
        : null,
    categoryTotals,
    budgetByCategory,
    missingBudget: input.budgets.length === 0,
    missingSnapshot: !input.snapshot
  };
}

function roundToFourDecimals(value: number): number {
  return Math.round(value * 10000) / 10000;
}
