create or replace function public.pal_round_bets(p_round uuid)
returns table(display_name text, cost numeric, created_at timestamptz)
language plpgsql stable security definer set search_path to 'public' as $$
declare v_group uuid;
begin
  select group_id into v_group from pal_rounds where id = p_round;
  if v_group is null or not pal_is_staff(v_group) then raise exception 'not authorized'; end if;
  return query
    select m.display_name::text, tk.cost::numeric, tk.created_at
    from pal_tickets tk
    join pal_members m on m.user_id = tk.user_id and m.group_id = tk.group_id
    where tk.round_id = p_round
    order by tk.created_at;
end $$;
revoke all on function public.pal_round_bets(uuid) from public, anon;
grant execute on function public.pal_round_bets(uuid) to authenticated;
