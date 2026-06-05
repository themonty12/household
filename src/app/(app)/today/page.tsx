import { updateTransaction } from "@/app/actions/transactions";
import { TransactionForm } from "@/components/forms/transaction-form";
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Pencil, WalletCards } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { formatWon } from "@/lib/domain/format";
import { accountTypeLabel, transactionTypeLabel } from "@/lib/domain/labels";
import { categoryOptionLabel, editableCategoriesForTransaction } from "@/lib/domain/transaction-detail";
import { getTodayData } from "@/lib/repositories/finance";
import type { TodayCategory, TodayRelationName, TodayTransaction } from "@/lib/repositories/finance";

function transactionLabel(type: string) {
  return transactionTypeLabel(type);
}

function relationName(relation: TodayRelationName, fallback: string) {
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? fallback;
  }

  return relation?.name ?? fallback;
}

function transactionIcon(type: string) {
  if (type === "income") {
    return <ArrowDownLeft aria-hidden="true" className="h-4 w-4" />;
  }

  if (type === "transfer") {
    return <ArrowRightLeft aria-hidden="true" className="h-4 w-4" />;
  }

  return <ArrowUpRight aria-hidden="true" className="h-4 w-4" />;
}

function transactionAmountClass(type: string) {
  if (type === "income") {
    return "text-leaf";
  }

  if (type === "expense") {
    return "text-coral";
  }

  return "text-info";
}

export default async function TodayPage() {
  const { profile, supabase } = await requireUser();
  const { accounts, categories, transactions } = await getTodayData(
    supabase,
    profile.household_id
  );

  return (
    <div className="space-y-5">
      <div className="hidden items-end justify-between gap-3 md:flex">
        <div>
          <p className="text-xs font-semibold text-ink/40">기록하기</p>
          <h1 className="mt-1 page-title">지출·수입 기록</h1>
        </div>
        <p className="text-sm text-ink/45">가족의 오늘 거래를 빠르게 남겨보세요.</p>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(24rem,1fr)_20rem] xl:grid-cols-[minmax(30rem,1fr)_22rem]">
        <div className="mx-auto w-full max-w-2xl">
          <TransactionForm accounts={accounts} categories={categories} />
          <RecentTransactions
            accounts={accounts}
            categories={categories}
            transactions={transactions}
            className="mt-5 md:hidden"
          />
        </div>

        <aside className="hidden space-y-5 md:block">
          <RecentTransactions accounts={accounts} categories={categories} transactions={transactions} />

          <section className="rounded-lg bg-gradient-to-br from-info to-blue-400 p-4 text-white shadow-panel">
            <p className="text-xs font-semibold text-white/70">우리집 계좌 현황</p>
            <p className="mt-2 text-lg font-bold">{accounts.length}개 계좌 사용 중</p>
            <p className="mt-1 text-xs leading-5 text-white/70">자산 화면에서 전체 잔액과 순자산을 확인하세요.</p>
          </section>

          <section className="panel overflow-hidden">
            {accounts.length === 0 ? (
              <p className="p-5 text-sm text-ink/55">아직 사용 중인 계좌가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-line">
                {accounts.map((account) => (
                  <li key={account.id} className="flex min-w-0 items-center gap-3 px-4 py-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-paper text-ink/55">
                      <WalletCards aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{account.name}</p>
                      <p className="mt-1 text-xs text-ink/45">{accountTypeLabel(account.type)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-ink">
                      {formatWon(Number(account.current_balance))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function RecentTransactions({
  accounts,
  categories,
  className = "",
  transactions
}: {
  accounts: Array<{ id: string; name: string }>;
  categories: TodayCategory[];
  className?: string;
  transactions: TodayTransaction[];
}) {
  return (
    <section className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">최근 거래</h2>
        <span className="text-xs font-bold text-info">수정 가능</span>
      </div>

      <div className="panel overflow-hidden">
        {transactions.length === 0 ? (
          <p className="p-5 text-sm text-ink/55">아직 입력된 거래가 없습니다.</p>
        ) : (
          <div className="divide-y divide-line">
            {transactions.map((transaction) => (
              <details key={transaction.id} className="group">
                <summary className="grid cursor-pointer list-none grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-3 transition hover:bg-paper/70">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-paper ${transactionAmountClass(transaction.type)}`}>
                    {transactionIcon(transaction.type)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-bold text-ink">
                        {transaction.memo || relationName(transaction.categories, transactionLabel(transaction.type))}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-ink/50">
                      {transaction.date} · {relationName(transaction.accounts, "계좌")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className={`text-sm font-bold ${transactionAmountClass(transaction.type)}`}>
                      {formatWon(Number(transaction.amount))}
                    </p>
                    <Pencil aria-hidden="true" className="h-3.5 w-3.5 text-ink/30 transition group-open:text-info" />
                  </div>
                </summary>
                <TransactionEditForm
                  accounts={accounts}
                  categories={categories}
                  transaction={transaction}
                />
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TransactionEditForm({
  accounts,
  categories,
  transaction
}: {
  accounts: Array<{ id: string; name: string }>;
  categories: TodayCategory[];
  transaction: TodayTransaction;
}) {
  const usableCategories = editableCategoriesForTransaction(transaction.type, categories);

  return (
    <form action={updateTransaction} className="grid gap-3 border-t border-line bg-paper/50 p-3">
      <input name="id" type="hidden" value={transaction.id} />
      <input name="type" type="hidden" value={transaction.type} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field-label">
          날짜
          <input className="field-control bg-white" defaultValue={transaction.date} name="date" required type="date" />
        </label>
        <label className="field-label">
          금액
          <input className="field-control bg-white" defaultValue={Number(transaction.amount)} min="0.01" name="amount" required step="0.01" type="number" />
        </label>
        <label className="field-label">
          계좌
          <select className="field-control bg-white" defaultValue={transaction.account_id} name="accountId" required>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </label>
        {transaction.type === "transfer" ? (
          <label className="field-label">
            받을 계좌
            <select className="field-control bg-white" defaultValue={transaction.to_account_id ?? ""} name="toAccountId" required>
              <option value="">받을 계좌 선택</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field-label">
            카테고리
            <select className="field-control bg-white" defaultValue={transaction.category_id ?? ""} name="categoryId" required>
              <option value="">카테고리 선택</option>
              {usableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {categoryOptionLabel(category, categories)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field-label sm:col-span-2">
          메모
          <input className="field-control bg-white" defaultValue={transaction.memo} maxLength={240} name="memo" />
        </label>
      </div>

      <button className="button-primary" type="submit">수정 저장</button>
    </form>
  );
}
