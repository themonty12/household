import type { TransactionType } from "@/lib/domain/types";

export type AccountBalanceRole = "source" | "destination";

export type AccountBalanceInput = {
  accountType: string;
  amount: number;
  role: AccountBalanceRole;
  transactionType: TransactionType;
};

const liabilityTypes = new Set(["card", "loan", "other_liability"]);

export function accountBalanceDelta({
  accountType,
  amount,
  role,
  transactionType
}: AccountBalanceInput) {
  const liabilityMultiplier = liabilityTypes.has(accountType) ? -1 : 1;

  if (transactionType === "income") {
    return amount * liabilityMultiplier;
  }

  if (transactionType === "expense") {
    return -amount * liabilityMultiplier;
  }

  if (transactionType === "transfer") {
    return (role === "source" ? -amount : amount) * liabilityMultiplier;
  }

  return amount * liabilityMultiplier;
}
