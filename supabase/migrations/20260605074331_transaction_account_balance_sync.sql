create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;

create or replace function app_private.account_balance_delta(
  selected_account_type account_type,
  selected_transaction_type text,
  account_role text,
  selected_amount numeric
)
returns numeric
language plpgsql
immutable
set search_path = public
as $$
declare
  liability_multiplier numeric := case
    when selected_account_type in (
      'card'::account_type,
      'loan'::account_type,
      'other_liability'::account_type
    ) then -1
    else 1
  end;
begin
  if selected_transaction_type = 'income' then
    return selected_amount * liability_multiplier;
  end if;

  if selected_transaction_type = 'expense' then
    return -selected_amount * liability_multiplier;
  end if;

  if selected_transaction_type = 'transfer' then
    return (
      case when account_role = 'source' then -selected_amount else selected_amount end
    ) * liability_multiplier;
  end if;

  return selected_amount * liability_multiplier;
end;
$$;

create or replace function app_private.effective_transaction_type(
  selected_household_id uuid,
  selected_transaction_type transaction_type,
  selected_category_id uuid
)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  selected_category_type category_type;
begin
  if selected_transaction_type <> 'adjustment'::transaction_type then
    return selected_transaction_type::text;
  end if;

  select type
  into selected_category_type
  from categories
  where household_id = selected_household_id
    and id = selected_category_id;

  if selected_category_type in ('income'::category_type, 'expense'::category_type) then
    return selected_category_type::text;
  end if;

  raise exception 'adjustment transactions require an income or expense category';
end;
$$;

create or replace function app_private.apply_transaction_balance_effect(
  selected_household_id uuid,
  selected_transaction_type transaction_type,
  selected_amount numeric,
  selected_account_id uuid,
  selected_to_account_id uuid,
  selected_category_id uuid,
  effect_multiplier numeric
)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  effective_type text;
begin
  effective_type := app_private.effective_transaction_type(
    selected_household_id,
    selected_transaction_type,
    selected_category_id
  );

  update accounts
  set current_balance = current_balance + (
    effect_multiplier * app_private.account_balance_delta(type, effective_type, 'source', selected_amount)
  )
  where household_id = selected_household_id
    and id = selected_account_id;

  if not found then
    raise exception 'source account not found for transaction balance sync';
  end if;

  if effective_type = 'transfer' then
    update accounts
    set current_balance = current_balance + (
      effect_multiplier * app_private.account_balance_delta(type, effective_type, 'destination', selected_amount)
    )
    where household_id = selected_household_id
      and id = selected_to_account_id;

    if not found then
      raise exception 'destination account not found for transaction balance sync';
    end if;
  end if;
end;
$$;

create or replace function app_private.sync_account_balances_for_transaction()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'posted' then
      perform app_private.apply_transaction_balance_effect(
        new.household_id,
        new.type,
        new.amount,
        new.account_id,
        new.to_account_id,
        new.category_id,
        1
      );
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'posted' then
      perform app_private.apply_transaction_balance_effect(
        old.household_id,
        old.type,
        old.amount,
        old.account_id,
        old.to_account_id,
        old.category_id,
        -1
      );
    end if;

    if new.status = 'posted' then
      perform app_private.apply_transaction_balance_effect(
        new.household_id,
        new.type,
        new.amount,
        new.account_id,
        new.to_account_id,
        new.category_id,
        1
      );
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status = 'posted' then
      perform app_private.apply_transaction_balance_effect(
        old.household_id,
        old.type,
        old.amount,
        old.account_id,
        old.to_account_id,
        old.category_id,
        -1
      );
    end if;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists transactions_account_balance_sync on transactions;

create trigger transactions_account_balance_sync
after insert or update or delete on transactions
for each row execute function app_private.sync_account_balances_for_transaction();
