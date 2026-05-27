# Household Finance MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive invite-only personal/family household finance MVP with quick transaction entry, asset snapshots, monthly closing, and rule-based insights.

**Architecture:** Use Next.js App Router on Vercel with Supabase Auth, Postgres, and Row Level Security. Keep finance calculations and insight generation in pure TypeScript modules so they can be tested without a browser or database and later reused by an AI adapter.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Supabase Auth/Postgres/RLS, `@supabase/ssr`, Zod, Vitest, Testing Library, Playwright.

---

## File Structure

- `package.json`: scripts and dependencies.
- `next.config.ts`: Next.js configuration.
- `tsconfig.json`: TypeScript configuration.
- `vitest.config.ts`: unit test configuration.
- `playwright.config.ts`: browser test configuration.
- `.env.example`: required Vercel/Supabase environment variables.
- `supabase/migrations/0001_initial_schema.sql`: tables, constraints, indexes, helper functions, and RLS policies.
- `src/app/layout.tsx`: root layout.
- `src/app/page.tsx`: redirects authenticated users to Today and unauthenticated users to login.
- `src/app/(auth)/login/page.tsx`: login screen.
- `src/app/(app)/layout.tsx`: authenticated responsive app shell.
- `src/app/(app)/today/page.tsx`: quick entry and recent transaction screen.
- `src/app/(app)/monthly-close/page.tsx`: monthly close screen.
- `src/app/(app)/assets/page.tsx`: account and net-worth screen.
- `src/app/(app)/settings/page.tsx`: admin settings screen.
- `src/app/actions/auth.ts`: login and logout server actions.
- `src/app/actions/transactions.ts`: transaction mutations.
- `src/app/actions/monthly-close.ts`: monthly close regeneration.
- `src/components/app-shell.tsx`: desktop and mobile navigation.
- `src/components/forms/transaction-form.tsx`: quick transaction form.
- `src/components/summary-card.tsx`: reusable compact metric card.
- `src/lib/env.ts`: environment validation.
- `src/lib/supabase/browser.ts`: browser Supabase client.
- `src/lib/supabase/server.ts`: server Supabase client.
- `src/lib/domain/types.ts`: shared finance domain types.
- `src/lib/domain/monthly-close.ts`: pure aggregation and metric calculation.
- `src/lib/domain/insights.ts`: pure rule-based insight engine.
- `src/lib/domain/format.ts`: money and percentage formatting.
- `src/lib/repositories/finance.ts`: database reads for app screens.
- `src/lib/repositories/monthly-close.ts`: database writes for regenerated closes.
- `src/lib/auth/require-user.ts`: server-side auth and role helpers.
- `src/lib/validation/transaction.ts`: Zod transaction validation.
- `tests/domain/monthly-close.test.ts`: calculation tests.
- `tests/domain/insights.test.ts`: insight rule tests.
- `tests/validation/transaction.test.ts`: validation tests.
- `tests/e2e/app-shell.spec.ts`: responsive navigation smoke tests.

## Task 1: Scaffold the Next.js App for Vercel

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/globals.css`
- Create: `.env.example`

- [ ] **Step 1: Create the project package file**

Create `package.json` with:

```json
{
  "name": "household-finance",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@supabase/ssr": "^0.6.1",
    "@supabase/supabase-js": "^2.49.8",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "^15.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.1.3",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Add framework configuration**

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

export default config;
```

Create `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        mist: "#f6f7f4",
        line: "#dce2dc",
        leaf: "#3f7f63",
        coral: "#c95f4a",
        gold: "#b88a2c"
      }
    }
  },
  plugins: []
};

export default config;
```

- [ ] **Step 3: Add test configuration**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]
  }
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ]
});
```

- [ ] **Step 4: Add global styles and environment sample**

Create `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  background: #f6f7f4;
  color: #17211f;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #f6f7f4;
  color: #17211f;
}

button,
input,
select,
textarea {
  font: inherit;
}
```

Create `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 5: Install dependencies and verify scaffold**

Run:

```bash
npm install
npm run test
```

Expected: dependencies install successfully and Vitest reports no matching test files or a clean empty suite depending on the installed Vitest version.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts vitest.config.ts playwright.config.ts src/app/globals.css .env.example
git commit -m "chore: scaffold next app"
```

## Task 2: Add Supabase Schema and RLS Policies

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`

- [ ] **Step 1: Create the initial migration**

Create `supabase/migrations/0001_initial_schema.sql`:

```sql
create extension if not exists pgcrypto;

create type app_role as enum ('admin', 'member');
create type membership_status as enum ('invited', 'active', 'disabled');
create type account_type as enum ('cash', 'bank', 'card', 'investment', 'loan', 'other_asset', 'other_liability');
create type record_status as enum ('active', 'archived');
create type category_type as enum ('income', 'expense', 'transfer');
create type transaction_type as enum ('income', 'expense', 'transfer', 'adjustment');
create type transaction_status as enum ('posted', 'voided');
create type insight_severity as enum ('info', 'positive', 'warning');

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  display_name text not null,
  role app_role not null default 'member',
  status membership_status not null default 'active',
  created_at timestamptz not null default now()
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  owner_user_id uuid references profiles(id) on delete set null,
  name text not null,
  type account_type not null,
  include_in_net_worth boolean not null default true,
  current_balance numeric(14, 2) not null default 0,
  status record_status not null default 'active',
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type category_type not null,
  parent_category_id uuid references categories(id) on delete set null,
  sort_order integer not null default 0,
  status record_status not null default 'active',
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  date date not null,
  type transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  account_id uuid not null references accounts(id),
  to_account_id uuid references accounts(id),
  category_id uuid references categories(id),
  user_id uuid not null references profiles(id),
  memo text not null default '',
  status transaction_status not null default 'posted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfer_requires_destination check (
    (type = 'transfer' and to_account_id is not null) or
    (type <> 'transfer' and to_account_id is null)
  )
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month date not null,
  category_id uuid not null references categories(id),
  amount numeric(14, 2) not null check (amount >= 0),
  created_by_user_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (household_id, month, category_id)
);

