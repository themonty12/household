import { TransactionForm } from "@/components/forms/transaction-form";
import { SummaryCard } from "@/components/summary-card";
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-normal text-ink">오늘</h1>
        <p className="text-sm leading-6 text-ink/70">
          가족이 함께 쓰는 수입과 지출을 입력하고 최근 거래를 확인합니다.
        </p>
      </div>

      <section aria-label="오늘 요약" className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="표시된 지출" value={formatWon(recentExpenseTotal)} tone="warning" />
        <SummaryCard label="사용 중 계좌" value={accounts.length.toString()} />
        <SummaryCard label="사용 중 카테고리" value={categories.length.toString()} tone="positive" />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-normal text-ink">계좌 현황</h2>
          <span className="text-sm text-ink/60">{accounts.length}개 사용 중</span>
        </div>

        <div className="rounded-md border border-line bg-white p-3 shadow-sm">
          {accounts.length === 0 ? (
            <p className="p-1 text-sm text-ink/65">아직 사용 중인 계좌가 없습니다.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <li key={account.id} className="min-w-0 rounded-md border border-line p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{account.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-normal text-ink/55">
                        {accountTypeLabel(account.type)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">
                      {formatWon(Number(account.current_balance))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <TransactionForm accounts={accounts} categories={categories} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-normal text-ink">최근 거래</h2>
          <span className="text-sm text-ink/60">{transactions.length}건</span>
        </div>

        <div className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
          {transactions.length === 0 ? (
            <p className="p-4 text-sm text-ink/65">아직 입력된 거래가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-line">
              {transactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-ink">
                        {transactionLabel(transaction.type)}
                      </span>
                      <span className="text-sm text-ink/60">{transaction.date}</span>
                    </div>
                    <p className="truncate text-sm text-ink/70">
                      {relationName(transaction.accounts, "계좌")}
                      {transaction.type === "transfer"
                        ? ` → ${relationName(transaction.to_account, "받을 계좌")}`
                        : ` - ${relationName(transaction.categories, "카테고리")}`}
                    </p>
                    {transaction.memo ? (
                      <p className="truncate text-sm text-ink/60">{transaction.memo}</p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-ink sm:text-right">
                    {formatWon(Number(transaction.amount))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
