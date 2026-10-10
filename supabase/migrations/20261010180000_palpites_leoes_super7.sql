-- Palpites dos Leões: Super 7 (resultado exato de um jogo escolhido pelo capitão) e fim do 2.º prémio.
-- Prémio único: acertar todos os jogos 1X2 + o resultado exato do jogo Super 7. Acumula se ninguém acertar.
alter table pal_fixtures add column if not exists score_home smallint check (score_home is null or score_home between 0 and 50);
alter table pal_fixtures add column if not exists score_away smallint check (score_away is null or score_away between 0 and 50);
alter table pal_rounds add column if not exists super_fixture_id uuid references pal_fixtures(id) on delete set null;
alter table pal_tickets add column if not exists super_home smallint check (super_home is null or super_home between 0 and 50);
alter table pal_tickets add column if not exists super_away smallint check (super_away is null or super_away between 0 and 50);
alter table pal_tickets add column if not exists super_hit boolean;

-- O capitão escolhe (ou limpa) o jogo Super 7 da jornada, enquanto não há boletins.
create or replace function pal_set_super_fixture(p_round uuid, p_fixture uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_round pal_rounds%rowtype;
begin
  select * into v_round from pal_rounds where id = p_round for update;
  if v_round.id is null then raise exception 'round not found'; end if;
  if not pal_is_admin(v_round.group_id) then raise exception 'not authorized'; end if;
  if v_round.status not in ('open', 'scheduled') then raise exception 'round closed'; end if;
  if exists (select 1 from pal_tickets where round_id = p_round) then raise exception 'round has tickets'; end if;
  if p_fixture is not null and not exists (select 1 from pal_fixtures where id = p_fixture and round_id = p_round) then
    raise exception 'fixture not found';
  end if;
  update pal_rounds set super_fixture_id = p_fixture where id = p_round;
end $$;

-- Resultado exato do jogo Super 7 (também define o 1X2 desse jogo).
create or replace function pal_set_super_score(p_fixture uuid, p_home int, p_away int) returns void
language plpgsql security definer set search_path = public as $$
declare v_fix pal_fixtures%rowtype; v_round pal_rounds%rowtype;
begin
  select * into v_fix from pal_fixtures where id = p_fixture;
  if v_fix.id is null then raise exception 'fixture not found'; end if;
  select * into v_round from pal_rounds where id = v_fix.round_id;
  if not pal_is_admin(v_round.group_id) then raise exception 'not authorized'; end if;
  if v_round.status <> 'open' then raise exception 'round closed'; end if;
  if v_round.super_fixture_id is distinct from p_fixture then raise exception 'not super fixture'; end if;
  if p_home is null or p_away is null or p_home not between 0 and 50 or p_away not between 0 and 50 then
    raise exception 'invalid score';
  end if;
  if now() < v_fix.kickoff then raise exception 'not started'; end if;
  update pal_fixtures
  set score_home = p_home, score_away = p_away,
      result = case when p_home > p_away then '1' when p_home = p_away then 'X' else '2' end
  where id = p_fixture;
end $$;

-- O jogo Super 7 só se regista pelo resultado exato.
create or replace function pal_set_result(p_fixture uuid, p_result text) returns void
language plpgsql security definer set search_path = public as $$
declare v_fix pal_fixtures%rowtype; v_round pal_rounds%rowtype;
begin
  select * into v_fix from pal_fixtures where id = p_fixture;
  if v_fix.id is null then raise exception 'fixture not found'; end if;
  select * into v_round from pal_rounds where id = v_fix.round_id;
  if not pal_is_admin(v_round.group_id) then raise exception 'not authorized'; end if;
  if v_round.status <> 'open' then raise exception 'round closed'; end if;
  if v_round.super_fixture_id = p_fixture then raise exception 'super fixture'; end if;
  if p_result is not null and p_result not in ('1', 'X', '2') then raise exception 'invalid result'; end if;
  if p_result is not null and now() < v_fix.kickoff then raise exception 'not started'; end if;
  update pal_fixtures set result = p_result where id = p_fixture;
end $$;

create or replace function pal_place_bet(p_round uuid, p_picks jsonb, p_super_home int default null, p_super_away int default null)
returns uuid
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

  if v_round.super_fixture_id is not null then
    if p_super_home is null or p_super_away is null
       or p_super_home not between 0 and 50 or p_super_away not between 0 and 50 then
      raise exception 'invalid super';
    end if;
  else
    p_super_home := null; p_super_away := null;
  end if;

  select n.norm, n.cost into v_norm, v_cost from pal_normalize_picks(p_picks, v_n) n;

  select coalesce(sum(t.cost), 0) into v_used from pal_tickets t where t.round_id = p_round and t.user_id = v_uid;
  if v_group.member_limit is not null and v_used + v_cost > v_group.member_limit then
    raise exception 'limit exceeded';
  end if;

  select coalesce(sum(delta), 0) into v_balance from pal_ledger where group_id = v_group.id and user_id = v_uid;
  if v_balance < v_cost then raise exception 'insufficient finos'; end if;

  insert into pal_tickets (round_id, group_id, user_id, picks, cost, super_home, super_away)
  values (p_round, v_group.id, v_uid, v_norm, v_cost, p_super_home, p_super_away) returning id into v_ticket;
  insert into pal_ledger (group_id, user_id, delta, kind, round_id, ticket_id, created_by)
  values (v_group.id, v_uid, -v_cost, 'bet', p_round, v_ticket, v_uid);
  return v_ticket;
end $$;

-- A função antiga passa a delegar na nova (sem Super 7: só funciona em jornadas sem Super 7).
create or replace function pal_place_ticket(p_round uuid, p_picks jsonb) returns uuid
language sql security definer set search_path = public as $$
  select pal_place_bet(p_round, p_picks, null, null);
$$;

-- Só há 1.º prémio: o 2.º deixa de existir (p2 fica sempre a 0).
create or replace function pal_update_settings(
  p_group uuid, p_fino_value numeric, p_p1 numeric, p_p2 numeric, p_limit int, p_cap numeric
) returns void
language plpgsql security definer set search_path = public as $$
declare v_group pal_groups%rowtype;
begin
  if not pal_is_admin(p_group) then raise exception 'not authorized'; end if;
  if coalesce(p_p1, 0) > 100 then raise exception 'percentages over 100'; end if;
  select * into v_group from pal_groups where id = p_group for update;

  if exists (
    select 1 from pal_tickets t join pal_rounds r on r.id = t.round_id
    where r.group_id = p_group and r.status = 'open'
  ) and (
    v_group.p1_pct is distinct from p_p1
    or v_group.member_limit is distinct from p_limit or v_group.jackpot_cap is distinct from p_cap
  ) then
    raise exception 'round in progress';
  end if;

  update pal_groups
  set fino_value = p_fino_value, p1_pct = p_p1, p2_pct = 0, member_limit = p_limit, jackpot_cap = p_cap
  where id = p_group;
end $$;

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
begin
  select * into v_round from pal_rounds where id = p_round;
  if v_round.id is null or not pal_is_member(v_round.group_id) then raise exception 'not authorized'; end if;
  select count(*), coalesce(sum(tk.cost), 0) into v_tickets, v_pot from pal_tickets tk where tk.round_id = p_round;
  if v_round.status = 'settled' then
    return query select v_round.pot, v_round.prize1, 0::numeric, v_round.caixa, v_round.carry_in,
                        v_round.carry_out, v_round.overflow, v_tickets, true;
    return;
  end if;
  select * into v_group from pal_groups where id = v_round.group_id;
  v_p1 := round(v_pot * coalesce(v_group.p1_pct, 0) / 100, 2);
  return query select v_pot, v_p1 + v_round.carry_in, 0::numeric, v_pot - v_p1, v_round.carry_in,
                      null::numeric, null::numeric, v_tickets, false;
end $$;

create or replace function pal_settle_round(p_round uuid)
returns table(pot numeric, prize1 numeric, prize2 numeric, caixa numeric, carry numeric, winners1 numeric, winners2 numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_round pal_rounds%rowtype;
  v_group pal_groups%rowtype;
  v_sf pal_fixtures%rowtype;
  v_has_super boolean;
  v_sok boolean;
  v_results text[];
  v_n int;
  v_pot numeric;
  v_pool1 numeric;
  v_caixa numeric;
  v_w1 numeric := 0;
  v_per1 numeric := 0;
  v_raw numeric;
  v_carry numeric;
  v_over numeric;
  t record;
  v_ways numeric[];
  v_prize numeric;
  v_best int;
  h int;
begin
  select * into v_round from pal_rounds where id = p_round for update;
  if v_round.id is null then raise exception 'round not found'; end if;
  if not pal_is_admin(v_round.group_id) then raise exception 'not authorized'; end if;
  if v_round.status = 'settled' then raise exception 'already settled'; end if;
  if v_round.status <> 'open' then raise exception 'round closed'; end if;
  select * into v_group from pal_groups where id = v_round.group_id;

  if exists (select 1 from pal_fixtures f where f.round_id = p_round and f.result is null) then
    raise exception 'missing results';
  end if;
  v_has_super := v_round.super_fixture_id is not null;
  if v_has_super then
    select * into v_sf from pal_fixtures where id = v_round.super_fixture_id;
    if v_sf.score_home is null or v_sf.score_away is null then raise exception 'missing results'; end if;
  end if;
  select array_agg(f.result order by f.position), count(*) into v_results, v_n
  from pal_fixtures f where f.round_id = p_round;

  select coalesce(sum(tk.cost), 0) into v_pot from pal_tickets tk where tk.round_id = p_round;
  v_pool1 := round(v_pot * coalesce(v_group.p1_pct, 0) / 100, 2);
  v_caixa := v_pot - v_pool1;
  v_pool1 := v_pool1 + v_round.carry_in;

  -- Prémio único: todos os jogos certos E (se houver Super 7) o resultado exato do Super 7.
  for t in select tk.id, tk.picks, tk.super_home, tk.super_away from pal_tickets tk where tk.round_id = p_round loop
    v_sok := not v_has_super or (t.super_home = v_sf.score_home and t.super_away = v_sf.score_away);
    if v_sok then
      v_ways := pal_hit_counts(t.picks, v_results);
      v_w1 := v_w1 + v_ways[v_n + 1];
    end if;
  end loop;
  if v_w1 > 0 then v_per1 := trunc(v_pool1 / v_w1, 2); end if;

  for t in select tk.id, tk.user_id, tk.group_id, tk.picks, tk.super_home, tk.super_away from pal_tickets tk where tk.round_id = p_round loop
    v_sok := not v_has_super or (t.super_home = v_sf.score_home and t.super_away = v_sf.score_away);
    v_ways := pal_hit_counts(t.picks, v_results);
    v_best := 0;
    for h in reverse v_n..0 loop
      if v_ways[h + 1] > 0 then v_best := h; exit; end if;
    end loop;
    v_prize := case when v_sok then v_ways[v_n + 1] * v_per1 else 0 end;
    update pal_tickets
    set best_hits = v_best + case when v_has_super and v_sok then 1 else 0 end,
        super_hit = case when v_has_super then v_sok else null end,
        prize = v_prize, settled = true
    where id = t.id;
    if v_prize > 0 then
      insert into pal_ledger (group_id, user_id, delta, kind, round_id, ticket_id, created_by)
      values (t.group_id, t.user_id, v_prize, 'prize', p_round, t.id, auth.uid());
    end if;
  end loop;

  v_caixa := v_caixa + case when v_w1 > 0 then v_pool1 - v_per1 * v_w1 else 0 end;
  v_raw := case when v_w1 = 0 then v_pool1 else 0 end;
  v_carry := case when v_group.jackpot_cap is null then v_raw else least(v_raw, v_group.jackpot_cap) end;
  v_over := v_raw - v_carry;
  v_caixa := v_caixa + v_over;

  update pal_rounds r
  set status = 'settled', settled_at = now(), pot = v_pot, prize1 = v_pool1, prize2 = 0,
      caixa = v_caixa, carry_out = v_carry, overflow = v_over
  where r.id = p_round;

  perform pal_promote_next(v_round.group_id);

  return query select v_pot, v_pool1, 0::numeric, v_caixa, v_carry, v_w1, 0::numeric;
end $$;

revoke execute on function pal_set_super_fixture(uuid, uuid), pal_set_super_score(uuid, int, int),
  pal_place_bet(uuid, jsonb, int, int) from public, anon;
grant execute on function pal_set_super_fixture(uuid, uuid), pal_set_super_score(uuid, int, int),
  pal_place_bet(uuid, jsonb, int, int) to authenticated;
