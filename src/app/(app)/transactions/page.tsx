import Link from "next/link";
import { CalendarDays, List } from "lucide-react";

import { requireUser } from "@/lib/auth/require-user";
import { formatWon } from "@/lib/domain/format";
import { transactionTypeLabel } from "@/lib/domain/labels";
import {
  getTransactionsHistoryData,
  normalizeMonth,
  nextMonth
} from "@/lib/repositories/finance";
import type { TodayRelationName, TransactionHistoryItem } from "@/lib/repositories/finance";

type TransactionsPageProps = {
  searchParams?: Promise<{
    end?: string;
    month?: string;
    start?: string;
    view?: string;
  }>;
};

type ViewMode = "list" | "calendar";

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

function isDate(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, count: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + count);
  return next;
}

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"] as const;
const calendarAmountFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0
});

function formatCalendarAmount(value: number) {
  return calendarAmountFormatter.format(Math.round(value));
}

function relationName(relation: TodayRelationName, fallback: string) {
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? fallback;
  }

  return relation?.name ?? fallback;
}

function amountTone(type: string) {
  if (type === "income") return "text-leaf";
  if (type === "expense") return "text-coral";
  return "text-info";
}

function chipTone(type: string) {
  if (type === "income") return "bg-leaf/10 text-leaf";
  if (type === "expense") return "bg-coral/10 text-coral";
  return "bg-info/10 text-info";
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = await searchParams;
  const view: ViewMode = params?.view === "calendar" ? "calendar" : "list";
  const month = resolveMonth(params?.month);
  const periodMode = isDate(params?.start) && isDate(params?.end);
  const monthStart = month;
  const monthEnd = formatDate(addDays(new Date(`${nextMonth(monthStart)}T00:00:00.000Z`), -1));
  const startDate = periodMode ? params!.start! : monthStart;
  const endDate = periodMode ? params!.end! : monthEnd;
  const { profile, supabase } = await requireUser();
  const { transactions } = await getTransactionsHistoryData(
    supabase,
    profile.household_id,
    startDate,
    endDate
  );
  const incomeTotal = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const expenseTotal = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const transferTotal = transactions
    .filter((transaction) => transaction.type === "transfer")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const viewQuery = periodMode
    ? `start=${startDate}&end=${endDate}`
    : `month=${monthInputValue(month)}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-1">
          <p className="hidden text-xs font-semibold text-ink/40 md:block">Ledger</p>
          <h1 className="page-title">거래 내역</h1>
          <p className="text-sm leading-6 text-ink/55">
            월별 또는 원하는 기간의 수입과 지출을 목록과 달력으로 확인합니다.
          </p>
        </div>
        <div className="flex rounded-md bg-paper p-1">
          <Link
            className={`flex h-10 items-center gap-2 rounded px-3 text-sm font-bold ${view === "list" ? "bg-white text-ink shadow-sm" : "text-ink/45"}`}
            href={`/transactions?${viewQuery}&view=list`}
          >
            <List aria-hidden="true" className="h-4 w-4" />
            목록
          </Link>
          <Link
            className={`flex h-10 items-center gap-2 rounded px-3 text-sm font-bold ${view === "calendar" ? "bg-white text-ink shadow-sm" : "text-ink/45"}`}
            href={`/transactions?${viewQuery}&view=calendar`}
          >
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            달력
          </Link>
        </div>
      </div>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.45fr)]">
        <div className="panel p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(10rem,0.7fr)_1fr_auto] sm:items-end">
            <form action="/transactions" className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <input name="view" type="hidden" value={view} />
              <label className="field-label">
                출력 월
                <input className="field-control" defaultValue={monthInputValue(month)} name="month" type="month" />
              </label>
              <button className="button-secondary" type="submit">월 보기</button>
            </form>

            <form action="/transactions" className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <input name="view" type="hidden" value={view} />
              <label className="field-label">
                시작일
                <input className="field-control" defaultValue={periodMode ? startDate : ""} name="start" type="date" />
              </label>
              <label className="field-label">
                종료일
                <input className="field-control" defaultValue={periodMode ? endDate : ""} name="end" type="date" />
              </label>
              <button className="button-primary" type="submit">기간 적용</button>
            </form>

            <Link className="button-secondary" href={`/transactions?month=${monthInputValue(month)}&view=${view}`}>
              기간 해제
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SummaryMetric label="수입" tone="income" value={formatWon(incomeTotal)} />
          <SummaryMetric label="지출" tone="expense" value={formatWon(expenseTotal)} />
          <SummaryMetric label="이체" tone="transfer" value={formatWon(transferTotal)} />
        </div>
      </section>

      {view === "calendar" ? (
        <CalendarView endDate={endDate} startDate={startDate} transactions={transactions} />
      ) : (
        <ListView transactions={transactions} />
      )}
    </div>
  );
}

function SummaryMetric({
  label,
  tone,
  value
}: {
  label: string;
  tone: "income" | "expense" | "transfer";
  value: string;
}) {
  const toneClass = {
    expense: "text-coral",
    income: "text-leaf",
    transfer: "text-info"
  }[tone];

  return (
    <div className="panel p-4">
      <p className="text-xs font-bold text-ink/40">{label}</p>
      <p className={`mt-2 text-sm font-bold sm:text-base ${toneClass}`}>{value}</p>
    </div>
  );
}

function ListView({ transactions }: { transactions: TransactionHistoryItem[] }) {
  const grouped = groupByDate(transactions);

  return (
    <section className="panel overflow-hidden">
      {transactions.length === 0 ? (
        <p className="p-5 text-sm text-ink/55">해당 기간의 거래 내역이 없습니다.</p>
      ) : (
        <div className="divide-y divide-line">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="bg-paper/70 px-4 py-2 text-xs font-bold text-ink/45">{date}</div>
              <ul className="divide-y divide-line">
                {items.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TransactionRow({ transaction }: { transaction: TransactionHistoryItem }) {
  return (
    <li className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-2 py-1 text-xs font-bold ${chipTone(transaction.type)}`}>
            {transactionTypeLabel(transaction.type)}
          </span>
          <p className="truncate text-sm font-bold text-ink">
            {transaction.memo || relationName(transaction.categories, "카테고리")}
          </p>
        </div>
        <p className="mt-1 truncate text-xs text-ink/45">
          {relationName(transaction.accounts, "계좌")}
          {transaction.type === "transfer"
            ? ` → ${relationName(transaction.to_account, "받을 계좌")}`
            : ` · ${relationName(transaction.categories, "카테고리")}`}
        </p>
      </div>
      <p className={`text-sm font-bold sm:text-right ${amountTone(transaction.type)}`}>
        {formatWon(Number(transaction.amount))}
      </p>
    </li>
  );
}

