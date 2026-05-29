import type { SupabaseClient } from "@supabase/supabase-js";

export type TodayAccount = {
  id: string;
  name: string;
  type: string;
  current_balance: number | string;
};

export type TodayCategory = {
  id: string;
  name: string;
  type: string;
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
