"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { transactionSchema, transactionUpdateSchema } from "@/lib/validation/transaction";

type CategoryType = "income" | "expense" | "transfer";

function allowedCategoryTypesForTransaction(type: "income" | "expense" | "adjustment") {
  return type === "adjustment" ? ["income", "expense"] : [type];
}

function revalidateTransactionDependents() {
  revalidatePath("/today");
  revalidatePath("/transactions");
  revalidatePath("/assets");
  revalidatePath("/monthly-close");
}

async function assertCategoryAllowed({
  categoryId,
  householdId,
  supabase,
  type
}: {
  categoryId: string | undefined;
  householdId: string;
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"];
  type: "income" | "expense" | "adjustment";
}) {
  if (!categoryId) {
    throw new Error("이체가 아닌 거래에는 카테고리가 필요합니다.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, type")
    .eq("household_id", householdId)
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError) {
    throw categoryError;
  }

  const allowedCategoryTypes = allowedCategoryTypesForTransaction(type);

  if (!category || !allowedCategoryTypes.includes((category as { type: CategoryType }).type)) {
    throw new Error("선택한 카테고리는 이 거래 유형에 사용할 수 없습니다.");
  }
}

export async function createTransaction(formData: FormData) {
  const { user, profile, supabase } = await requireUser();
  const transaction = transactionSchema.parse(Object.fromEntries(formData));

  if (transaction.type !== "transfer") {
    await assertCategoryAllowed({
      categoryId: transaction.categoryId,
      householdId: profile.household_id,
      supabase,
      type: transaction.type
    });
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

  revalidateTransactionDependents();
}

export async function updateTransaction(formData: FormData) {
  const { profile, supabase } = await requireUser();
  const transaction = transactionUpdateSchema.parse(Object.fromEntries(formData));

  const { data: existingTransaction, error: existingError } = await supabase
    .from("transactions")
    .select("id, type")
    .eq("household_id", profile.household_id)
    .eq("id", transaction.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existingTransaction) {
    throw new Error("수정할 거래를 찾을 수 없습니다.");
  }

  if ((existingTransaction as { type: string }).type !== transaction.type) {
    throw new Error("거래 유형 변경은 아직 지원하지 않습니다.");
  }

  if (transaction.type !== "transfer") {
    await assertCategoryAllowed({
      categoryId: transaction.categoryId,
      householdId: profile.household_id,
      supabase,
      type: transaction.type
    });
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      date: transaction.date,
      amount: transaction.amount,
      account_id: transaction.accountId,
      to_account_id: transaction.type === "transfer" ? transaction.toAccountId : null,
      category_id: transaction.type === "transfer" ? null : transaction.categoryId,
      memo: transaction.memo
    })
    .eq("household_id", profile.household_id)
    .eq("id", transaction.id);

  if (error) {
    throw error;
  }

  revalidateTransactionDependents();
}