create table monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month date not null,
  total_assets numeric(14, 2) not null,
  total_liabilities numeric(14, 2) not null,
  net_worth numeric(14, 2) not null,
  account_balances jsonb not null default '[]',
  generated_at timestamptz not null default now(),
  unique (household_id, month)
);

create table monthly_closes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month date not null,
  income_total numeric(14, 2) not null,
  expense_total numeric(14, 2) not null,
  transfer_total numeric(14, 2) not null,
  budget_variance numeric(14, 2) not null,
  savings_rate numeric(8, 4),
  fixed_cost_ratio numeric(8, 4),
  net_worth_change numeric(14, 2),
  insight_items jsonb not null default '[]',
  generated_at timestamptz not null default now(),
  unique (household_id, month)
);

create index accounts_household_idx on accounts(household_id);
create index categories_household_idx on categories(household_id);
create index transactions_household_date_idx on transactions(household_id, date);
create index budgets_household_month_idx on budgets(household_id, month);
create index monthly_snapshots_household_month_idx on monthly_snapshots(household_id, month);

create or replace function current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from profiles where id = auth.uid() and status = 'active'
$$;

create or replace function current_app_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid() and status = 'active'
$$;

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_touch_updated_at
before update on transactions
for each row execute function touch_updated_at();

alter table households enable row level security;
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table monthly_snapshots enable row level security;
alter table monthly_closes enable row level security;

create policy "profiles read household" on profiles
for select using (household_id = current_household_id());

create policy "profiles admin update household" on profiles
for update using (household_id = current_household_id() and current_app_role() = 'admin');

create policy "households read own" on households
for select using (id = current_household_id());

create policy "accounts household read" on accounts
for select using (household_id = current_household_id());

create policy "accounts admin write" on accounts
for all using (household_id = current_household_id() and current_app_role() = 'admin')
with check (household_id = current_household_id() and current_app_role() = 'admin');

create policy "categories household read" on categories
for select using (household_id = current_household_id());

create policy "categories admin write" on categories
for all using (household_id = current_household_id() and current_app_role() = 'admin')
with check (household_id = current_household_id() and current_app_role() = 'admin');

create policy "transactions household read" on transactions
for select using (household_id = current_household_id());

create policy "transactions household insert" on transactions
for insert with check (household_id = current_household_id() and user_id = auth.uid());

create policy "transactions owner or admin update" on transactions
for update using (household_id = current_household_id() and (user_id = auth.uid() or current_app_role() = 'admin'))
with check (household_id = current_household_id() and (user_id = auth.uid() or current_app_role() = 'admin'));

create policy "budgets household read" on budgets
for select using (household_id = current_household_id());

create policy "budgets admin write" on budgets
for all using (household_id = current_household_id() and current_app_role() = 'admin')
with check (household_id = current_household_id() and current_app_role() = 'admin');

create policy "snapshots household read" on monthly_snapshots
for select using (household_id = current_household_id());

create policy "snapshots admin write" on monthly_snapshots
for all using (household_id = current_household_id() and current_app_role() = 'admin')
with check (household_id = current_household_id() and current_app_role() = 'admin');

create policy "closes household read" on monthly_closes
for select using (household_id = current_household_id());

create policy "closes admin write" on monthly_closes
for all using (household_id = current_household_id() and current_app_role() = 'admin')
with check (household_id = current_household_id() and current_app_role() = 'admin');
```

- [ ] **Step 2: Apply migration locally or to a Supabase project**

Run one of these:

```bash
supabase db reset
```

Expected local output: migration `0001_initial_schema.sql` is applied without SQL errors.

Or, for a linked Supabase project:

```bash
supabase db push
```

Expected remote output: migration is pushed and all policies are created.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_initial_schema.sql
git commit -m "feat: add supabase finance schema"
```

## Task 3: Add Environment and Supabase Clients

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/auth/require-user.ts`

- [ ] **Step 1: Write environment validation**

Create `src/lib/env.ts`:

```ts
import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url()
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  });
}
```

- [ ] **Step 2: Add Supabase clients**

Create `src/lib/supabase/browser.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

Create `src/lib/supabase/server.ts`:

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
}
```

- [ ] **Step 3: Add auth helpers**

Create `src/lib/auth/require-user.ts`:

```ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "member";

export type CurrentProfile = {
  id: string;
  household_id: string;
  display_name: string;
  role: AppRole;
  status: "invited" | "active" | "disabled";
};

export async function requireUser() {
  const supabase = await createClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, household_id, display_name, role, status")
    .eq("id", userResult.user.id)
    .single();

  if (profileError || !profile || profile.status !== "active") {
    redirect("/login");
  }

  return { user: userResult.user, profile: profile as CurrentProfile, supabase };
}

export async function requireAdmin() {
  const context = await requireUser();
  if (context.profile.role !== "admin") {
    redirect("/today");
  }
  return context;
}
```

- [ ] **Step 4: Run type check**

Run:

```bash
npm run build
```

Expected: build may fail until pages exist, but it must not report syntax errors in the new files. If it fails because `src/app/layout.tsx` does not exist yet, continue to Task 4.

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts src/lib/supabase/browser.ts src/lib/supabase/server.ts src/lib/auth/require-user.ts
git commit -m "feat: add supabase clients"
```