function CalendarView({
  endDate,
  startDate,
  transactions
}: {
  endDate: string;
  startDate: string;
  transactions: TransactionHistoryItem[];
}) {
  const days = buildCalendarDays(startDate, endDate);
  const grouped = groupByDate(transactions);

  return (
    <section className="panel overflow-hidden bg-white">
      <div className="grid grid-cols-7 border-b border-line bg-white">
        {weekdayLabels.map((weekday, index) => (
          <div
            key={weekday}
            className={`py-2 text-center text-xs font-bold ${
              index === 0 ? "text-coral" : index === 6 ? "text-info" : "text-ink/45"
            }`}
          >
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 bg-white">
        {days.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`blank-${index}`}
                className="min-h-[76px] border-b border-r border-line/50 bg-mist/35 sm:min-h-32"
              />
            );
          }

          const items = grouped[date] ?? [];
          const income = items
            .filter((transaction) => transaction.type === "income")
            .reduce((total, transaction) => total + Number(transaction.amount), 0);
          const expense = items
            .filter((transaction) => transaction.type === "expense")
            .reduce((total, transaction) => total + Number(transaction.amount), 0);
          const day = Number(date.slice(8, 10));

          return (
            <div key={date} className="min-w-0 border-b border-r border-line/50 p-1.5 sm:min-h-32 sm:p-3">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[11px] font-bold text-ink/55 sm:text-xs">{day}</p>
                <span className="hidden text-xs text-ink/35 md:inline">{items.length}건</span>
              </div>
              <div className="mt-2 min-w-0 space-y-0.5 sm:mt-3 sm:space-y-1">
                {income > 0 ? (
                  <p className="truncate text-[9px] font-bold leading-tight tracking-tight text-leaf sm:text-xs">
                    +{formatCalendarAmount(income)}
                  </p>
                ) : null}
                {expense > 0 ? (
                  <p className="truncate text-[9px] font-bold leading-tight tracking-tight text-coral sm:text-xs">
                    -{formatCalendarAmount(expense)}
                  </p>
                ) : null}
              </div>
              <div className="mt-3 hidden space-y-1 md:block">
                {items.slice(0, 3).map((transaction) => (
                  <p key={transaction.id} className={`truncate text-xs font-semibold ${amountTone(transaction.type)}`}>
                    {transaction.memo || relationName(transaction.categories, transactionTypeLabel(transaction.type))}
                  </p>
                ))}
                {items.length > 3 ? <p className="text-xs text-ink/35">+{items.length - 3}건 더</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function groupByDate(transactions: TransactionHistoryItem[]) {
  return transactions.reduce<Record<string, TransactionHistoryItem[]>>((groups, transaction) => {
    groups[transaction.date] ??= [];
    groups[transaction.date].push(transaction);
    return groups;
  }, {});
}

function buildCalendarDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const days: Array<string | null> = Array.from({ length: start.getUTCDay() }, () => null);

  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    days.push(formatDate(cursor));
  }

  return days;
}
