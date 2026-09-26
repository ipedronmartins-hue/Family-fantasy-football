alter table team_fund_entries drop constraint if exists team_fund_entries_category_check;
alter table team_fund_entries add constraint team_fund_entries_category_check
  check (category in ('transporte','equipamento','torneios','inscricoes','material','outros','quotas','servidor'));

-- Generic recurring fixed-cost logger, reusable beyond just the server bill.
-- Refuses to double-log the same category within the same calendar month.
create or replace function register_fixed_cost(
  p_category text,
  p_description text,
  p_amount numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season_id uuid := '00000000-0000-0000-0000-000000000003';
begin
  if not exists (select 1 from parents where id = auth.uid() and is_admin) then
    raise exception 'not authorized';
  end if;

  if exists (
    select 1 from team_fund_entries
    where category = p_category
      and entry_type = 'despesa'
      and date_trunc('month', created_at) = date_trunc('month', now())
  ) then
    raise exception 'already registered this month';
  end if;

  insert into team_fund_entries (season_id, category, description, amount, entry_type)
  values (v_season_id, p_category, p_description, p_amount, 'despesa');
end;
$$;

revoke execute on function register_fixed_cost(text, text, numeric) from public;
grant execute on function register_fixed_cost(text, text, numeric) to authenticated;

-- Log this month's server cost now, since hosting is already running.
insert into team_fund_entries (season_id, category, description, amount, entry_type)
values ('00000000-0000-0000-0000-000000000003', 'servidor', 'Alojamento da plataforma (Vercel + Supabase) · 09/2026', 15, 'despesa');