## Task 4: Implement Pure Domain Calculations with Tests

**Files:**
- Create: `src/lib/domain/types.ts`
- Create: `src/lib/domain/monthly-close.ts`
- Create: `src/lib/domain/insights.ts`
- Create: `src/lib/domain/format.ts`
- Create: `tests/domain/monthly-close.test.ts`
- Create: `tests/domain/insights.test.ts`

- [ ] **Step 1: Write failing monthly close tests**

Create `tests/domain/monthly-close.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateMonthlyClose } from "@/lib/domain/monthly-close";
import type { BudgetInput, SnapshotInput, TransactionInput } from "@/lib/domain/types";

describe("calculateMonthlyClose", () => {
  it("aggregates income, expenses, transfers, budgets, and savings rate", () => {
    const transactions: TransactionInput[] = [
      { id: "t1", date: "2026-05-02", type: "income", amount: 5000, categoryId: "salary", accountId: "bank" },
      { id: "t2", date: "2026-05-03", type: "expense", amount: 1200, categoryId: "food", accountId: "card" },
      { id: "t3", date: "2026-05-04", type: "expense", amount: 800, categoryId: "rent", accountId: "bank" },
      { id: "t4", date: "2026-05-05", type: "transfer", amount: 1000, categoryId: null, accountId: "bank", toAccountId: "savings" }
    ];
    const budgets: BudgetInput[] = [{ categoryId: "food", amount: 1000 }, { categoryId: "rent", amount: 900 }];
    const snapshot: SnapshotInput = { month: "2026-05-01", totalAssets: 12000, totalLiabilities: 3000, netWorth: 9000 };
    const previousSnapshot: SnapshotInput = { month: "2026-04-01", totalAssets: 11000, totalLiabilities: 3200, netWorth: 7800 };

    const close = calculateMonthlyClose({
      month: "2026-05-01",
      transactions,
      budgets,
      snapshot,
      previousSnapshot
    });

    expect(close.incomeTotal).toBe(5000);
    expect(close.expenseTotal).toBe(2000);
    expect(close.transferTotal).toBe(1000);
    expect(close.budgetVariance).toBe(100);
    expect(close.savingsRate).toBe(0.6);
    expect(close.netWorthChange).toBe(1200);
    expect(close.categoryTotals.food).toBe(1200);
  });
});
```

- [ ] **Step 2: Run the monthly close test and verify failure**

Run:

```bash
npm run test -- tests/domain/monthly-close.test.ts
```

Expected: FAIL because `@/lib/domain/monthly-close` and related types do not exist.

- [ ] **Step 3: Implement monthly close types and calculation**

Create `src/lib/domain/types.ts`:

```ts
export type TransactionType = "income" | "expense" | "transfer" | "adjustment";

export type TransactionInput = {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  accountId: string;
  toAccountId?: string;
};

export type BudgetInput = {
  categoryId: string;
  amount: number;
};

export type SnapshotInput = {
  month: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
};

export type InsightSeverity = "info" | "positive" | "warning";

export type InsightItem = {
  severity: InsightSeverity;
  title: string;
  message: string;
  metricRefs: string[];
  suggestedAction?: string;
};

export type MonthlyCloseMetrics = {
  month: string;
  incomeTotal: number;
  expenseTotal: number;
  transferTotal: number;
  budgetVariance: number;
  savingsRate: number | null;
  fixedCostRatio: number | null;
  netWorthChange: number | null;
  categoryTotals: Record<string, number>;
  budgetByCategory: Record<string, number>;
  missingBudget: boolean;
  missingSnapshot: boolean;
};
```

Create `src/lib/domain/monthly-close.ts`:

```ts
import type { BudgetInput, MonthlyCloseMetrics, SnapshotInput, TransactionInput } from "@/lib/domain/types";

export type CalculateMonthlyCloseInput = {
  month: string;
  transactions: TransactionInput[];
  budgets: BudgetInput[];
  snapshot: SnapshotInput | null;
  previousSnapshot: SnapshotInput | null;
  fixedCategoryIds?: string[];
};

export function calculateMonthlyClose(input: CalculateMonthlyCloseInput): MonthlyCloseMetrics {
  const categoryTotals: Record<string, number> = {};
  const budgetByCategory: Record<string, number> = {};
  let incomeTotal = 0;
  let expenseTotal = 0;
  let transferTotal = 0;
  let fixedCostTotal = 0;
  const fixedCategoryIds = new Set(input.fixedCategoryIds ?? []);

  for (const budget of input.budgets) {
    budgetByCategory[budget.categoryId] = budget.amount;
  }

  for (const transaction of input.transactions) {
    if (transaction.type === "income") {
      incomeTotal += transaction.amount;
    }
    if (transaction.type === "expense") {
      expenseTotal += transaction.amount;
      if (transaction.categoryId) {
        categoryTotals[transaction.categoryId] = (categoryTotals[transaction.categoryId] ?? 0) + transaction.amount;
        if (fixedCategoryIds.has(transaction.categoryId)) {
          fixedCostTotal += transaction.amount;
        }
      }
    }
    if (transaction.type === "transfer") {
      transferTotal += transaction.amount;
    }
  }

  const budgetVariance = Object.entries(categoryTotals).reduce((total, [categoryId, actual]) => {
    const budget = budgetByCategory[categoryId] ?? 0;
    return total + (actual - budget);
  }, 0);

  return {
    month: input.month,
    incomeTotal,
    expenseTotal,
    transferTotal,
    budgetVariance,
    savingsRate: incomeTotal > 0 ? roundRatio((incomeTotal - expenseTotal) / incomeTotal) : null,
    fixedCostRatio: incomeTotal > 0 ? roundRatio(fixedCostTotal / incomeTotal) : null,
    netWorthChange: input.snapshot && input.previousSnapshot ? input.snapshot.netWorth - input.previousSnapshot.netWorth : null,
    categoryTotals,
    budgetByCategory,
    missingBudget: input.budgets.length === 0,
    missingSnapshot: !input.snapshot
  };
}

function roundRatio(value: number) {
  return Math.round(value * 10000) / 10000;
}
```

