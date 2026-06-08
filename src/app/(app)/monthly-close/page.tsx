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
  Tags,
  WalletCards
} from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { formatPercent, formatWon } from "@/lib/domain/format";
import { accountTypeLabel } from "@/lib/domain/labels";
import { calculateMonthlyClose } from "@/lib/domain/monthly-close";
import { categoryOptionLabel } from "@/lib/domain/transaction-detail";
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
  const { accounts, categories, transactions, budgets, snapshot, previousSnapshot, savedClose } = await getMonthlyCloseData(
    supabase,
    profile.household_id,
    month
  );
  const currentMetrics = calculateMonthlyClose({
    month,
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.date,
      type: transaction.type,
      amount: Number(transaction.amount),
      categoryId: transaction.category_id ?? "",
      accountId: transaction.account_id,
      toAccountId: transaction.to_account_id ?? undefined
    })),
    budgets: budgets.map((budget) => ({
      categoryId: budget.category_id,
      amount: Number(budget.amount)
    })),
    snapshot: snapshot
      ? {
          month: snapshot.month,
          totalAssets: Number(snapshot.total_assets),
          totalLiabilities: Number(snapshot.total_liabilities),
          netWorth: Number(snapshot.net_worth)
        }
      : null,
    previousSnapshot: previousSnapshot
      ? {
          month: previousSnapshot.month,
          totalAssets: Number(previousSnapshot.total_assets),
          totalLiabilities: Number(previousSnapshot.total_liabilities),
          netWorth: Number(previousSnapshot.net_worth)
        }
      : null
  });
  const insights = (savedClose?.insight_items ?? []) as InsightItem[];
  const incomeTotal = savedClose ? Number(savedClose.income_total) : currentMetrics.incomeTotal;
  const expenseTotal = savedClose ? Number(savedClose.expense_total) : currentMetrics.expenseTotal;
  const budgetVariance = savedClose ? Number(savedClose.budget_variance) : currentMetrics.budgetVariance;
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

      <section className="grid items-start gap-5 xl:grid-cols-2">
        <CategoryCloseBreakdown
          categories={categories}
          items={currentMetrics.categoryBreakdown}
        />
        <AccountCloseBreakdown accounts={accounts} items={currentMetrics.accountBreakdown} />
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

type CategoryBreakdownItem = ReturnType<typeof calculateMonthlyClose>["categoryBreakdown"][number];
type AccountBreakdownItem = ReturnType<typeof calculateMonthlyClose>["accountBreakdown"][number];
type MonthlyCloseCategoryItem = Awaited<ReturnType<typeof getMonthlyCloseData>>["categories"][number];
type MonthlyCloseAccountItem = Awaited<ReturnType<typeof getMonthlyCloseData>>["accounts"][number];

function CategoryCloseBreakdown({
  categories,
  items
}: {
  categories: MonthlyCloseCategoryItem[];
  items: CategoryBreakdownItem[];
}) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const maxTotal = Math.max(...items.map((item) => item.total), 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tags aria-hidden="true" className="h-4 w-4 text-info" />
          <h2 className="section-title">카테고리별 결산</h2>
        </div>
        <span className="text-xs font-semibold text-ink/40">{items.length}개</span>
      </div>
      <div className="panel overflow-hidden">
        {items.length === 0 ? (
          <p className="p-5 text-sm text-ink/55">이 월의 카테고리별 거래가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => {
              const category = categoryById.get(item.categoryId);
              const label = category ? categoryOptionLabel(category, categories) : "카테고리 없음";
              const percent = maxTotal === 0 ? 0 : Math.round((item.total / maxTotal) * 100);

              return (
                <li key={item.categoryId} className="px-4 py-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-1 text-xs font-bold ${item.type === "income" ? "bg-leaf/10 text-leaf" : "bg-coral/10 text-coral"}`}>
                          {item.type === "income" ? "수입" : "지출"}
                        </span>
                        <p className="truncate text-sm font-bold text-ink">{label}</p>
                      </div>
                      <p className="mt-1 text-xs text-ink/45">
                        {item.count}건 · 예산 {formatWon(item.budget)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold ${item.type === "income" ? "text-leaf" : "text-coral"}`}>
                        {formatWon(item.total)}
                      </p>
                      <p className="mt-1 text-xs text-ink/40">
                        차이 {formatWon(item.variance)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
                    <div
                      className={`h-full rounded-full ${item.type === "income" ? "bg-leaf" : "bg-coral"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function AccountCloseBreakdown({
  accounts,
  items
}: {
  accounts: MonthlyCloseAccountItem[];
  items: AccountBreakdownItem[];
}) {
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const maxVolume = Math.max(
    ...items.map((item) => item.income + item.expense + item.transferIn + item.transferOut),
    0
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WalletCards aria-hidden="true" className="h-4 w-4 text-leaf" />
          <h2 className="section-title">계좌별 결산</h2>
        </div>
        <span className="text-xs font-semibold text-ink/40">{items.length}개</span>
      </div>
      <div className="panel overflow-hidden">
        {items.length === 0 ? (
          <p className="p-5 text-sm text-ink/55">이 월의 계좌별 거래가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => {
              const account = accountById.get(item.accountId);
              const volume = item.income + item.expense + item.transferIn + item.transferOut;
              const percent = maxVolume === 0 ? 0 : Math.round((volume / maxVolume) * 100);

              return (
                <li key={item.accountId} className="px-4 py-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{account?.name ?? "계좌 없음"}</p>
                      <p className="mt-1 text-xs text-ink/45">
                        {account ? accountTypeLabel(account.type) : "알 수 없음"} · {item.count}건
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold ${item.netChange >= 0 ? "text-leaf" : "text-coral"}`}>
                        {formatWon(item.netChange)}
                      </p>
                      <p className="mt-1 text-xs text-ink/40">순변동</p>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <BreakdownMetric label="수입" value={item.income} tone="income" />
                    <BreakdownMetric label="지출" value={item.expense} tone="expense" />
                    <BreakdownMetric label="이체 입금" value={item.transferIn} tone="transfer" />
                    <BreakdownMetric label="이체 출금" value={item.transferOut} tone="transfer" />
                  </dl>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
                    <div className="h-full rounded-full bg-leaf" style={{ width: `${percent}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function BreakdownMetric({
  label,
  tone,
  value
}: {
  label: string;
  tone: "income" | "expense" | "transfer";
  value: number;
}) {
  const toneClass = {
    expense: "text-coral",
    income: "text-leaf",
    transfer: "text-info"
  }[tone];

  return (
    <div className="rounded-md bg-paper px-2 py-2">
      <dt className="text-ink/45">{label}</dt>
      <dd className={`mt-1 font-bold ${toneClass}`}>{formatWon(value)}</dd>
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
