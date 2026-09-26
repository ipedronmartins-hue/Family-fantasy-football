create or replace function register_platform_payment(
  p_team_id uuid,
  p_month date,
  p_amount numeric,
  p_method text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from parents where id = auth.uid() and is_platform_owner) then
    raise exception 'not authorized';
  end if;

  insert into platform_payments (team_id, month, amount, method, registered_by)
  values (p_team_id, p_month, p_amount, p_method, auth.uid())
  on conflict (team_id, month) do update
    set amount = excluded.amount, method = excluded.method, paid_at = now(), registered_by = excluded.registered_by;
end;
$$;

revoke execute on function register_platform_payment(uuid, date, numeric, text) from public, anon;
grant execute on function register_platform_payment(uuid, date, numeric, text) to authenticated;