- [ ] **Step 4: Run monthly close test and verify pass**

Run:

```bash
npm run test -- tests/domain/monthly-close.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing insight tests**

Create `tests/domain/insights.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { generateInsights } from "@/lib/domain/insights";
import type { MonthlyCloseMetrics } from "@/lib/domain/types";

describe("generateInsights", () => {
  it("flags budget overrun, strong savings, and net worth growth", () => {
    const metrics: MonthlyCloseMetrics = {
      month: "2026-05-01",
      incomeTotal: 5000,
      expenseTotal: 2000,
      transferTotal: 1000,
      budgetVariance: 100,
      savingsRate: 0.6,
      fixedCostRatio: 0.16,
      netWorthChange: 1200,
      categoryTotals: { food: 1200 },
      budgetByCategory: { food: 1000 },
      missingBudget: false,
      missingSnapshot: false
    };

    const insights = generateInsights(metrics);

    expect(insights.map((item) => item.title)).toContain("Budget overrun");
    expect(insights.map((item) => item.title)).toContain("Strong savings rate");
    expect(insights.map((item) => item.title)).toContain("Net worth increased");
  });

  it("warns when budget or snapshot data is missing", () => {
    const insights = generateInsights({
      month: "2026-05-01",
      incomeTotal: 0,
      expenseTotal: 0,
      transferTotal: 0,
      budgetVariance: 0,
      savingsRate: null,
      fixedCostRatio: null,
      netWorthChange: null,
      categoryTotals: {},
      budgetByCategory: {},
      missingBudget: true,
      missingSnapshot: true
    });

    expect(insights.filter((item) => item.title === "More setup needed")).toHaveLength(2);
  });
});
```

- [ ] **Step 6: Implement insights**

Create `src/lib/domain/insights.ts`:

```ts
import type { InsightItem, MonthlyCloseMetrics } from "@/lib/domain/types";

export function generateInsights(metrics: MonthlyCloseMetrics): InsightItem[] {
  const insights: InsightItem[] = [];

  for (const [categoryId, actual] of Object.entries(metrics.categoryTotals)) {
    const budget = metrics.budgetByCategory[categoryId];
    if (budget !== undefined && actual > budget) {
      insights.push({
        severity: "warning",
        title: "Budget overrun",
        message: `${categoryId} spending exceeded its monthly budget by ${formatAmount(actual - budget)}.`,
        metricRefs: [`categoryTotals.${categoryId}`, `budgetByCategory.${categoryId}`],
        suggestedAction: "Review this category before setting next month's budget."
      });
    }
  }

  if (metrics.savingsRate !== null && metrics.savingsRate >= 0.3) {
    insights.push({
      severity: "positive",
      title: "Strong savings rate",
      message: `Savings rate reached ${Math.round(metrics.savingsRate * 100)}% this month.`,
      metricRefs: ["savingsRate"]
    });
  }

  if (metrics.fixedCostRatio !== null && metrics.fixedCostRatio >= 0.5) {
    insights.push({
      severity: "warning",
      title: "Fixed costs are high",
      message: `Fixed costs used ${Math.round(metrics.fixedCostRatio * 100)}% of monthly income.`,
      metricRefs: ["fixedCostRatio"],
      suggestedAction: "Check recurring bills and subscriptions."
    });
  }

  if (metrics.netWorthChange !== null && metrics.netWorthChange > 0) {
    insights.push({
      severity: "positive",
      title: "Net worth increased",
      message: `Net worth increased by ${formatAmount(metrics.netWorthChange)} from the previous snapshot.`,
      metricRefs: ["netWorthChange"]
    });
  }

  if (metrics.missingBudget) {
    insights.push({
      severity: "info",
      title: "More setup needed",
      message: "No budgets were found for this month, so budget guidance is limited.",
      metricRefs: ["missingBudget"]
    });
  }

  if (metrics.missingSnapshot) {
    insights.push({
      severity: "info",
      title: "More setup needed",
      message: "No asset snapshot was found for this month, so net-worth guidance is limited.",
      metricRefs: ["missingSnapshot"]
    });
  }

  return insights;
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(value);
}
```

Create `src/lib/domain/format.ts`:

```ts
export function formatWon(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value: number | null) {
  if (value === null) return "-";
  return `${Math.round(value * 100)}%`;
}
```

- [ ] **Step 7: Run domain tests**

Run:

```bash
npm run test -- tests/domain/monthly-close.test.ts tests/domain/insights.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/domain tests/domain
git commit -m "feat: add monthly close domain logic"
```

## Task 5: Build the Authenticated App Shell

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/components/app-shell.tsx`
- Create: `src/components/summary-card.tsx`
- Create: `tests/e2e/app-shell.spec.ts`

- [ ] **Step 1: Create root layout and landing redirect**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Household Finance",
  description: "Invite-only household finance and asset management"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  redirect(data.user ? "/today" : "/login");
}
```

- [ ] **Step 2: Build the app shell component**

Create `src/components/app-shell.tsx`:

```tsx
import Link from "next/link";
import { BarChart3, Home, Landmark, Settings } from "lucide-react";

