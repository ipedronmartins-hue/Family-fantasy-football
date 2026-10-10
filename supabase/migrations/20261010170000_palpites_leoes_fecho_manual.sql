-- Palpites dos Leões: os palpites passam a fechar SÓ quando o capitão fecha (não pela hora do 1.º jogo).
alter table pal_rounds add column if not exists bets_closed_at timestamptz;

create or replace function pal_round_closed(p_round uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(r.status = 'settled' or r.bets_closed_at is not null, false)
  from pal_rounds r where r.id = p_round;
$$;

create or replace function pal_place_ticket(p_round uuid, p_picks jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_round pal_rounds%rowtype;
  v_group pal_groups%rowtype;
  v_n int;
  v_norm jsonb;
  v_cost int;
  v_used numeric;
  v_balance numeric;
  v_ticket uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_round from pal_rounds where id = p_round;
  if v_round.id is null then raise exception 'round not found'; end if;
  select * into v_group from pal_groups where id = v_round.group_id;

  perform 1 from pal_members
  where user_id = v_uid and group_id = v_round.group_id and status = 'active' for update;
  if not found then raise exception 'not an active member'; end if;

  if v_round.status <> 'open' or v_round.bets_closed_at is not null then raise exception 'round closed'; end if;
  select count(*) into v_n from pal_fixtures where round_id = p_round;
  if v_n = 0 then raise exception 'round closed'; end if;

  select n.norm, n.cost into v_norm, v_cost from pal_normalize_picks(p_picks, v_n) n;

  select coalesce(sum(t.cost), 0) into v_used from pal_tickets t where t.round_id = p_round and t.user_id = v_uid;
  if v_group.member_limit is not null and v_used + v_cost > v_group.member_limit then
    raise exception 'limit exceeded';
  end if;

  select coalesce(sum(delta), 0) into v_balance from pal_ledger where group_id = v_group.id and user_id = v_uid;
  if v_balance < v_cost then raise exception 'insufficient finos'; end if;

  insert into pal_tickets (round_id, group_id, user_id, picks, cost)
  values (p_round, v_group.id, v_uid, v_norm, v_cost) returning id into v_ticket;
  insert into pal_ledger (group_id, user_id, delta, kind, round_id, ticket_id, created_by)
  values (v_group.id, v_uid, -v_cost, 'bet', p_round, v_ticket, v_uid);
  return v_ticket;
end $$;

-- O capitão fecha (ou reabre) os palpites da jornada aberta.
create or replace function pal_set_bets_closed(p_round uuid, p_closed boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_round pal_rounds%rowtype;
begin
  select * into v_round from pal_rounds where id = p_round for update;
  if v_round.id is null then raise exception 'round not found'; end if;
  if not pal_is_admin(v_round.group_id) then raise exception 'not authorized'; end if;
  if v_round.status <> 'open' then raise exception 'round closed'; end if;
  update pal_rounds set bets_closed_at = case when p_closed then now() else null end where id = p_round;
end $$;
revoke execute on function pal_set_bets_closed(uuid, boolean) from public, anon;
grant execute on function pal_set_bets_closed(uuid, boolean) to authenticated;
