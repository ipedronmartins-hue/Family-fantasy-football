-- General-purpose fund movement, deliberately lightweight: amount + type is
-- all that's required. Category and description are optional so the admin
-- never has to itemize precisely if they don't want to.
create or replace function register_fund_entry(
  p_season_id uuid,
  p_entry_type text,
  p_amount numeric,
  p_description text default null,
  p_category text default 'outros'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_entry_type not in ('receita', 'despesa') then
    raise exception 'invalid entry_type';
  end if;

  if not exists (
    select 1 from parents where id = auth.uid() and is_admin and season_id = p_season_id
  ) then
    raise exception 'not authorized';
  end if;

  insert into team_fund_entries (season_id, category, description, amount, entry_type)
  values (p_season_id, coalesce(p_category, 'outros'), p_description, p_amount, p_entry_type);
end;
$$;

revoke execute on function register_fund_entry(uuid, text, numeric, text, text) from public, anon;
grant execute on function register_fund_entry(uuid, text, numeric, text, text) to authenticated;