const navItems = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/monthly-close", label: "Close", icon: BarChart3 },
  { href: "/assets", label: "Assets", icon: Landmark },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist text-ink">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-line bg-white px-4 py-5 md:block">
        <Link href="/today" className="block text-xl font-semibold">
          Household Finance
        </Link>
        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-mist">
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-5 md:ml-64 md:px-8 md:pb-8">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-4 border-t border-line bg-white md:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium">
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

Create `src/components/summary-card.tsx`:

```tsx
export function SummaryCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "positive" | "warning" }) {
  const toneClass = tone === "positive" ? "text-leaf" : tone === "warning" ? "text-coral" : "text-ink";

  return (
    <section className="rounded-md border border-line bg-white p-4">
      <p className="text-sm text-ink/65">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </section>
  );
}
```

- [ ] **Step 3: Add authenticated layout**

Create `src/app/(app)/layout.tsx`:

```tsx
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 4: Add responsive smoke test**

Create `tests/e2e/app-shell.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("login route renders on desktop and mobile", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
```

This test passes after Task 6 creates the login route. Keep it staged with the shell work so responsive verification has a starting point.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx "src/app/(app)/layout.tsx" src/components/app-shell.tsx src/components/summary-card.tsx tests/e2e/app-shell.spec.ts
git commit -m "feat: add responsive app shell"
```

## Task 6: Add Login and Logout

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/actions/auth.ts`

- [ ] **Step 1: Create auth server actions**

Create `src/app/actions/auth.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid");
  }

  redirect("/today");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Create login screen**

Create `src/app/(auth)/login/page.tsx`:

```tsx
import { signIn } from "@/app/actions/auth";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4">
      <section className="w-full max-w-sm rounded-md border border-line bg-white p-6">
        <h1 className="text-2xl font-semibold text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink/70">Invite-only access for your household.</p>
        {searchParams.error === "invalid" ? (
          <p className="mt-4 rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">Email or password did not match.</p>
        ) : null}
        <form action={signIn} className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm font-medium">
            Email
            <input name="email" type="email" required className="rounded-md border border-line px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Password
            <input name="password" type="password" required className="rounded-md border border-line px-3 py-2" />
          </label>
          <button className="rounded-md bg-leaf px-4 py-2 font-semibold text-white" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Run e2e smoke test**

Run:

```bash
npm run test:e2e -- tests/e2e/app-shell.spec.ts
```

Expected: PASS, login heading is visible on desktop and mobile projects.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(auth)/login/page.tsx" src/app/actions/auth.ts
git commit -m "feat: add invite-only login screen"
```

## Task 7: Add Transaction Validation and Today Screen

**Files:**
- Create: `src/lib/validation/transaction.ts`
- Create: `tests/validation/transaction.test.ts`
- Create: `src/components/forms/transaction-form.tsx`
- Create: `src/app/actions/transactions.ts`
- Create: `src/lib/repositories/finance.ts`
- Create: `src/app/(app)/today/page.tsx`

- [ ] **Step 1: Write failing transaction validation tests**

Create `tests/validation/transaction.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { transactionSchema } from "@/lib/validation/transaction";

describe("transactionSchema", () => {
  it("accepts a positive expense", () => {
    const parsed = transactionSchema.parse({
      date: "2026-05-27",
      type: "expense",
      amount: "12000",
      accountId: "account-1",
      categoryId: "food",
      memo: "lunch"
    });

    expect(parsed.amount).toBe(12000);
  });

  it("rejects a transfer without destination account", () => {
    expect(() =>
      transactionSchema.parse({
        date: "2026-05-27",
        type: "transfer",
        amount: "50000",
        accountId: "bank",
        categoryId: "",
        memo: ""
      })
    ).toThrow();
  });
});
```

- [ ] **Step 2: Implement transaction validation**

Create `src/lib/validation/transaction.ts`:

```ts
import { z } from "zod";

export const transactionSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.enum(["income", "expense", "transfer", "adjustment"]),
    amount: z.coerce.number().positive(),
    accountId: z.string().min(1),
    toAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    memo: z.string().max(240).default("")
  })
  .superRefine((value, ctx) => {
    if (value.type === "transfer" && !value.toAccountId) {
      ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Transfer requires a destination account." });
    }
    if (value.type !== "transfer" && !value.categoryId) {
      ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Income and expense transactions require a category." });
    }
  });

export type TransactionFormInput = z.infer<typeof transactionSchema>;
```

- [ ] **Step 3: Run validation tests**

Run:

```bash
npm run test -- tests/validation/transaction.test.ts
```

Expected: PASS.

- [ ] **Step 4: Add repository reads for Today**

Create `src/lib/repositories/finance.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getTodayData(supabase: SupabaseClient, householdId: string) {
  const [accounts, categories, recentTransactions] = await Promise.all([
    supabase.from("accounts").select("id, name, type, current_balance").eq("household_id", householdId).eq("status", "active").order("name"),
    supabase.from("categories").select("id, name, type").eq("household_id", householdId).eq("status", "active").order("sort_order"),
    supabase
      .from("transactions")
      .select("id, date, type, amount, memo, categories(name), accounts(name)")
      .eq("household_id", householdId)
      .eq("status", "posted")
      .order("date", { ascending: false })
      .limit(8)
  ]);

  if (accounts.error) throw accounts.error;
  if (categories.error) throw categories.error;
  if (recentTransactions.error) throw recentTransactions.error;

  return {
    accounts: accounts.data,
    categories: categories.data,
    recentTransactions: recentTransactions.data
  };
}
```

- [ ] **Step 5: Add transaction create action**

