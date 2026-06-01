import type { SupabaseClient } from "@supabase/supabase-js";
import type { InsightItem } from "@/lib/domain/types";

export type TodayAccount = {
  id: string;
  name: string;
  type: string;
  current_balance: number | string;
};

export type TodayCategory = {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
};

export type TodayRelationName = { name: string } | { name: string }[] | null;

export type TodayTransaction = {
  id: string;
  date: string;
  type: "income" | "expense" | "transfer" | "adjustment";
  amount: number | string;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  memo: string;
  created_at: string;
  accounts: TodayRelationName;
  to_account: TodayRelationName;
  categories: TodayRelationName;
};

export type TodayData = {
  accounts: TodayAccount[];
  categories: TodayCategory[];
  transactions: TodayTransaction[];
};

export type FinanceAccount = {
  id: string;
  name: string;
  type: string;
  include_in_net_worth: boolean;
  current_balance: number | string;
};

export type MonthlyCloseTransaction = {
  id: string;
  date: string;
  type: "income" | "expense" | "transfer" | "adjustment";
  amount: number | string;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
};

export type MonthlyCloseBudget = {
  category_id: string;
  amount: number | string;
};

export type MonthlyCloseSnapshot = {
  month: string;
  total_assets: number | string;
  total_liabilities: number | string;
  net_worth: number | string;
};

export type SavedMonthlyClose = {
  month: string;
  income_total: number | string;
  expense_total: number | string;
  transfer_total: number | string;
  budget_variance: number | string;
  savings_rate: number | string | null;
  fixed_cost_ratio: number | string | null;
  net_worth_change: number | string | null;
  insight_items: InsightItem[] | null;
  generated_at: string;
};

export type AssetsData = {
  accounts: FinanceAccount[];
};

export type MonthlyCloseData = {
  accounts: FinanceAccount[];
  transactions: MonthlyCloseTransaction[];
  budgets: MonthlyCloseBudget[];
  snapshot: MonthlyCloseSnapshot | null;
  previousSnapshot: MonthlyCloseSnapshot | null;
  savedClose: SavedMonthlyClose | null;
};

export type SettingsAccount = {
  id: string;
  name: string;
  type: string;
  include_in_net_worth: boolean;
  current_balance: number | string;
  status: "active" | "archived";
};

export type SettingsCategory = {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
  sort_order: number;
  status: "active" | "archived";
};

export type SettingsBudget = {
  id: string;
  month: string;
  category_id: string;
  amount: number | string;
};

export type SettingsProfile = {
  id: string;
  display_name: string;
  role: "admin" | "member";
  status: "invited" | "active" | "disabled";
};

export type SettingsData = {
  accounts: SettingsAccount[];
  categories: SettingsCategory[];
  budgets: SettingsBudget[];
  profiles: SettingsProfile[];
};

export async function getTodayData(
  supabase: SupabaseClient,
  householdId: string
): Promise<TodayData> {
  const [accountsResult, categoriesResult, transactionsResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, current_balance")
      .eq("household_id", householdId)
      .eq("status", "active")
      .order("name", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name, type")
      .eq("household_id", householdId)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("transactions")
      .select(
        "id, date, type, amount, account_id, to_account_id, category_id, memo, created_at, accounts!transactions_account_id_fkey(name), to_account:accounts!transactions_to_account_id_fkey(name), categories!transactions_category_id_fkey(name)"
      )
      .eq("household_id", householdId)
      .eq("status", "posted")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12)
  ]);

  if (accountsResult.error) {
    throw accountsResult.error;
  }

  if (categoriesResult.error) {
    throw categoriesResult.error;
  }

  if (transactionsResult.error) {
    throw transactionsResult.error;
  }

  return {
    accounts: (accountsResult.data ?? []) as TodayAccount[],
    categories: (categoriesResult.data ?? []) as TodayCategory[],
    transactions: (transactionsResult.data ?? []) as TodayTransaction[]
  };
}

export function normalizeMonth(month: string): string {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(month);

  if (!match) {
    throw new Error("Month must use YYYY-MM or YYYY-MM-DD format.");
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex) {
    throw new Error("Month must be a valid calendar month.");
  }

  return formatMonthDate(date);
}

