-- Allow a "quotas" category for the monthly family contribution, alongside
-- the existing expense categories.
alter table team_fund_entries drop constraint if exists team_fund_entries_category_check;
alter table team_fund_entries add constraint team_fund_entries_category_check
  check (category in ('transporte','equipamento','torneios','inscricoes','material','outros','quotas'));

create table family_payments (
  id uuid primary key default gen_random_uuid(),
  fantasy_team_id uuid not null references fantasy_teams(id) on delete cascade,
  season_id uuid not null references seasons(id) on delete cascade,
  month date not null, -- first day of the month, e.g. 2026-11-01
  amount numeric not null default 5,
  method text not null default 'mbway',
  paid_at timestamptz not null default now(),
  registered_by uuid references parents(id),
  fund_entry_id uuid references team_fund_entries(id),
  unique (fantasy_team_id, month)
);

alter table family_payments enable row level security;

create policy "owner selects own payments" on family_payments for select using (
  exists (select 1 from fantasy_teams ft where ft.id = family_payments.fantasy_team_id and ft.parent_id = auth.uid())
);
create policy "admin selects all payments" on family_payments for select using (
  exists (select 1 from parents where id = auth.uid() and is_admin)
);
create policy "admin inserts payments" on family_payments for insert with check (
  exists (select 1 from parents where id = auth.uid() and is_admin)
);
create policy "admin deletes payments" on family_payments for delete using (
  exists (select 1 from parents where id = auth.uid() and is_admin)
);

-- Registering a payment does two things atomically: records who paid for
-- which month, and adds the matching income line to the team fund ledger,
-- so /fundo never drifts out of sync with what admin has actually confirmed.
create or replace function register_family_payment(
  p_fantasy_team_id uuid,
  p_month date,
  p_amount numeric,
  p_method text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season_id uuid;
  v_team_name text;
  v_fund_entry_id uuid;
begin
  if not exists (select 1 from parents where id = auth.uid() and is_admin) then
    raise exception 'not authorized';
  end if;

  select season_id, name into v_season_id, v_team_name
  from fantasy_teams where id = p_fantasy_team_id;

  insert into team_fund_entries (season_id, category, description, amount, entry_type)
  values (v_season_id, 'quotas', v_team_name || ' · quota ' || to_char(p_month, 'MM/YYYY'), p_amount, 'receita')
  returning id into v_fund_entry_id;

  insert into family_payments (fantasy_team_id, season_id, month, amount, method, registered_by, fund_entry_id)
  values (p_fantasy_team_id, v_season_id, p_month, p_amount, p_method, auth.uid(), v_fund_entry_id)
  on conflict (fantasy_team_id, month) do update
    set amount = excluded.amount, method = excluded.method, paid_at = now(), fund_entry_id = excluded.fund_entry_id;
end;
$$;

revoke execute on function register_family_payment(uuid, date, numeric, text) from public;
grant execute on function register_family_payment(uuid, date, numeric, text) to authenticated;