Create `src/app/actions/transactions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { transactionSchema } from "@/lib/validation/transaction";
import { requireUser } from "@/lib/auth/require-user";

export async function createTransaction(formData: FormData) {
  const { profile, supabase } = await requireUser();
  const parsed = transactionSchema.parse({
    date: formData.get("date"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    accountId: formData.get("accountId"),
    toAccountId: formData.get("toAccountId") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    memo: formData.get("memo") ?? ""
  });

  const { error } = await supabase.from("transactions").insert({
    household_id: profile.household_id,
    date: parsed.date,
    type: parsed.type,
    amount: parsed.amount,
    account_id: parsed.accountId,
    to_account_id: parsed.type === "transfer" ? parsed.toAccountId : null,
    category_id: parsed.type === "transfer" ? null : parsed.categoryId,
    user_id: profile.id,
    memo: parsed.memo
  });

  if (error) throw error;

  revalidatePath("/today");
  revalidatePath("/monthly-close");
}
```

- [ ] **Step 6: Add transaction form and Today page**

Create `src/components/forms/transaction-form.tsx`:

```tsx
import { createTransaction } from "@/app/actions/transactions";

type Option = { id: string; name: string; type?: string };

export function TransactionForm({ accounts, categories }: { accounts: Option[]; categories: Option[] }) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={createTransaction} className="grid gap-3 rounded-md border border-line bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Amount
          <input name="amount" inputMode="decimal" required className="rounded-md border border-line px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Date
          <input name="date" type="date" defaultValue={today} required className="rounded-md border border-line px-3 py-2" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Type
          <select name="type" defaultValue="expense" className="rounded-md border border-line px-3 py-2">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Account
          <select name="accountId" required className="rounded-md border border-line px-3 py-2">
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Category
          <select name="categoryId" className="rounded-md border border-line px-3 py-2">
            <option value="">None</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Memo
        <input name="memo" maxLength={240} className="rounded-md border border-line px-3 py-2" />
      </label>
      <button type="submit" className="rounded-md bg-leaf px-4 py-2 font-semibold text-white">
        Add transaction
      </button>
    </form>
  );
}
```

Create `src/app/(app)/today/page.tsx`:

```tsx
import { TransactionForm } from "@/components/forms/transaction-form";
import { SummaryCard } from "@/components/summary-card";
import { requireUser } from "@/lib/auth/require-user";
import { formatWon } from "@/lib/domain/format";
import { getTodayData } from "@/lib/repositories/finance";

export default async function TodayPage() {
  const { profile, supabase } = await requireUser();
  const data = await getTodayData(supabase, profile.household_id);
  const monthExpense = data.recentTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="mt-1 text-sm text-ink/65">Quick entry and recent household activity.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Recent expenses" value={formatWon(monthExpense)} />
        <SummaryCard label="Active accounts" value={String(data.accounts.length)} />
        <SummaryCard label="Categories" value={String(data.categories.length)} />
      </div>
      <TransactionForm accounts={data.accounts} categories={data.categories} />
      <section className="rounded-md border border-line bg-white">
        <h2 className="border-b border-line px-4 py-3 text-base font-semibold">Recent transactions</h2>
        <div className="divide-y divide-line">
          {data.recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{transaction.memo || transaction.type}</p>
                <p className="text-ink/60">{transaction.date}</p>
              </div>
              <p className="font-semibold">{formatWon(Number(transaction.amount))}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 7: Run tests and commit**

Run:

```bash
npm run test -- tests/validation/transaction.test.ts tests/domain/monthly-close.test.ts tests/domain/insights.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/lib/validation tests/validation src/components/forms src/app/actions/transactions.ts src/lib/repositories/finance.ts "src/app/(app)/today/page.tsx"
git commit -m "feat: add transaction entry"
```

## Task 8: Add Assets, Monthly Close, and Insight Screens

**Files:**
- Modify: `src/lib/repositories/finance.ts`
- Create: `src/lib/repositories/monthly-close.ts`
- Create: `src/app/actions/monthly-close.ts`
- Create: `src/app/(app)/assets/page.tsx`
- Create: `src/app/(app)/monthly-close/page.tsx`

- [ ] **Step 1: Extend finance repository reads**

Append to `src/lib/repositories/finance.ts`:

```ts
export async function getAssetsData(supabase: SupabaseClient, householdId: string) {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, type, current_balance, include_in_net_worth")
    .eq("household_id", householdId)
    .eq("status", "active")
    .order("type")
    .order("name");

  if (error) throw error;
  return data;
}

