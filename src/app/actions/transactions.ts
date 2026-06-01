"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { transactionSchema } from "@/lib/validation/transaction";

type CategoryType = "income" | "expense" | "transfer";

function allowedCategoryTypesForTransaction(type: "income" | "expense" | "adjustment") {
  return type === "adjustment" ? ["income", "expense"] : [type];
}

export async function createTransaction(formData: FormData) {
  const { user, profile, supabase } = await requireUser();
  const transaction = transactionSchema.parse(Object.fromEntries(formData));

  if (transaction.type !== "transfer") {
    const categoryId = transaction.categoryId;

    if (!categoryId) {
      throw new Error("Category is required for non-transfer transactions.");
    }

    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, type")
      .eq("household_id", profile.household_id)
      .eq("id", categoryId)
      .maybeSingle();

    if (categoryError) {
      throw categoryError;
    }

    const allowedCategoryTypes = allowedCategoryTypesForTransaction(transaction.type);

    if (
      !category ||
      !allowedCategoryTypes.includes((category as { type: CategoryType }).type)
    ) {
      throw new Error("Selected category is not valid for this transaction type.");
    }
  }

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
