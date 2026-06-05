import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, ChevronRight, List, Pencil } from "lucide-react";

import { updateTransaction } from "@/app/actions/transactions";
import { requireUser } from "@/lib/auth/require-user";
import { formatWon } from "@/lib/domain/format";
import { transactionTypeLabel } from "@/lib/domain/labels";
import { categoryOptionLabel, editableCategoriesForTransaction } from "@/lib/domain/transaction-detail";
import {
  getTransactionsHistoryData,
  normalizeMonth,
  nextMonth
} from "@/lib/repositories/finance";
import type {
  TodayAccount,
  TodayCategory,
  TodayRelationName,
  TransactionHistoryItem
} from "@/lib/repositories/finance";

type TransactionsPageProps = {
  searchParams?: Promise<{
    end?: string;
    day?: string;
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

function detailHref({
  day,
  endDate,
  month,
  periodMode,
  startDate,
  view
}: {
  day?: string;
  endDate: string;
  month: string;
  periodMode: boolean;
  startDate: string;
  view: ViewMode;
}) {
  const query = new URLSearchParams({ view });

  if (periodMode) {
    query.set("start", startDate);
    query.set("end", endDate);
  } else {
    query.set("month", monthInputValue(month));
  }

  if (day) {
    query.set("day", day);
  }

  return `/transactions?${query.toString()}` as Route;
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
  const { accounts, categories, transactions } = await getTransactionsHistoryData(
    supabase,
    profile.household_id,
    startDate,
    endDate
  );
  const selectedDate = isDate(params?.day) ? params!.day! : undefined;
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
        <CalendarView
          accounts={accounts}
          categories={categories}
          endDate={endDate}
          month={month}
          periodMode={periodMode}
          selectedDate={selectedDate}
          startDate={startDate}
          transactions={transactions}
        />
      ) : (
        <ListView accounts={accounts} categories={categories} transactions={transactions} />
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

function ListView({
  accounts,
  categories,
  transactions
}: {
  accounts: TodayAccount[];
  categories: TodayCategory[];
  transactions: TransactionHistoryItem[];
}) {
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
                  <TransactionDisclosure
                    accounts={accounts}
                    categories={categories}
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TransactionDisclosure({
  accounts,
  categories,
  transaction
}: {
  accounts: TodayAccount[];
  categories: TodayCategory[];
  transaction: TransactionHistoryItem;
}) {
  return (
    <li>
      <details className="group">
        <summary className="grid cursor-pointer list-none gap-2 px-4 py-3 transition hover:bg-paper/70 sm:grid-cols-[1fr_auto] sm:items-center">
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
              {transaction.date} · {relationName(transaction.accounts, "계좌")}
              {transaction.type === "transfer"
                ? ` → ${relationName(transaction.to_account, "받을 계좌")}`
                : ` · ${relationName(transaction.categories, "카테고리")}`}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <p className={`text-sm font-bold sm:text-right ${amountTone(transaction.type)}`}>
              {formatWon(Number(transaction.amount))}
            </p>
            <Pencil aria-hidden="true" className="h-3.5 w-3.5 text-ink/30 transition group-open:text-info" />
          </div>
        </summary>
        <TransactionDetailPanel accounts={accounts} categories={categories} transaction={transaction} />
      </details>
    </li>
  );
}

function TransactionDetailPanel({
  accounts,
  categories,
  transaction
}: {
  accounts: TodayAccount[];
  categories: TodayCategory[];
  transaction: TransactionHistoryItem;
}) {
  const accountName = relationName(transaction.accounts, "계좌");
  const targetName = relationName(transaction.to_account, "받을 계좌");
  const categoryName = relationName(transaction.categories, "카테고리");

  return (
    <div className="border-t border-line bg-paper/50 p-4">
      <div className="grid gap-3 text-xs text-ink/55 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem label="유형" value={transactionTypeLabel(transaction.type)} />
        <DetailItem label="날짜" value={transaction.date} />
        <DetailItem label="계좌" value={accountName} />
        <DetailItem
          label={transaction.type === "transfer" ? "받을 계좌" : "카테고리"}
          value={transaction.type === "transfer" ? targetName : categoryName}
        />
        <DetailItem label="메모" value={transaction.memo || "메모 없음"} />
        <DetailItem label="입력 시각" value={new Date(transaction.created_at).toLocaleString("ko-KR")} />
      </div>
      <TransactionEditForm accounts={accounts} categories={categories} transaction={transaction} />
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-bold text-ink/35">{label}</p>
      <p className="mt-1 truncate font-semibold text-ink/70">{value}</p>
    </div>
  );
}

function TransactionEditForm({
  accounts,
  categories,
  transaction
}: {
  accounts: TodayAccount[];
  categories: TodayCategory[];
  transaction: TransactionHistoryItem;
}) {
  const usableCategories = editableCategoriesForTransaction(transaction.type, categories);

  return (
    <form action={updateTransaction} className="mt-4 grid gap-3">
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

function CalendarView({
  accounts,
  categories,
  endDate,
  month,
  periodMode,
  selectedDate,
  startDate,
  transactions
}: {
  accounts: TodayAccount[];
  categories: TodayCategory[];
  endDate: string;
  month: string;
  periodMode: boolean;
  selectedDate?: string;
  startDate: string;
  transactions: TransactionHistoryItem[];
}) {
  const days = buildCalendarDays(startDate, endDate);
  const grouped = groupByDate(transactions);
  const selectedItems = selectedDate ? grouped[selectedDate] ?? [] : [];

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
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
            const isSelected = selectedDate === date;

            return (
              <Link
                aria-label={`${date} 거래 ${items.length}건 보기`}
                className={`min-w-0 border-b border-r border-line/50 p-1.5 transition hover:bg-paper/70 sm:min-h-32 sm:p-3 ${
                  isSelected ? "bg-info/10 ring-2 ring-inset ring-info/35" : ""
                }`}
                href={detailHref({
                  day: date,
                  endDate,
                  month,
                  periodMode,
                  startDate,
                  view: "calendar"
                })}
                key={date}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-[11px] font-bold sm:text-xs ${isSelected ? "text-info" : "text-ink/55"}`}>{day}</p>
                  <span className="hidden items-center gap-1 text-xs text-ink/35 md:flex">
                    {items.length}건
                    <ChevronRight aria-hidden="true" className="h-3 w-3" />
                  </span>
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
              </Link>
            );
          })}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 bg-paper/70 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-ink">{selectedDate ?? "날짜 선택"}</h2>
            <p className="mt-1 text-xs text-ink/45">
              {selectedDate ? `거래 ${selectedItems.length}건` : "달력에서 날짜를 선택하세요."}
            </p>
          </div>
          {selectedDate ? (
            <Link className="text-xs font-bold text-info" href={detailHref({ endDate, month, periodMode, startDate, view: "calendar" })}>
              선택 해제
            </Link>
          ) : null}
        </div>
        {!selectedDate ? (
          <p className="p-5 text-sm text-ink/55">날짜를 누르면 해당 날짜의 거래가 목록으로 표시됩니다.</p>
        ) : selectedItems.length === 0 ? (
          <p className="p-5 text-sm text-ink/55">선택한 날짜에 거래 내역이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line">
            {selectedItems.map((transaction) => (
              <TransactionDisclosure
                accounts={accounts}
                categories={categories}
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
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