export async function getMonthlyCloseData(supabase: SupabaseClient, householdId: string, month: string) {
  const [transactions, budgets, snapshot, previousSnapshot, savedClose] = await Promise.all([
    supabase.from("transactions").select("id, date, type, amount, category_id, account_id, to_account_id").eq("household_id", householdId).eq("status", "posted").gte("date", month).lt("date", nextMonth(month)),
    supabase.from("budgets").select("category_id, amount").eq("household_id", householdId).eq("month", month),
    supabase.from("monthly_snapshots").select("month, total_assets, total_liabilities, net_worth").eq("household_id", householdId).eq("month", month).maybeSingle(),
    supabase.from("monthly_snapshots").select("month, total_assets, total_liabilities, net_worth").eq("household_id", householdId).lt("month", month).order("month", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("monthly_closes").select("*").eq("household_id", householdId).eq("month", month).maybeSingle()
  ]);

  if (transactions.error) throw transactions.error;
  if (budgets.error) throw budgets.error;
  if (snapshot.error) throw snapshot.error;
  if (previousSnapshot.error) throw previousSnapshot.error;
  if (savedClose.error) throw savedClose.error;

  return { transactions: transactions.data, budgets: budgets.data, snapshot: snapshot.data, previousSnapshot: previousSnapshot.data, savedClose: savedClose.data };
}

function nextMonth(month: string) {
  const date = new Date(`${month}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().slice(0, 10);
}
```

- [ ] **Step 2: Add monthly close writer**

Create `src/lib/repositories/monthly-close.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { InsightItem, MonthlyCloseMetrics } from "@/lib/domain/types";

export async function upsertMonthlyClose(
  supabase: SupabaseClient,
  householdId: string,
  metrics: MonthlyCloseMetrics,
  insights: InsightItem[]
) {
  const { error } = await supabase.from("monthly_closes").upsert(
    {
      household_id: householdId,
      month: metrics.month,
      income_total: metrics.incomeTotal,
      expense_total: metrics.expenseTotal,
      transfer_total: metrics.transferTotal,
      budget_variance: metrics.budgetVariance,
      savings_rate: metrics.savingsRate,
      fixed_cost_ratio: metrics.fixedCostRatio,
      net_worth_change: metrics.netWorthChange,
      insight_items: insights,
      generated_at: new Date().toISOString()
    },
    { onConflict: "household_id,month" }
  );

  if (error) throw error;
}
```

- [ ] **Step 3: Add monthly close action**

Create `src/app/actions/monthly-close.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { generateInsights } from "@/lib/domain/insights";
import { calculateMonthlyClose } from "@/lib/domain/monthly-close";
import { getMonthlyCloseData } from "@/lib/repositories/finance";
import { upsertMonthlyClose } from "@/lib/repositories/monthly-close";

export async function regenerateMonthlyClose(formData: FormData) {
  const month = String(formData.get("month"));
  const { profile, supabase } = await requireUser();
  const data = await getMonthlyCloseData(supabase, profile.household_id, month);
  const metrics = calculateMonthlyClose({
    month,
    transactions: data.transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.date,
      type: transaction.type,
      amount: Number(transaction.amount),
      categoryId: transaction.category_id,
      accountId: transaction.account_id,
      toAccountId: transaction.to_account_id ?? undefined
    })),
    budgets: data.budgets.map((budget) => ({ categoryId: budget.category_id, amount: Number(budget.amount) })),
    snapshot: data.snapshot
      ? { month: data.snapshot.month, totalAssets: Number(data.snapshot.total_assets), totalLiabilities: Number(data.snapshot.total_liabilities), netWorth: Number(data.snapshot.net_worth) }
      : null,
    previousSnapshot: data.previousSnapshot
      ? { month: data.previousSnapshot.month, totalAssets: Number(data.previousSnapshot.total_assets), totalLiabilities: Number(data.previousSnapshot.total_liabilities), netWorth: Number(data.previousSnapshot.net_worth) }
      : null
  });
  const insights = generateInsights(metrics);
  await upsertMonthlyClose(supabase, profile.household_id, metrics, insights);
  revalidatePath("/monthly-close");
}
```

- [ ] **Step 4: Add Assets page**

Create `src/app/(app)/assets/page.tsx`:

```tsx
import { SummaryCard } from "@/components/summary-card";
import { requireUser } from "@/lib/auth/require-user";
import { formatWon } from "@/lib/domain/format";
import { getAssetsData } from "@/lib/repositories/finance";

export default async function AssetsPage() {
  const { profile, supabase } = await requireUser();
  const accounts = await getAssetsData(supabase, profile.household_id);
  const assets = accounts.filter((account) => !["loan", "other_liability"].includes(account.type));
  const liabilities = accounts.filter((account) => ["loan", "other_liability"].includes(account.type));
  const assetTotal = assets.reduce((sum, account) => sum + Number(account.current_balance), 0);
  const liabilityTotal = liabilities.reduce((sum, account) => sum + Number(account.current_balance), 0);

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Assets</h1>
        <p className="mt-1 text-sm text-ink/65">Accounts, liabilities, and current net worth.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Assets" value={formatWon(assetTotal)} tone="positive" />
        <SummaryCard label="Liabilities" value={formatWon(liabilityTotal)} tone="warning" />
        <SummaryCard label="Net worth" value={formatWon(assetTotal - liabilityTotal)} />
      </div>
      <section className="rounded-md border border-line bg-white">
        <h2 className="border-b border-line px-4 py-3 text-base font-semibold">Accounts</h2>
        <div className="divide-y divide-line">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-ink/60">{account.type}</p>
              </div>
              <p className="font-semibold">{formatWon(Number(account.current_balance))}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Add Monthly Close page**

Create `src/app/(app)/monthly-close/page.tsx`:

```tsx
import { regenerateMonthlyClose } from "@/app/actions/monthly-close";
import { SummaryCard } from "@/components/summary-card";
import { requireUser } from "@/lib/auth/require-user";
import { formatPercent, formatWon } from "@/lib/domain/format";
import { getMonthlyCloseData } from "@/lib/repositories/finance";

export default async function MonthlyClosePage({ searchParams }: { searchParams: { month?: string } }) {
  const month = searchParams.month ?? new Date().toISOString().slice(0, 7) + "-01";
  const { profile, supabase } = await requireUser();
  const data = await getMonthlyCloseData(supabase, profile.household_id, month);
  const close = data.savedClose;
  const insights = Array.isArray(close?.insight_items) ? close.insight_items : [];

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Monthly Close</h1>
          <p className="mt-1 text-sm text-ink/65">Review spending, savings, net worth, and generated comments.</p>
        </div>
        <form action={regenerateMonthlyClose} className="flex gap-2">
          <input name="month" type="date" defaultValue={month} className="rounded-md border border-line px-3 py-2" />
          <button className="rounded-md bg-leaf px-4 py-2 font-semibold text-white">Regenerate</button>
        </form>
      </header>
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Income" value={formatWon(Number(close?.income_total ?? 0))} tone="positive" />
        <SummaryCard label="Expense" value={formatWon(Number(close?.expense_total ?? 0))} tone="warning" />
        <SummaryCard label="Savings rate" value={formatPercent(close?.savings_rate === null || close?.savings_rate === undefined ? null : Number(close.savings_rate))} />
        <SummaryCard label="Net-worth change" value={formatWon(Number(close?.net_worth_change ?? 0))} />
      </div>
      <section className="rounded-md border border-line bg-white">
        <h2 className="border-b border-line px-4 py-3 text-base font-semibold">Insights</h2>
        <div className="grid gap-3 p-4">
          {insights.length === 0 ? <p className="text-sm text-ink/65">Regenerate this month to create insights.</p> : null}
          {insights.map((insight: { title: string; message: string; severity: string }, index: number) => (
            <article key={`${insight.title}-${index}`} className="rounded-md border border-line p-3">
              <p className="text-sm font-semibold">{insight.title}</p>
              <p className="mt-1 text-sm text-ink/70">{insight.message}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Run tests and build**

Run:

```bash
npm run test
npm run build
```

Expected: all Vitest tests pass and Next.js build completes after valid Supabase environment variables are present.

- [ ] **Step 7: Commit**

```bash
git add src/lib/repositories src/app/actions/monthly-close.ts "src/app/(app)/assets/page.tsx" "src/app/(app)/monthly-close/page.tsx"
git commit -m "feat: add assets and monthly close"
```

## Task 9: Add Settings Seeds and Admin Guard

**Files:**
- Create: `src/app/(app)/settings/page.tsx`
- Modify: `supabase/migrations/0001_initial_schema.sql`

- [ ] **Step 1: Add settings page using admin guard**

Create `src/app/(app)/settings/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/auth/require-user";

export default async function SettingsPage() {
  const { profile } = await requireAdmin();

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-ink/65">Admin controls for household setup.</p>
      </header>
      <section className="grid gap-3 rounded-md border border-line bg-white p-4">
        <h2 className="text-base font-semibold">Current admin</h2>
        <p className="text-sm text-ink/70">{profile.display_name}</p>
      </section>
      <section className="grid gap-3 rounded-md border border-line bg-white p-4">
        <h2 className="text-base font-semibold">Next setup actions</h2>
        <ul className="grid gap-2 text-sm text-ink/70">
          <li>Create household accounts in Supabase.</li>
          <li>Create income and expense categories.</li>
          <li>Create monthly category budgets.</li>
          <li>Invite family members through Supabase Auth.</li>
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Add seed SQL comments for first admin setup**

Append this operational note to the end of `supabase/migrations/0001_initial_schema.sql`:

```sql
-- First-admin setup after creating a Supabase Auth user:
-- insert into households (id, name) values ('00000000-0000-0000-0000-000000000001', 'My Household');
-- insert into profiles (id, household_id, display_name, role, status)
-- values ('AUTH_USER_UUID', '00000000-0000-0000-0000-000000000001', 'Admin', 'admin', 'active');
```

- [ ] **Step 3: Build and commit**

Run:

```bash
npm run build
```

Expected: build passes with environment variables set.

Commit:

```bash
git add "src/app/(app)/settings/page.tsx" supabase/migrations/0001_initial_schema.sql
git commit -m "feat: add admin settings page"
```

## Task 10: Final Verification and Vercel/Supabase Deployment Checklist

**Files:**
- Create: `docs/deployment.md`

- [ ] **Step 1: Create deployment documentation**

Create `docs/deployment.md`:

```md
# Deployment

## Supabase

1. Create a Supabase project.
2. Disable public sign-up for the production project.
3. Apply migrations with `supabase db push`.
4. Create the first Auth user.
5. Insert the household and first admin profile using the SQL note in `supabase/migrations/0001_initial_schema.sql`.
6. Confirm RLS is enabled on every finance table.

## Vercel

Set these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Deploy from the repository root. The build command is `npm run build`.

## Verification

Run before deployment:

```bash
npm run test
npm run build
npm run test:e2e
```

After deployment:

1. Visit the Vercel URL.
2. Confirm unauthenticated users land on `/login`.
3. Sign in as the first admin.
4. Confirm `/today`, `/assets`, `/monthly-close`, and `/settings` load.
5. Create one account, one expense category, one transaction, and regenerate a monthly close.
```

- [ ] **Step 2: Run complete verification**

Run:

```bash
npm run test
npm run build
npm run test:e2e
```

Expected:

- Vitest passes all domain and validation tests.
- Next.js production build succeeds.
- Playwright confirms login screen renders on desktop and mobile.

- [ ] **Step 3: Commit**

```bash
git add docs/deployment.md
git commit -m "docs: add deployment checklist"
```

## Self-Review Notes

- Spec coverage: The plan covers Vercel hosting, Supabase Auth/Postgres/RLS, invite-only access, responsive app shell, quick transaction entry, accounts/assets, monthly closing, rule-based insights, validation, and deployment verification.
- Known scope boundary: Full admin CRUD for accounts, categories, budgets, and family invitations is intentionally not fully built in this MVP pass. The Settings page establishes the admin-only boundary and operational setup path; a follow-up plan should expand settings CRUD after the main finance workflow is working.
- Test coverage: Pure finance logic and validation are unit tested. Authenticated database flows rely on Supabase integration and manual deployment verification in this plan.
