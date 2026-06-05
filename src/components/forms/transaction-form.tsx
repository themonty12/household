"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Plus, Tags } from "lucide-react";
import clsx from "clsx";

import { createTransaction } from "@/app/actions/transactions";
import { formatIntegerInput } from "@/lib/domain/format";
import { transactionTypeLabel } from "@/lib/domain/labels";
import type { TodayAccount, TodayCategory } from "@/lib/repositories/finance";

type TransactionFormProps = {
  accounts: TodayAccount[];
  categories: TodayCategory[];
};

const transactionTypes = [
  { value: "expense", label: transactionTypeLabel("expense") },
  { value: "income", label: transactionTypeLabel("income") },
  { value: "transfer", label: transactionTypeLabel("transfer") }
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
  const [date, setDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const isTransfer = transactionType === "transfer";
  const filteredCategories = categories.filter((category) => {
    if (transactionType === "income") {
      return category.type === "income";
    }

    if (transactionType === "expense") {
      return category.type === "expense";
    }

    return false;
  });
  const parentCategories = filteredCategories.filter(
    (category) => category.parent_category_id === null
  );
  const childCategories = filteredCategories.filter(
    (category) => category.parent_category_id === parentCategoryId
  );
  const canSubmit =
    Boolean(amount && accountId && date) &&
    (isTransfer ? Boolean(toAccountId) : Boolean(categoryId));

  useEffect(() => {
    setDate(todayDate());
  }, []);

  async function handleCreateTransaction(formData: FormData) {
    await createTransaction(formData);
    setTransactionType("expense");
    setDate(todayDate());
    setAccountId("");
    setToAccountId("");
    setAmount("");
    setParentCategoryId("");
    setCategoryId("");
  }

  return (
    <form
      action={handleCreateTransaction}
      className="panel overflow-hidden"
    >
      <div className="border-b border-line px-4 py-4 sm:px-6">
        <div className="grid grid-cols-3 rounded-md bg-paper p-1">
          {transactionTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => {
                setTransactionType(type.value);
                setParentCategoryId("");
                setCategoryId("");
                setToAccountId("");
              }}
              className={clsx(
                "min-h-10 rounded px-2 text-xs font-bold transition sm:text-sm",
                transactionType === type.value
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink/40 hover:text-ink"
              )}
            >
              {type.label}
            </button>
          ))}
          <input name="type" type="hidden" value={transactionType} />
        </div>
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        <label className="block text-center">
          <span className="text-xs font-semibold text-ink/40">얼마를 기록할까요?</span>
          <span className="mt-2 flex items-center justify-center gap-2">
          <input
            aria-label="금액"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(formatIntegerInput(event.target.value))}
            required
            className="min-w-0 max-w-[12rem] border-0 bg-transparent text-center text-4xl font-bold text-ink outline-none placeholder:text-ink/20"
            placeholder="0"
          />
          <input name="amount" type="hidden" value={amount.replace(/,/g, "")} />
          <span className="text-xl font-bold text-ink">원</span>
          </span>
        </label>

        {!isTransfer ? (
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-ink">카테고리</legend>
            <p className="text-xs font-semibold text-ink/40">대분류를 선택하세요</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {parentCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    const children = filteredCategories.filter(
                      (candidate) => candidate.parent_category_id === category.id
                    );
                    setParentCategoryId(category.id);
                    setCategoryId(children.length === 0 ? category.id : "");
                  }}
                  className={clsx(
                    "flex min-h-[4.75rem] flex-col items-center justify-center gap-2 rounded-md border text-xs font-semibold transition",
                    parentCategoryId === category.id
                      ? "border-slate bg-slate text-white"
                      : "border-line bg-white text-ink/55 hover:bg-paper"
                  )}
                >
                  <Tags aria-hidden="true" className="h-4 w-4" />
                  <span className="max-w-full truncate px-1">{category.name}</span>
                </button>
              ))}
            </div>
            {parentCategoryId && childCategories.length > 0 ? (
              <div className="space-y-2 rounded-md bg-paper p-3">
                <p className="text-xs font-bold text-ink/50">소분류를 선택하세요</p>
                <div className="flex flex-wrap gap-2">
                  {childCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(category.id)}
                      className={clsx(
                        "min-h-10 rounded-md px-3 text-xs font-bold transition",
                        categoryId === category.id
                          ? "bg-info text-white"
                          : "border border-line bg-white text-ink/55 hover:text-ink"
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <input name="categoryId" type="hidden" value={categoryId} />
          </fieldset>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field-label">
            날짜
            <span className="relative">
              <CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <input name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="field-control w-full pl-9" />
            </span>
          </label>

          <label className="field-label">
            결제 수단
            <select name="accountId" value={accountId} onChange={(event) => {
              const nextAccountId = event.target.value;
              setAccountId(nextAccountId);
              if (nextAccountId === toAccountId) setToAccountId("");
            }} required className="field-control">
              <option value="">계좌 선택</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>

          {isTransfer ? (
            <label className="field-label sm:col-span-2">
              받을 계좌
              <select name="toAccountId" value={toAccountId} onChange={(event) => setToAccountId(event.target.value)} required className="field-control">
                <option value="">받을 계좌 선택</option>
                {accounts.map((account) => <option key={account.id} value={account.id} disabled={account.id === accountId}>{account.name}</option>)}
              </select>
            </label>
          ) : null}

          <label className="field-label sm:col-span-2">
            메모
            <input name="memo" maxLength={240} className="field-control" placeholder="내용을 입력해 주세요" />
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="button-primary w-full disabled:cursor-not-allowed disabled:bg-ink/20"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          저장하기
        </button>
      </div>
    </form>
  );
}
