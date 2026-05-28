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
