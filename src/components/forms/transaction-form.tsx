"use client";

import { useState } from "react";

import { createTransaction } from "@/app/actions/transactions";
import type { TodayAccount, TodayCategory } from "@/lib/repositories/finance";

type TransactionFormProps = {
  accounts: TodayAccount[];
  categories: TodayCategory[];
};

const transactionTypes = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
  { value: "adjustment", label: "Adjustment" }
] as const;

type TransactionType = (typeof transactionTypes)[number]["value"];

function todayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function TransactionForm({ accounts, categories }: TransactionFormProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>("expense");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const isTransfer = transactionType === "transfer";

  return (
    <form
      action={createTransaction}
      className="space-y-4 rounded-md border border-line bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-normal text-ink">Add transaction</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
          Amount
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
          Date
          <input
            name="date"
            type="date"
            defaultValue={todayDate()}
            required
            className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
          Type
          <select
            name="type"
            value={transactionType}
            onChange={(event) => setTransactionType(event.target.value as TransactionType)}
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
          Account
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
            <option value="">Choose account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        {isTransfer ? (
          <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
            To account
            <select
              name="toAccountId"
              value={toAccountId}
              onChange={(event) => setToAccountId(event.target.value)}
              required
              className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
            >
              <option value="">Choose destination</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id} disabled={account.id === accountId}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
            Category
            <select
              name="categoryId"
              required
              className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
            >
              <option value="">Choose category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-ink/75 sm:col-span-2">
          Memo
          <input
            name="memo"
            maxLength={240}
            className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
            placeholder="Optional note"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="h-10 rounded-md bg-leaf px-4 text-sm font-semibold text-white transition-colors hover:bg-leaf/90"
        >
          Save
        </button>
      </div>
    </form>
  );
}
