import { regenerateMonthlyClose } from "@/app/actions/monthly-close";
import { SummaryCard } from "@/components/summary-card";
import { requireUser } from "@/lib/auth/require-user";
import { formatPercent, formatWon } from "@/lib/domain/format";
import type { InsightItem } from "@/lib/domain/types";
import { getMonthlyCloseData, normalizeMonth } from "@/lib/repositories/finance";

type MonthlyClosePageProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

function currentMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function monthInputValue(month: string) {
  return month.slice(0, 7);
}

function resolveMonth(month?: string) {
  try {
    return normalizeMonth(month ?? currentMonthStart());
  } catch {
    return currentMonthStart();
  }
}

function insightTone(severity: InsightItem["severity"]) {
  if (severity === "positive") {
    return "border-leaf/30 bg-leaf/10 text-leaf";
  }

  if (severity === "warning") {
    return "border-gold/40 bg-gold/10 text-gold";
  }

  return "border-line bg-white text-ink";
}

export default async function MonthlyClosePage({
  searchParams
}: MonthlyClosePageProps) {
  const params = await searchParams;
  const month = resolveMonth(params?.month);
  const { profile, supabase } = await requireUser();
  const canRegenerate = profile.role === "admin";
  const { transactions, budgets, snapshot, savedClose } = await getMonthlyCloseData(
    supabase,
    profile.household_id,
    month
  );
  const insights = (savedClose?.insight_items ?? []) as InsightItem[];
  const incomeTotal = savedClose ? Number(savedClose.income_total) : 0;
  const expenseTotal = savedClose ? Number(savedClose.expense_total) : 0;
  const budgetVariance = savedClose ? Number(savedClose.budget_variance) : 0;
  const netWorthChange =
    savedClose?.net_worth_change === null || savedClose?.net_worth_change === undefined
      ? null
      : Number(savedClose.net_worth_change);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal text-ink">
            Monthly Close
          </h1>
          <p className="text-sm leading-6 text-ink/70">
            Regenerate the household month-end summary after transactions, budgets, or snapshots change.
          </p>
        </div>

        <form action="/monthly-close" className="flex items-center gap-2">
          <input
            aria-label="Month"
            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink shadow-sm"
            defaultValue={monthInputValue(month)}
            name="month"
            type="month"
          />
          <button
            className="h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-paper"
            type="submit"
          >
            View
          </button>
        </form>
      </div>

      <section aria-label="Monthly close summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Income" value={formatWon(incomeTotal)} tone="positive" />
        <SummaryCard label="Expenses" value={formatWon(expenseTotal)} tone="warning" />
        <SummaryCard
          label="Budget variance"
          value={formatWon(budgetVariance)}
          tone={budgetVariance > 0 ? "warning" : "neutral"}
        />
        <SummaryCard
          label="Savings rate"
          value={formatPercent(
            savedClose?.savings_rate === null || savedClose?.savings_rate === undefined
              ? null
              : Number(savedClose.savings_rate)
          )}
          tone="positive"
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3 rounded-md border border-line bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-normal text-ink">
                Close status
              </h2>
              <p className="mt-1 text-sm text-ink/65">
                {savedClose
                  ? `Generated ${new Date(savedClose.generated_at).toLocaleDateString()}`
                  : "No monthly close saved yet."}
              </p>
            </div>
            {canRegenerate ? (
              <form action={regenerateMonthlyClose}>
                <input name="month" type="hidden" value={month} />
                <button
                  className="h-10 rounded-md bg-ink px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-ink/85"
                  type="submit"
                >
                  Regenerate
                </button>
              </form>
            ) : null}
          </div>

          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-line p-3">
              <dt className="text-xs uppercase tracking-normal text-ink/55">Transactions</dt>
              <dd className="mt-2 text-xl font-semibold text-ink">{transactions.length}</dd>
            </div>
            <div className="rounded-md border border-line p-3">
              <dt className="text-xs uppercase tracking-normal text-ink/55">Budgets</dt>
              <dd className="mt-2 text-xl font-semibold text-ink">{budgets.length}</dd>
            </div>
            <div className="rounded-md border border-line p-3">
              <dt className="text-xs uppercase tracking-normal text-ink/55">Net worth change</dt>
              <dd className="mt-2 text-xl font-semibold text-ink">
                {netWorthChange === null ? "N/A" : formatWon(netWorthChange)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold tracking-normal text-ink">Snapshot</h2>
          {snapshot ? (
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink/65">Assets</dt>
                <dd className="font-semibold text-ink">{formatWon(Number(snapshot.total_assets))}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink/65">Liabilities</dt>
                <dd className="font-semibold text-ink">
                  {formatWon(Number(snapshot.total_liabilities))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink/65">Net worth</dt>
                <dd className="font-semibold text-ink">{formatWon(Number(snapshot.net_worth))}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-ink/65">No snapshot for this month.</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-normal text-ink">Insights</h2>
          <span className="text-sm text-ink/60">{insights.length} saved</span>
        </div>

        {insights.length === 0 ? (
          <div className="rounded-md border border-line bg-white p-4 text-sm text-ink/65 shadow-sm">
            Regenerate the close to save insights for this month.
          </div>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {insights.map((insight, index) => (
              <li
                key={`${insight.title}-${index}`}
                className={`rounded-md border p-4 shadow-sm ${insightTone(insight.severity)}`}
              >
                <p className="text-sm font-semibold text-current">{insight.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink/70">{insight.message}</p>
                {insight.suggestedAction ? (
                  <p className="mt-3 text-sm font-medium text-ink">
                    {insight.suggestedAction}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
