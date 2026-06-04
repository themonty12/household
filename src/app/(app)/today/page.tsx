import { TransactionForm } from "@/components/forms/transaction-form";
import { SummaryCard } from "@/components/summary-card";
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, WalletCards } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { formatWon } from "@/lib/domain/format";
import { accountTypeLabel, transactionTypeLabel } from "@/lib/domain/labels";
import { getTodayData } from "@/lib/repositories/finance";
import type { TodayRelationName } from "@/lib/repositories/finance";

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

  const recentExpenseTotal = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="page-title">오늘</h1>
        <p className="text-sm leading-6 text-ink/55">
          가족이 함께 쓰는 수입과 지출을 입력하고 최근 거래를 확인합니다.
        </p>
      </div>

      <section aria-label="오늘 요약" className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="표시된 지출" value={formatWon(recentExpenseTotal)} tone="warning" />
        <SummaryCard label="사용 중 계좌" value={accounts.length.toString()} />
        <SummaryCard label="사용 중 카테고리" value={categories.length.toString()} tone="positive" />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
        <div className="space-y-6">
          <TransactionForm accounts={accounts} categories={categories} />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title">최근 거래</h2>
              <span className="text-sm font-semibold text-ink/45">{transactions.length}건</span>
            </div>

            <div className="panel overflow-hidden">
              {transactions.length === 0 ? (
                <p className="p-5 text-sm text-ink/55">아직 입력된 거래가 없습니다.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {transactions.map((transaction) => (
                    <li
                      key={transaction.id}
                      className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition hover:bg-paper/70"
                    >
                      <span className={`flex h-10 w-10 items-center justify-center rounded-md bg-paper ${transactionAmountClass(transaction.type)}`}>
                        {transactionIcon(transaction.type)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-bold text-ink">
                            {transaction.memo || relationName(transaction.categories, transactionLabel(transaction.type))}
                          </span>
                          <span className="hidden shrink-0 text-xs text-ink/40 sm:inline">
                            {transaction.date}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-ink/50">
                          {relationName(transaction.accounts, "계좌")}
                          {transaction.type === "transfer"
                            ? ` → ${relationName(transaction.to_account, "받을 계좌")}`
                            : ` · ${relationName(transaction.categories, "카테고리")}`}
                        </p>
                      </div>
                      <p className={`shrink-0 text-sm font-bold ${transactionAmountClass(transaction.type)}`}>
                        {formatWon(Number(transaction.amount))}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">계좌 현황</h2>
            <span className="text-sm font-semibold text-ink/45">{accounts.length}개</span>
          </div>
          <div className="panel overflow-hidden">
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
          </div>
        </section>
      </div>
    </div>
  );
}
