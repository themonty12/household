export type TransactionType = "income" | "expense" | "transfer" | "adjustment";

export type TransactionInput = {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
};

export type BudgetInput = {
  categoryId: string;
  amount: number;
};

export type SnapshotInput = {
  month: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
};

export type InsightSeverity = "info" | "positive" | "warning";

export type InsightItem = {
  severity: InsightSeverity;
  title: string;
  message: string;
  metricRefs: string[];
  suggestedAction: string | null;
};

export type MonthlyCloseMetrics = {
  month: string;
  incomeTotal: number;
  expenseTotal: number;
  transferTotal: number;
  budgetVariance: number;
  savingsRate: number | null;
  fixedCostRatio: number | null;
  netWorthChange: number | null;
  categoryTotals: Record<string, number>;
  budgetByCategory: Record<string, number>;
  categoryBreakdown: MonthlyCloseCategoryBreakdown[];
  accountBreakdown: MonthlyCloseAccountBreakdown[];
  missingBudget: boolean;
  missingSnapshot: boolean;
};

export type MonthlyCloseCategoryBreakdown = {
  categoryId: string;
  type: "income" | "expense";
  income: number;
  expense: number;
  total: number;
  budget: number;
  variance: number;
  count: number;
};

export type MonthlyCloseAccountBreakdown = {
  accountId: string;
  income: number;
  expense: number;
  transferIn: number;
  transferOut: number;
  netChange: number;
  count: number;
};
