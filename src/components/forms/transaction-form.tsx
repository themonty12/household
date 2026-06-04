"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

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
      className="panel space-y-5 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">거래 입력</h2>
          <p className="mt-1 text-sm text-ink/50">수입과 지출을 빠르게 기록하세요.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="field-label">
          금액
          <input
            name="amount"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            className="field-control text-lg font-bold"
            placeholder="0"
          />
        </label>

        <label className="field-label">
          날짜
          <input
            name="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
            className="field-control"
          />
        </label>

        <label className="field-label">
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
            className="field-control"
          >
            {transactionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
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
            className="field-control"
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
          <label className="field-label">
            받을 계좌
            <select
              name="toAccountId"
              value={toAccountId}
              onChange={(event) => setToAccountId(event.target.value)}
              required
              className="field-control"
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
          <label className="field-label">
            카테고리
            <select
              name="categoryId"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              className="field-control"
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

        <label className="field-label sm:col-span-2">
          메모
          <input
            name="memo"
            maxLength={240}
            className="field-control"
            placeholder="선택 입력"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="button-add w-full sm:w-auto"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          저장
        </button>
      </div>
    </form>
  );
}
