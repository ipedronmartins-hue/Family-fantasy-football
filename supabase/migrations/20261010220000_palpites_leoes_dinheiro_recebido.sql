create or replace function public.pal_cash_summary(p_group uuid)
returns table(received numeric, in_wallets numeric, bet_total numeric)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not pal_is_staff(p_group) then raise exception 'not authorized'; end if;
  return query
    select coalesce(sum(l.delta) filter (where l.kind='grant' and coalesce(l.note,'') not ilike 'Reembolso%'),0)::numeric,
           coalesce(sum(l.delta),0)::numeric,
           coalesce(-sum(l.delta) filter (where l.kind='bet'),0)::numeric
    from pal_ledger l where l.group_id = p_group;
end $$;
revoke all on function public.pal_cash_summary(uuid) from public, anon;
grant execute on function public.pal_cash_summary(uuid) to authenticated;
