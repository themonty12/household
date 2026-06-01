"use client";

import { useEffect, useState } from "react";

import { createTransaction } from "@/app/actions/transactions";
import { transactionTypeLabel } from "@/lib/domain/labels";
import type { TodayAccount, TodayCategory } from "@/lib/repositories/finance";

type TransactionFormProps = {
  accounts: TodayAccount[];
  categories: TodayCategory[];
};

const transactionTypes = [
  { value: "expense", label: transactionTypeLabel("expense") },
  { value: "income", label: transactionTypeLabel("income") },
  { value: "transfer", label: transactionTypeLabel("transfer") },
  { value: "adjustment", label: transactionTypeLabel("adjustment") }
] as const;

type TransactionType = (typeof transactionTypes)[number]["value"];

function todayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function categoryOptionLabel(category: TodayCategory, categories: TodayCategory[]) {
  const parent = category.parent_category_id
    ? categories.find((candidate) => candidate.id === category.parent_category_id)
    : undefined;

  return parent ? `${parent.name} > ${category.name}` : category.name;
}

export function TransactionForm({ accounts, categories }: TransactionFormProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>("expense");
  const [date, setDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const isTransfer = transactionType === "transfer";
  const filteredCategories = categories.filter((category) => {
    if (transactionType === "income") {
      return category.type === "income";
    }

    if (transactionType === "expense") {
      return category.type === "expense";
    }

    if (transactionType === "adjustment") {
      return category.type === "income" || category.type === "expense";
    }

    return false;
  });

  useEffect(() => {
    setDate(todayDate());
  }, []);

  return (
    <form
      action={createTransaction}
      className="space-y-4 rounded-md border border-line bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-normal text-ink">거래 입력</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
          금액
          <input
            name="amount"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
          날짜
          <input
            name="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
            className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
          유형
          <select
            name="type"
            value={transactionType}
            onChange={(event) => {
              setTransactionType(event.target.value as TransactionType);
              setCategoryId("");
              setToAccountId("");
            }}
            required
            className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
          >
            {transactionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
          계좌
          <select
            name="accountId"
            value={accountId}
            onChange={(event) => {
              const nextAccountId = event.target.value;
              setAccountId(nextAccountId);

              if (nextAccountId === toAccountId) {
                setToAccountId("");
              }
            }}
            required
            className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
          >
            <option value="">계좌 선택</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        {isTransfer ? (
          <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
            받을 계좌
            <select
              name="toAccountId"
              value={toAccountId}
              onChange={(event) => setToAccountId(event.target.value)}
              required
              className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
            >
              <option value="">받을 계좌 선택</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id} disabled={account.id === accountId}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
            카테고리
            <select
              name="categoryId"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
            >
              <option value="">카테고리 선택</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {categoryOptionLabel(category, categories)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-ink/75 sm:col-span-2">
          메모
          <input
            name="memo"
            maxLength={240}
            className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
            placeholder="선택 입력"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="h-10 rounded-md bg-leaf px-4 text-sm font-semibold text-white transition-colors hover:bg-leaf/90"
        >
          저장
        </button>
      </div>
    </form>
  );
}
