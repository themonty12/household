create index if not exists accounts_household_status_name_idx
on accounts(household_id, status, name);

create index if not exists accounts_owner_user_id_idx
on accounts(owner_user_id)
where owner_user_id is not null;

create index if not exists categories_household_status_parent_sort_name_idx
on categories(household_id, status, parent_category_id, sort_order, name);

create index if not exists categories_parent_category_id_idx
on categories(parent_category_id)
where parent_category_id is not null;

create index if not exists transactions_household_status_date_created_idx
on transactions(household_id, status, date desc, created_at desc);

create index if not exists transactions_household_status_account_date_idx
on transactions(household_id, status, account_id, date);

create index if not exists transactions_household_status_category_date_idx
on transactions(household_id, status, category_id, date);

create index if not exists transactions_account_id_idx
on transactions(account_id);

create index if not exists transactions_to_account_id_idx
on transactions(to_account_id)
where to_account_id is not null;

create index if not exists transactions_category_id_idx
on transactions(category_id)
where category_id is not null;

create index if not exists transactions_user_id_idx
on transactions(user_id);

create index if not exists budgets_household_month_category_idx
on budgets(household_id, month, category_id);

create index if not exists budgets_category_id_idx
on budgets(category_id);

create index if not exists budgets_created_by_user_id_idx
on budgets(created_by_user_id);

create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;

create or replace function app_private.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from profiles where id = auth.uid() and status = 'active'
$$;

create or replace function app_private.current_app_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid() and status = 'active'
$$;

drop policy if exists "transactions household insert" on transactions;

create policy "transactions household insert" on transactions
for insert with check (
  household_id = app_private.current_household_id()
  and user_id = (select auth.uid())
);

drop policy if exists "transactions owner or admin update" on transactions;

create policy "transactions owner or admin update" on transactions
for update using (
  household_id = app_private.current_household_id()
  and (
    user_id = (select auth.uid())
    or app_private.current_app_role() = 'admin'
  )
)
with check (
  household_id = app_private.current_household_id()
  and (
    user_id = (select auth.uid())
    or app_private.current_app_role() = 'admin'
  )
);
