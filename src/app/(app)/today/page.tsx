import { TransactionForm } from "@/components/forms/transaction-form";
import { SummaryCard } from "@/components/summary-card";
import { requireUser } from "@/lib/auth/require-user";
import { formatWon } from "@/lib/domain/format";
import { getTodayData } from "@/lib/repositories/finance";
import type { TodayRelationName } from "@/lib/repositories/finance";

function transactionLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
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
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Today</h1>
        <p className="text-sm leading-6 text-ink/70">
          Enter shared household activity and keep the latest posted transactions in view.
        </p>
      </div>

      <section aria-label="Today summary" className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Shown expenses" value={formatWon(recentExpenseTotal)} tone="warning" />
        <SummaryCard label="Active accounts" value={accounts.length.toString()} />
        <SummaryCard label="Active categories" value={categories.length.toString()} tone="positive" />
      </section>

      <TransactionForm accounts={accounts} categories={categories} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-normal text-ink">Recent transactions</h2>
          <span className="text-sm text-ink/60">{transactions.length} posted</span>
        </div>

        <div className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
          {transactions.length === 0 ? (
            <p className="p-4 text-sm text-ink/65">No posted transactions yet.</p>
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
                      {relationName(transaction.accounts, "Account")}
                      {transaction.type === "transfer"
                        ? ` to ${relationName(transaction.to_account, "destination")}`
                        : ` - ${relationName(transaction.categories, "Category")}`}
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
