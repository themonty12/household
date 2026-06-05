import Link from "next/link";
import { saveAccount, saveBudget } from "@/app/actions/settings";
import { ArrowRight, ChevronDown, PiggyBank, Plus, Tags, Users, WalletCards } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-user";
import {
  accountTypeLabel,
  categoryTypeLabel,
  membershipStatusLabel,
  recordStatusLabel,
  roleLabel
} from "@/lib/domain/labels";
import { getSettingsData, normalizeMonth } from "@/lib/repositories/finance";

type SettingsPageProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

const accountTypes = [
  "cash",
  "bank",
  "card",
  "investment",
  "loan",
  "other_asset",
  "other_liability"
] as const;

const recordStatuses = ["active", "archived"] as const;

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

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const month = resolveMonth(params?.month);
  const { profile, supabase } = await requireAdmin();
  const { accounts, categories, budgets, profiles } = await getSettingsData(
    supabase,
    profile.household_id,
    month
  );
  const expenseCategories = categories.filter(
    (category) =>
      category.type === "expense" &&
      category.status === "active" &&
      category.parent_category_id === null
  );
  const budgetByCategory = new Map(
    budgets.map((budget) => [budget.category_id, Number(budget.amount)])
  );
  const allRootCategories = categories.filter((category) => category.parent_category_id === null);

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1">
          <h1 className="page-title">설정</h1>
          <p className="text-sm leading-6 text-ink/55">
            계좌, 카테고리, 월 예산을 관리합니다. 보관 처리한 항목은 과거 기록을
            유지하면서 입력 화면에서 제외됩니다.
          </p>
        </div>
        <form action="/settings" className="flex items-center gap-2">
          <input
            aria-label="예산 월"
            className="field-control min-w-0 flex-1 text-sm sm:w-40"
            defaultValue={monthInputValue(month)}
            name="month"
            type="month"
          />
          <button
            className="button-secondary shrink-0"
            type="submit"
          >
            예산 월 보기
          </button>
        </form>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
      <section className="order-4 grid gap-3 lg:col-start-2 lg:row-start-2">
        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <Users aria-hidden="true" className="h-4 w-4 text-leaf" />
            <h2 className="section-title">현재 관리자</h2>
          </div>
          <p className="mt-3 truncate text-sm font-semibold text-ink">
            {profile.display_name}
          </p>
          <p className="mt-1 text-xs uppercase tracking-normal text-ink/55">
            {roleLabel(profile.role)}
          </p>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">
              가족 구성원
            </h2>
            <span className="text-sm text-ink/60">{profiles.length}명</span>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {profiles.map((member) => (
              <li
                key={member.id}
                className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <span className="font-medium text-ink">{member.display_name}</span>
                <span className="text-ink/60">
                  {roleLabel(member.role)} · {membershipStatusLabel(member.status)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            새 가족 구성원 초대와 비밀번호 관리는 Supabase Auth에서 처리합니다.
          </p>
        </div>
      </section>

      <section className="order-2 space-y-3 lg:col-start-2 lg:row-start-1">
        <div className="flex items-center gap-2">
          <WalletCards aria-hidden="true" className="h-5 w-5 text-leaf" />
          <h2 className="text-lg font-bold text-ink">계좌 관리</h2>
        </div>
        <div className="grid gap-3">
          <AccountForm title="새 계좌 추가" isNew />
          {accounts.map((account) => (
            <AccountForm key={account.id} title={account.name} account={account} />
          ))}
        </div>
      </section>

      <section className="order-1 space-y-3 lg:col-start-1 lg:row-start-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tags aria-hidden="true" className="h-5 w-5 text-leaf" />
            <h2 className="text-lg font-bold text-ink">카테고리</h2>
          </div>
          <Link href="/settings/categories" className="button-add">
            상세 관리
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <div className="panel overflow-hidden">
          {allRootCategories.length === 0 ? (
            <p className="p-5 text-sm text-ink/55">저장된 카테고리가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-line">
              {allRootCategories.map((root) => {
                const children = categories.filter(
                  (category) => category.parent_category_id === root.id
                );

                return (
                  <li key={root.id} className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{root.name}</p>
                        <p className="mt-1 text-xs text-ink/40">
                          {categoryTypeLabel(root.type)} · {recordStatusLabel(root.status)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-ink/40">
                        소분류 {children.length}개
                      </span>
                    </div>
                    {children.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {children.map((category) => (
                          <span key={category.id} className="rounded-md bg-paper px-2 py-1 text-xs font-semibold text-ink/50">
                            {category.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="order-3 space-y-3 lg:col-start-1 lg:row-start-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PiggyBank aria-hidden="true" className="h-5 w-5 text-leaf" />
            <h2 className="text-lg font-bold text-ink">월 예산 관리</h2>
          </div>
          <span className="text-sm text-ink/60">{monthInputValue(month)}</span>
        </div>
        {expenseCategories.length === 0 ? (
          <div className="panel p-4 text-sm text-ink/65">
            예산을 설정하려면 먼저 사용 중인 지출 카테고리를 추가해 주세요.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {expenseCategories.map((category) => (
              <form
                key={category.id}
                action={saveBudget}
                className="panel grid gap-3 p-4 sm:grid-cols-[1fr_auto]"
              >
                <input name="month" type="hidden" value={month} />
                <input name="categoryId" type="hidden" value={category.id} />
                <label className="field-label">
                  {category.name}
                  <input
                    className="field-control"
                    defaultValue={budgetByCategory.get(category.id) ?? 0}
                    min="0"
                    name="amount"
                    step="1000"
                    type="number"
                  />
                </label>
                <button
                  className="button-primary self-end"
                  type="submit"
                >
                  예산 저장
                </button>
              </form>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}

type AccountFormProps = {
  title: string;
  isNew?: boolean;
  account?: {
    id: string;
    name: string;
    type: string;
    current_balance: string | number;
    include_in_net_worth: boolean;
    status: "active" | "archived";
  };
};

function AccountForm({ title, account, isNew = false }: AccountFormProps) {
  return (
    <details className="panel group overflow-hidden" open={isNew || undefined}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${isNew ? "bg-leaf text-white" : "bg-paper text-ink/55"}`}>
            {isNew ? <Plus aria-hidden="true" className="h-4 w-4" /> : <WalletCards aria-hidden="true" className="h-4 w-4" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-ink">{title}</span>
            <span className="mt-0.5 block text-xs text-ink/45">
              {account ? `${accountTypeLabel(account.type)} · ${recordStatusLabel(account.status)}` : "새 계좌 정보를 입력하세요."}
            </span>
          </span>
        </div>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-ink/40 transition group-open:rotate-180" />
      </summary>
      <form
        action={saveAccount}
        className="grid gap-3 border-t border-line bg-paper/45 p-4 sm:grid-cols-2"
      >
        {account ? <input name="id" type="hidden" value={account.id} /> : null}
        <label className="field-label">
        계좌명
        <input
          className="field-control bg-white"
          defaultValue={account?.name}
          maxLength={80}
          name="name"
          placeholder={title}
          required
        />
      </label>
      <label className="field-label">
        유형
        <select
          className="field-control bg-white"
          defaultValue={account?.type ?? "bank"}
          name="type"
        >
          {accountTypes.map((type) => (
            <option key={type} value={type}>
              {accountTypeLabel(type)}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label">
        현재 잔액
        <input
          className="field-control bg-white"
          defaultValue={account?.current_balance ?? 0}
          name="currentBalance"
          step="0.01"
          type="number"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <label className="field-label">
          상태
          <select
            className="field-control bg-white"
            defaultValue={account?.status ?? "active"}
            name="status"
          >
            {recordStatuses.map((status) => (
              <option key={status} value={status}>
                {recordStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-ink/75">
          <input
          className="h-4 w-4 rounded border-line text-leaf"
            defaultChecked={account?.include_in_net_worth ?? true}
            name="includeInNetWorth"
            type="checkbox"
          />
          순자산 포함
        </label>
      </div>
      <button
        className="button-primary self-end sm:col-span-2"
        type="submit"
      >
        저장
      </button>
      </form>
    </details>
  );
}
