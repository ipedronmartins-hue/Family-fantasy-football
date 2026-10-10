-- O valor do prémio e do acumulado não é mostrado a ninguém; a caixa só ao capitão/tesoureiro.
create or replace function pal_round_summary(p_round uuid)
returns table(pot numeric, prize1 numeric, prize2 numeric, caixa numeric, carry_in numeric,
              carry_out numeric, overflow numeric, tickets bigint, settled boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  v_round pal_rounds%rowtype;
  v_group pal_groups%rowtype;
  v_pot numeric;
  v_tickets bigint;
  v_p1 numeric;
  v_staff boolean;
begin
  select * into v_round from pal_rounds where id = p_round;
  if v_round.id is null or not pal_is_member(v_round.group_id) then raise exception 'not authorized'; end if;
  v_staff := pal_is_staff(v_round.group_id);
  select count(*), coalesce(sum(tk.cost), 0) into v_tickets, v_pot from pal_tickets tk where tk.round_id = p_round;
  if v_round.status = 'settled' then
    return query select v_round.pot, null::numeric, null::numeric,
                        case when v_staff then v_round.caixa else null end, null::numeric,
                        v_round.carry_out, case when v_staff then v_round.overflow else null end, v_tickets, true;
    return;
  end if;
  select * into v_group from pal_groups where id = v_round.group_id;
  v_p1 := round(v_pot * coalesce(v_group.p1_pct, 0) / 100, 2);
  return query select v_pot, null::numeric, null::numeric,
                      case when v_staff then v_pot - v_p1 else null end, null::numeric,
                      null::numeric, null::numeric, v_tickets, false;
end $$;

revoke select on pal_rounds from authenticated;
grant select (id, group_id, number, status, pot, carry_out, created_at, settled_at, bets_closed_at, super_fixture_id)
  on pal_rounds to authenticated;
