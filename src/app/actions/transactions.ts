"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { transactionSchema } from "@/lib/validation/transaction";

export async function createTransaction(formData: FormData) {
  const { user, profile, supabase } = await requireUser();
  const transaction = transactionSchema.parse(Object.fromEntries(formData));

  const { error } = await supabase.from("transactions").insert({
    household_id: profile.household_id,
    date: transaction.date,
    type: transaction.type,
    amount: transaction.amount,
    account_id: transaction.accountId,
    to_account_id: transaction.type === "transfer" ? transaction.toAccountId : null,
    category_id: transaction.type === "transfer" ? null : transaction.categoryId,
    user_id: user.id,
    memo: transaction.memo
  });

  if (error) {
    throw error;
  }

  revalidatePath("/today");
  revalidatePath("/monthly-close");
}
