import { regenerateMonthlyClose } from "@/app/actions/monthly-close";
import { SummaryCard } from "@/components/summary-card";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CalendarDays,
  ChartNoAxesCombined,
  RefreshCw,
  Sparkles,
  WalletCards
} from "lucide-react";
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
        <div className="space-y-1">
          <p className="hidden text-xs font-semibold text-ink/40 md:block">Reports</p>
          <h1 className="page-title">월 결산</h1>
          <p className="text-sm leading-6 text-ink/55">
            거래, 예산, 자산 스냅샷이 바뀐 뒤 월별 결산과 의견을 다시 생성합니다.
          </p>
        </div>

        <form action="/monthly-close" className="flex items-center gap-2">
          <input
            aria-label="월"
            className="field-control min-w-0 flex-1 text-sm sm:w-40"
            defaultValue={monthInputValue(month)}
            name="month"
            type="month"
          />
          <button
            className="button-secondary shrink-0"
            type="submit"
          >
            조회
          </button>
        </form>
      </div>

      <section className="rounded-lg bg-slate p-5 text-white shadow-panel sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/55">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              {monthInputValue(month)} 결산 요약
            </div>
            <p className="mt-3 text-3xl font-bold sm:text-4xl">
              {formatWon(incomeTotal - expenseTotal)}
            </p>
            <p className="mt-2 text-sm text-white/50">이번 달 수입에서 지출을 제외한 금액</p>
          </div>
          {canRegenerate ? (
            <form action={regenerateMonthlyClose}>
              <input name="month" type="hidden" value={month} />
              <button className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-slate transition hover:bg-white/90" type="submit">
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                결산 생성
              </button>
            </form>
          ) : null}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:grid-cols-4">
          <CloseMetric label="수입" value={formatWon(incomeTotal)} positive />
          <CloseMetric label="지출" value={formatWon(expenseTotal)} />
          <CloseMetric label="예산 차이" value={formatWon(budgetVariance)} />
          <CloseMetric
            label="저축률"
            value={formatPercent(
              savedClose?.savings_rate === null || savedClose?.savings_rate === undefined
                ? null
                : Number(savedClose.savings_rate)
            )}
            positive
          />
        </div>
      </section>

      <section aria-label="월 결산 요약" className="grid gap-3 sm:grid-cols-2 lg:hidden">
        <SummaryCard label="수입" value={formatWon(incomeTotal)} tone="positive" />
        <SummaryCard label="지출" value={formatWon(expenseTotal)} tone="warning" />
        <SummaryCard
          label="예산 차이"
          value={formatWon(budgetVariance)}
          tone={budgetVariance > 0 ? "warning" : "neutral"}
        />
        <SummaryCard
          label="저축률"
          value={formatPercent(
            savedClose?.savings_rate === null || savedClose?.savings_rate === undefined
              ? null
              : Number(savedClose.savings_rate)
          )}
          tone="positive"
        />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="h-4 w-4 text-info" />
            <h2 className="section-title">자동 의견</h2>
          </div>
          <span className="text-xs font-semibold text-ink/40">{insights.length}개</span>
        </div>

        {insights.length === 0 ? (
          <div className="panel p-5 text-sm text-ink/55">
            이 월의 자동 의견을 저장하려면 결산을 다시 생성해 주세요.
          </div>
        ) : (
          <ul className="grid gap-3">
            {insights.map((insight, index) => (
              <li key={`${insight.title}-${index}`} className="panel flex gap-3 p-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${insight.severity === "warning" ? "bg-coral/10 text-coral" : insight.severity === "positive" ? "bg-leaf/10 text-leaf" : "bg-info/10 text-info"}`}>
                  <Bot aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{insight.title}</p>
                  <p className="mt-1 text-sm leading-6 text-ink/55">{insight.message}</p>
                  {insight.suggestedAction ? (
                    <p className="mt-2 text-xs font-bold text-info">{insight.suggestedAction}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="space-y-4">
        <div className="panel space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ChartNoAxesCombined aria-hidden="true" className="h-4 w-4 text-leaf" />
                <h2 className="section-title">결산 상태</h2>
              </div>
              <p className="mt-1 text-sm text-ink/65">
                {savedClose
                  ? `${new Date(savedClose.generated_at).toLocaleDateString()} 생성됨`
                  : "아직 저장된 월 결산이 없습니다."}
              </p>
            </div>
          </div>

          <dl className="grid gap-3">
            <div className="rounded-md border border-line p-3">
              <dt className="text-xs uppercase tracking-normal text-ink/55">거래</dt>
              <dd className="mt-2 text-xl font-semibold text-ink">{transactions.length}</dd>
            </div>
            <div className="rounded-md border border-line p-3">
              <dt className="text-xs uppercase tracking-normal text-ink/55">예산</dt>
              <dd className="mt-2 text-xl font-semibold text-ink">{budgets.length}</dd>
            </div>
            <div className="rounded-md border border-line p-3">
              <dt className="text-xs uppercase tracking-normal text-ink/55">순자산 변화</dt>
              <dd className="mt-2 text-xl font-semibold text-ink">
                {netWorthChange === null ? "없음" : formatWon(netWorthChange)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <WalletCards aria-hidden="true" className="h-4 w-4 text-info" />
            <h2 className="section-title">자산 스냅샷</h2>
          </div>
          {snapshot ? (
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink/65">자산</dt>
                <dd className="font-semibold text-ink">{formatWon(Number(snapshot.total_assets))}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink/65">부채</dt>
                <dd className="font-semibold text-ink">
                  {formatWon(Number(snapshot.total_liabilities))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink/65">순자산</dt>
                <dd className="font-semibold text-ink">{formatWon(Number(snapshot.net_worth))}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-ink/65">이 월의 스냅샷이 없습니다.</p>
          )}
        </div>
      </aside>
      </div>
    </div>
  );
}

function CloseMetric({
  label,
  value,
  positive = false
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-white/45">
        <Icon aria-hidden="true" className="h-3 w-3" />
        {label}
      </p>
      <p className={`mt-1 text-sm font-bold ${positive ? "text-emerald-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