export function nextMonth(month: string): string {
  const normalized = normalizeMonth(month);
  const date = new Date(`${normalized}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return formatMonthDate(date);
}

function formatMonthDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getAssetsData(
  supabase: SupabaseClient,
  householdId: string
): Promise<AssetsData> {
  const accountsResult = await supabase
    .from("accounts")
    .select("id, name, type, include_in_net_worth, current_balance")
    .eq("household_id", householdId)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (accountsResult.error) {
    throw accountsResult.error;
  }

  return {
    accounts: (accountsResult.data ?? []) as FinanceAccount[]
  };
}

export async function getMonthlyCloseData(
  supabase: SupabaseClient,
  householdId: string,
  month: string
): Promise<MonthlyCloseData> {
  const monthStart = normalizeMonth(month);
  const nextMonthStart = nextMonth(monthStart);

  const [
    accountsResult,
    transactionsResult,
    budgetsResult,
    snapshotResult,
    previousSnapshotResult,
    savedCloseResult
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, include_in_net_worth, current_balance")
      .eq("household_id", householdId)
      .eq("status", "active")
      .order("name", { ascending: true }),
    supabase
      .from("transactions")
      .select("id, date, type, amount, account_id, to_account_id, category_id")
      .eq("household_id", householdId)
      .eq("status", "posted")
      .gte("date", monthStart)
      .lt("date", nextMonthStart)
      .order("date", { ascending: true }),
    supabase
      .from("budgets")
      .select("category_id, amount")
      .eq("household_id", householdId)
      .eq("month", monthStart),
    supabase
      .from("monthly_snapshots")
      .select("month, total_assets, total_liabilities, net_worth")
      .eq("household_id", householdId)
      .eq("month", monthStart)
      .maybeSingle(),
    supabase
      .from("monthly_snapshots")
      .select("month, total_assets, total_liabilities, net_worth")
      .eq("household_id", householdId)
      .lt("month", monthStart)
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("monthly_closes")
      .select(
        "month, income_total, expense_total, transfer_total, budget_variance, savings_rate, fixed_cost_ratio, net_worth_change, insight_items, generated_at"
      )
      .eq("household_id", householdId)
      .eq("month", monthStart)
      .maybeSingle()
  ]);

  if (accountsResult.error) {
    throw accountsResult.error;
  }

  if (transactionsResult.error) {
    throw transactionsResult.error;
  }

  if (budgetsResult.error) {
    throw budgetsResult.error;
  }

  if (snapshotResult.error) {
    throw snapshotResult.error;
  }

  if (previousSnapshotResult.error) {
    throw previousSnapshotResult.error;
  }

  if (savedCloseResult.error) {
    throw savedCloseResult.error;
  }

  return {
    accounts: (accountsResult.data ?? []) as FinanceAccount[],
    transactions: (transactionsResult.data ?? []) as MonthlyCloseTransaction[],
    budgets: (budgetsResult.data ?? []) as MonthlyCloseBudget[],
    snapshot: (snapshotResult.data ?? null) as MonthlyCloseSnapshot | null,
    previousSnapshot: (previousSnapshotResult.data ?? null) as MonthlyCloseSnapshot | null,
    savedClose: (savedCloseResult.data ?? null) as SavedMonthlyClose | null
  };
}

export async function getSettingsData(
  supabase: SupabaseClient,
  householdId: string,
  month: string
): Promise<SettingsData> {
  const monthStart = normalizeMonth(month);
  const [accountsResult, categoriesResult, budgetsResult, profilesResult] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("id, name, type, include_in_net_worth, current_balance, status")
        .eq("household_id", householdId)
        .order("status", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("categories")
        .select("id, name, type, sort_order, status")
        .eq("household_id", householdId)
        .order("status", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("budgets")
        .select("id, month, category_id, amount")
        .eq("household_id", householdId)
        .eq("month", monthStart),
      supabase
        .from("profiles")
        .select("id, display_name, role, status")
        .eq("household_id", householdId)
        .order("role", { ascending: true })
        .order("display_name", { ascending: true })
    ]);

  if (accountsResult.error) {
    throw accountsResult.error;
  }

  if (categoriesResult.error) {
    throw categoriesResult.error;
  }

  if (budgetsResult.error) {
    throw budgetsResult.error;
  }

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  return {
    accounts: (accountsResult.data ?? []) as SettingsAccount[],
    categories: (categoriesResult.data ?? []) as SettingsCategory[],
    budgets: (budgetsResult.data ?? []) as SettingsBudget[],
    profiles: (profilesResult.data ?? []) as SettingsProfile[]
  };
}
