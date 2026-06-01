import { saveAccount, saveBudget, saveCategory } from "@/app/actions/settings";
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

const categoryTypes = ["expense", "income", "transfer"] as const;
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
    (category) => category.type === "expense" && category.status === "active"
  );
  const budgetByCategory = new Map(
    budgets.map((budget) => [budget.category_id, Number(budget.amount)])
  );
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const rootCategories = categories.filter(
    (category) => category.parent_category_id === null && category.status === "active"
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal text-ink">설정</h1>
          <p className="text-sm leading-6 text-ink/70">
            계좌, 카테고리, 월 예산을 관리합니다. 보관 처리한 항목은 과거 기록을
            유지하면서 입력 화면에서 제외됩니다.
          </p>
        </div>
        <form action="/settings" className="flex items-center gap-2">
          <input
            aria-label="예산 월"
            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink shadow-sm"
            defaultValue={monthInputValue(month)}
            name="month"
            type="month"
          />
          <button
            className="h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-paper"
            type="submit"
          >
            예산 월 보기
          </button>
        </form>
      </div>

      <section className="grid gap-3 lg:grid-cols-[18rem_1fr]">
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold tracking-normal text-ink">현재 관리자</h2>
          <p className="mt-3 truncate text-sm font-semibold text-ink">
            {profile.display_name}
          </p>
          <p className="mt-1 text-xs uppercase tracking-normal text-ink/55">
            {roleLabel(profile.role)}
          </p>
        </div>

        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-normal text-ink">
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-normal text-ink">계좌 관리</h2>
        <div className="grid gap-3">
          <AccountForm title="새 계좌 추가" />
          {accounts.map((account) => (
            <AccountForm key={account.id} title={account.name} account={account} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-normal text-ink">카테고리 관리</h2>
        <div className="grid gap-3">
          <CategoryForm title="새 카테고리 추가" rootCategories={rootCategories} />
          {categories.map((category) => (
            <CategoryForm
              key={category.id}
              title={category.name}
              category={category}
              rootCategories={rootCategories.filter((root) => root.id !== category.id)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-normal text-ink">월 예산 관리</h2>
          <span className="text-sm text-ink/60">{monthInputValue(month)}</span>
        </div>
        {expenseCategories.length === 0 ? (
          <div className="rounded-md border border-line bg-white p-4 text-sm text-ink/65 shadow-sm">
            예산을 설정하려면 먼저 사용 중인 지출 카테고리를 추가해 주세요.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {expenseCategories.map((category) => (
              <form
                key={category.id}
                action={saveBudget}
                className="grid gap-3 rounded-md border border-line bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]"
              >
                <input name="month" type="hidden" value={month} />
                <input name="categoryId" type="hidden" value={category.id} />
                <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
                  {categoryDisplayName(category, categoryNameById)}
                  <input
                    className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
                    defaultValue={budgetByCategory.get(category.id) ?? 0}
                    min="0"
                    name="amount"
                    step="1000"
                    type="number"
                  />
                </label>
                <button
                  className="h-10 self-end rounded-md bg-leaf px-4 text-sm font-semibold text-white transition-colors hover:bg-leaf/90"
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
  );
}

type AccountFormProps = {
  title: string;
  account?: {
    id: string;
    name: string;
    type: string;
    current_balance: string | number;
    include_in_net_worth: boolean;
    status: "active" | "archived";
  };
};

function AccountForm({ title, account }: AccountFormProps) {
  return (
    <form
      action={saveAccount}
      className="grid gap-3 rounded-md border border-line bg-white p-4 shadow-sm lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]"
    >
      {account ? <input name="id" type="hidden" value={account.id} /> : null}
      <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
        계좌명
        <input
          className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
          defaultValue={account?.name}
          maxLength={80}
          name="name"
          placeholder={title}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
        유형
        <select
          className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
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
      <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
        현재 잔액
        <input
          className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
          defaultValue={account?.current_balance ?? 0}
          name="currentBalance"
          step="0.01"
          type="number"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
          상태
          <select
            className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
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
        className="h-10 self-end rounded-md bg-leaf px-4 text-sm font-semibold text-white transition-colors hover:bg-leaf/90"
        type="submit"
      >
        저장
      </button>
    </form>
  );
}

type CategoryFormProps = {
  title: string;
  category?: {
    id: string;
    name: string;
    type: "income" | "expense" | "transfer";
    parent_category_id: string | null;
    sort_order: number;
    status: "active" | "archived";
  };
  rootCategories: Array<{
    id: string;
    name: string;
    type: "income" | "expense" | "transfer";
  }>;
};

function categoryDisplayName(
  category: { name: string; parent_category_id: string | null },
  categoryNameById: Map<string, string>
) {
  const parentName = category.parent_category_id
    ? categoryNameById.get(category.parent_category_id)
    : undefined;

  return parentName ? `${parentName} > ${category.name}` : category.name;
}

function CategoryForm({ title, category, rootCategories }: CategoryFormProps) {
  return (
    <form
      action={saveCategory}
      className="grid gap-3 rounded-md border border-line bg-white p-4 shadow-sm lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]"
    >
      {category ? <input name="id" type="hidden" value={category.id} /> : null}
      <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
        카테고리명
        <input
          className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
          defaultValue={category?.name}
          maxLength={80}
          name="name"
          placeholder={title}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
        유형
        <select
          className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
          defaultValue={category?.type ?? "expense"}
          name="type"
        >
          {categoryTypes.map((type) => (
            <option key={type} value={type}>
              {categoryTypeLabel(type)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
        상위 카테고리
        <select
          className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
          defaultValue={category?.parent_category_id ?? ""}
          name="parentCategoryId"
        >
          <option value="">대분류</option>
          {rootCategories.map((root) => (
            <option key={root.id} value={root.id}>
              {categoryTypeLabel(root.type)} · {root.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
        정렬
        <input
          className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
          defaultValue={category?.sort_order ?? 0}
          min="0"
          name="sortOrder"
          type="number"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink/75">
        상태
        <select
          className="h-10 rounded-md border border-line bg-white px-3 text-ink outline-none focus:border-leaf"
          defaultValue={category?.status ?? "active"}
          name="status"
        >
          {recordStatuses.map((status) => (
            <option key={status} value={status}>
              {recordStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <button
        className="h-10 self-end rounded-md bg-leaf px-4 text-sm font-semibold text-white transition-colors hover:bg-leaf/90"
        type="submit"
      >
        저장
      </button>
    </form>
  );
}
