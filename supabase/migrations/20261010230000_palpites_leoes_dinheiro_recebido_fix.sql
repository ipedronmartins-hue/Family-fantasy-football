create or replace function public.pal_cash_summary(p_group uuid)
returns table(received numeric, in_wallets numeric, bet_total numeric)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not pal_is_staff(p_group) then raise exception 'not authorized'; end if;
  return query
    select coalesce((select sum(l.delta) from pal_ledger l where l.group_id=p_group and l.kind='grant' and coalesce(l.note,'') not ilike 'Reembolso%'),0)::numeric,
           coalesce((select sum(l.delta) from pal_ledger l where l.group_id=p_group),0)::numeric,
           coalesce((select sum(t.cost) from pal_tickets t where t.group_id=p_group),0)::numeric;
end $$;
