"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-user";
import {
  accountSettingsSchema,
  budgetSettingsSchema,
  categorySettingsSchema
} from "@/lib/validation/settings";

function revalidateSettingsDependents() {
  revalidatePath("/settings");
  revalidatePath("/today");
  revalidatePath("/assets");
  revalidatePath("/monthly-close");
}

export async function saveAccount(formData: FormData) {
  const { profile, supabase } = await requireAdmin();
  const account = accountSettingsSchema.parse(Object.fromEntries(formData));
  const values = {
    household_id: profile.household_id,
    name: account.name,
    type: account.type,
    current_balance: account.currentBalance,
    include_in_net_worth: account.includeInNetWorth,
    status: account.status
  };

  const result = account.id
    ? await supabase
        .from("accounts")
        .update(values)
        .eq("household_id", profile.household_id)
        .eq("id", account.id)
    : await supabase.from("accounts").insert(values);

  if (result.error) {
    throw result.error;
  }

  revalidateSettingsDependents();
}

export async function saveCategory(formData: FormData) {
  const { profile, supabase } = await requireAdmin();
  const category = categorySettingsSchema.parse(Object.fromEntries(formData));

  if (category.parentCategoryId) {
    if (category.id && category.id === category.parentCategoryId) {
      throw new Error("카테고리는 자기 자신을 상위 카테고리로 지정할 수 없습니다.");
    }

    const { data: parentCategory, error: parentCategoryError } = await supabase
      .from("categories")
      .select("id, type, parent_category_id")
      .eq("household_id", profile.household_id)
      .eq("id", category.parentCategoryId)
      .maybeSingle();

    if (parentCategoryError) {
      throw parentCategoryError;
    }

    if (
      !parentCategory ||
      (parentCategory as { type: string; parent_category_id: string | null }).type !==
        category.type ||
      (parentCategory as { type: string; parent_category_id: string | null })
        .parent_category_id !== null
    ) {
      throw new Error("상위 카테고리는 같은 유형의 대분류만 선택할 수 있습니다.");
    }
  }

  const values = {
    household_id: profile.household_id,
    name: category.name,
    type: category.type,
    parent_category_id: category.parentCategoryId ?? null,
    sort_order: category.sortOrder,
    status: category.status
  };

  const result = category.id
    ? await supabase
        .from("categories")
        .update(values)
        .eq("household_id", profile.household_id)
        .eq("id", category.id)
    : await supabase.from("categories").insert(values);

  if (result.error) {
    throw result.error;
  }

  revalidateSettingsDependents();
}

export async function saveBudget(formData: FormData) {
  const { user, profile, supabase } = await requireAdmin();
  const budget = budgetSettingsSchema.parse(Object.fromEntries(formData));

  const { error } = await supabase.from("budgets").upsert(
    {
      household_id: profile.household_id,
      month: budget.month,
      category_id: budget.categoryId,
      amount: budget.amount,
      created_by_user_id: user.id
    },
    { onConflict: "household_id,month,category_id" }
  );

  if (error) {
    throw error;
  }

  revalidateSettingsDependents();
}
