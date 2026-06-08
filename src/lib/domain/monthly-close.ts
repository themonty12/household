import type {
  BudgetInput,
  MonthlyCloseAccountBreakdown,
  MonthlyCloseCategoryBreakdown,
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
  const categoryBreakdownById: Record<string, MonthlyCloseCategoryBreakdown> = {};
  const accountBreakdownById: Record<string, MonthlyCloseAccountBreakdown> = {};
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
      const category = ensureCategoryBreakdown(
        categoryBreakdownById,
        transaction.categoryId,
        "income",
        budgetByCategory[transaction.categoryId] ?? 0
      );
      category.income += transaction.amount;
      category.total += transaction.amount;
      category.count += 1;

      const account = ensureAccountBreakdown(accountBreakdownById, transaction.accountId);
      account.income += transaction.amount;
      account.netChange += transaction.amount;
      account.count += 1;
    }

    if (transaction.type === "expense") {
      expenseTotal += transaction.amount;
      categoryTotals[transaction.categoryId] =
        (categoryTotals[transaction.categoryId] ?? 0) + transaction.amount;
      const category = ensureCategoryBreakdown(
        categoryBreakdownById,
        transaction.categoryId,
        "expense",
        budgetByCategory[transaction.categoryId] ?? 0
      );
      category.expense += transaction.amount;
      category.total += transaction.amount;
      category.count += 1;

      const account = ensureAccountBreakdown(accountBreakdownById, transaction.accountId);
      account.expense += transaction.amount;
      account.netChange -= transaction.amount;
      account.count += 1;
    }

    if (transaction.type === "transfer") {
      transferTotal += transaction.amount;
      const sourceAccount = ensureAccountBreakdown(accountBreakdownById, transaction.accountId);
      sourceAccount.transferOut += transaction.amount;
      sourceAccount.netChange -= transaction.amount;
      sourceAccount.count += 1;

      if (transaction.toAccountId) {
        const destinationAccount = ensureAccountBreakdown(accountBreakdownById, transaction.toAccountId);
        destinationAccount.transferIn += transaction.amount;
        destinationAccount.netChange += transaction.amount;
        destinationAccount.count += 1;
      }
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
  const categoryBreakdown = Object.values(categoryBreakdownById)
    .map((category) => ({
      ...category,
      variance: category.total - category.budget
    }))
    .sort((left, right) => {
      if (left.type !== right.type) {
        return left.type === "expense" ? -1 : 1;
      }

      return right.total - left.total;
    });
  const accountBreakdown = Object.values(accountBreakdownById);

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
    categoryBreakdown,
    accountBreakdown,
    missingBudget: input.budgets.length === 0,
    missingSnapshot: !input.snapshot
  };
}

function ensureCategoryBreakdown(
  categories: Record<string, MonthlyCloseCategoryBreakdown>,
  categoryId: string,
  type: "income" | "expense",
  budget: number
) {
  categories[categoryId] ??= {
    categoryId,
    type,
    income: 0,
    expense: 0,
    total: 0,
    budget,
    variance: 0,
    count: 0
  };

  return categories[categoryId];
}

function ensureAccountBreakdown(
  accounts: Record<string, MonthlyCloseAccountBreakdown>,
  accountId: string
) {
  accounts[accountId] ??= {
    accountId,
    income: 0,
    expense: 0,
    transferIn: 0,
    transferOut: 0,
    netChange: 0,
    count: 0
  };

  return accounts[accountId];
}

function roundToFourDecimals(value: number): number {
  return Math.round(value * 10000) / 10000;
}
