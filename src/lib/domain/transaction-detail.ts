import type { TransactionType } from "@/lib/domain/types";

export type EditableTransactionCategory = {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
  parent_category_id: string | null;
};

export function categoryOptionLabel(
  category: EditableTransactionCategory,
  categories: EditableTransactionCategory[]
) {
  const parent = category.parent_category_id
    ? categories.find((candidate) => candidate.id === category.parent_category_id)
    : undefined;

  return parent ? `${parent.name} > ${category.name}` : category.name;
}

export function editableCategoriesForTransaction(
  type: TransactionType,
  categories: EditableTransactionCategory[]
) {
  return categories.filter((category) => {
    if (type === "income") {
      return category.type === "income";
    }

    if (type === "expense") {
      return category.type === "expense";
    }

    if (type === "adjustment") {
      return category.type === "income" || category.type === "expense";
    }

    return false;
  });
}
