"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { generateInsights } from "@/lib/domain/insights";
import { calculateMonthlyClose } from "@/lib/domain/monthly-close";
import { getMonthlyCloseData, normalizeMonth } from "@/lib/repositories/finance";
import { upsertMonthlyClose } from "@/lib/repositories/monthly-close";

export async function regenerateMonthlyClose(formData: FormData) {
  const { profile, supabase } = await requireUser();
  const rawMonth = formData.get("month");

  if (typeof rawMonth !== "string") {
    throw new Error("Month is required.");
  }

  const month = normalizeMonth(rawMonth);
  const data = await getMonthlyCloseData(supabase, profile.household_id, month);
  const metrics = calculateMonthlyClose({
    month,
    transactions: data.transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.date,
      type: transaction.type,
      amount: Number(transaction.amount),
      categoryId: transaction.category_id ?? "",
      accountId: transaction.account_id,
      toAccountId: transaction.to_account_id ?? undefined
    })),
    budgets: data.budgets.map((budget) => ({
      categoryId: budget.category_id,
      amount: Number(budget.amount)
    })),
    snapshot: data.snapshot
      ? {
          month: data.snapshot.month,
          totalAssets: Number(data.snapshot.total_assets),
          totalLiabilities: Number(data.snapshot.total_liabilities),
          netWorth: Number(data.snapshot.net_worth)
        }
      : null,
    previousSnapshot: data.previousSnapshot
      ? {
          month: data.previousSnapshot.month,
          totalAssets: Number(data.previousSnapshot.total_assets),
          totalLiabilities: Number(data.previousSnapshot.total_liabilities),
          netWorth: Number(data.previousSnapshot.net_worth)
        }
      : null
  });
  const insights = generateInsights(metrics);

  await upsertMonthlyClose(supabase, profile.household_id, metrics, insights);

  revalidatePath("/monthly-close");
}
