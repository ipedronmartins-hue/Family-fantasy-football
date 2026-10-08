-- Palpites dos Leões, parte 4: jornadas agendadas, inserção em bulk, editar jogos.
-- (Aplicada em produção como "palpites_leoes_4_jornadas_agendadas_e_bulk".)
-- Nota: a migração inicial deste módulo foi aplicada em várias partes; os ficheiros do repositório
-- refletem o estado final. pal_settle_round abaixo substitui a versão anterior.

alter table pal_rounds drop constraint pal_rounds_status_check;
alter table pal_rounds add constraint pal_rounds_status_check check (status in ('scheduled', 'open', 'settled', 'cancelled'));
alter table pal_rounds drop constraint pal_rounds_group_id_number_key;
create unique index pal_rounds_group_number_live on pal_rounds (group_id, number) where status <> 'cancelled';
create unique index pal_rounds_one_open on pal_rounds (group_id) where status = 'open';

-- Abre a próxima jornada agendada (menor número) se não houver nenhuma aberta, com o acumulado em jogo.
create or replace function pal_promote_next(p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_next uuid;
  v_carry numeric;
begin
  if exists (select 1 from pal_rounds where group_id = p_group and status = 'open') then return; end if;
  select id into v_next from pal_rounds where group_id = p_group and status = 'scheduled' order by number limit 1;
  if v_next is null then return; end if;
  select coalesce(carry_out, 0) into v_carry
  from pal_rounds where group_id = p_group and status = 'settled' order by settled_at desc limit 1;
  update pal_rounds set status = 'open', carry_in = coalesce(v_carry, 0) where id = v_next;
end $$;
revoke execute on function pal_promote_next(uuid) from public, anon, authenticated;

-- [{"number": 3, "fixtures": [{"home","away","kickoff"}]}]; kickoff em hora de Lisboa.
create or replace function pal_create_rounds(p_group uuid, p_rounds jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  f jsonb;
  v_round uuid;
  v_num int;
  v_next int;
  v_n int;
  i int;
  v_count int := 0;
  v_kick timestamptz;
begin
  if not pal_is_admin(p_group) then raise exception 'not authorized'; end if;
  perform 1 from pal_groups where id = p_group for update;
  if p_rounds is null or jsonb_typeof(p_rounds) <> 'array' or jsonb_array_length(p_rounds) = 0
     or jsonb_array_length(p_rounds) > 60 then
    raise exception 'invalid fixtures';
  end if;
  select coalesce(max(number), 0) + 1 into v_next from pal_rounds where group_id = p_group;

  for r in select * from jsonb_array_elements(p_rounds) loop
    v_num := coalesce(nullif(r ->> 'number', '')::int, v_next);
    v_next := greatest(v_next, v_num + 1);
    if jsonb_typeof(r -> 'fixtures') <> 'array' then raise exception 'invalid fixtures'; end if;
    v_n := jsonb_array_length(r -> 'fixtures');
    if v_n < 2 or v_n > 13 then raise exception 'invalid fixtures'; end if;

    begin
      insert into pal_rounds (group_id, number, status) values (p_group, v_num, 'scheduled')
      returning id into v_round;
    exception when unique_violation then
      raise exception 'round number exists';
    end;

    i := 0;
    for f in select * from jsonb_array_elements(r -> 'fixtures') loop
      i := i + 1;
      if btrim(coalesce(f ->> 'home', '')) = '' or btrim(coalesce(f ->> 'away', '')) = ''
         or lower(btrim(f ->> 'home')) = lower(btrim(f ->> 'away')) then
        raise exception 'invalid fixtures';
      end if;
      begin
        v_kick := (f ->> 'kickoff')::timestamp at time zone 'Europe/Lisbon';
      exception when others then
        raise exception 'invalid kickoff';
      end;
      if v_kick is null then raise exception 'invalid kickoff'; end if;
      if v_kick <= now() then raise exception 'kickoff in the past'; end if;
      insert into pal_fixtures (round_id, position, home, away, kickoff)
      values (v_round, i, btrim(f ->> 'home'), btrim(f ->> 'away'), v_kick);
    end loop;
    v_count := v_count + 1;
  end loop;

  perform pal_promote_next(p_group);
  return v_count;
end $$;

create or replace function pal_update_fixture(p_fixture uuid, p_home text, p_away text, p_kickoff_local text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_fix pal_fixtures%rowtype;
  v_round pal_rounds%rowtype;
  v_kick timestamptz;
  v_home text := btrim(coalesce(p_home, ''));
  v_away text := btrim(coalesce(p_away, ''));
begin
  select * into v_fix from pal_fixtures where id = p_fixture;
  if v_fix.id is null then raise exception 'fixture not found'; end if;
  select * into v_round from pal_rounds where id = v_fix.round_id for update;
  if not pal_is_admin(v_round.group_id) then raise exception 'not authorized'; end if;
  if v_round.status = 'settled' or v_fix.result is not null then raise exception 'round closed'; end if;
  if v_home = '' or v_away = '' or lower(v_home) = lower(v_away) or length(v_home) > 60 or length(v_away) > 60 then
    raise exception 'invalid fixtures';
  end if;
  begin
    v_kick := p_kickoff_local::timestamp at time zone 'Europe/Lisbon';
  exception when others then
    raise exception 'invalid kickoff';
  end;
  if v_kick is null or v_kick <= now() then raise exception 'kickoff in the past'; end if;
  if (v_home <> v_fix.home or v_away <> v_fix.away)
     and exists (select 1 from pal_tickets where round_id = v_round.id) then
    raise exception 'round has tickets';
  end if;
  update pal_fixtures set home = v_home, away = v_away, kickoff = v_kick where id = p_fixture;
end $$;

-- "Apagar" jornada = cancelar (sem palpites). O número volta a ficar livre.
create or replace function pal_delete_round(p_round uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_round pal_rounds%rowtype;
begin
  select * into v_round from pal_rounds where id = p_round for update;
  if v_round.id is null then raise exception 'round not found'; end if;
  if not pal_is_admin(v_round.group_id) then raise exception 'not authorized'; end if;
  if v_round.status not in ('open', 'scheduled') or exists (select 1 from pal_tickets where round_id = p_round) then
    raise exception 'round has tickets';
  end if;
  update pal_rounds set status = 'cancelled' where id = p_round;
  perform pal_promote_next(v_round.group_id);
end $$;

-- pal_settle_round: igual à versão anterior, mas no fim abre a jornada agendada seguinte:
--     perform pal_promote_next(v_round.group_id);
-- (ver a função em produção; foi substituída por inteiro na migração aplicada.)

revoke execute on function pal_create_rounds(uuid, jsonb), pal_update_fixture(uuid, text, text, text),
  pal_delete_round(uuid), pal_settle_round(uuid) from public, anon;
grant execute on function pal_create_rounds(uuid, jsonb), pal_update_fixture(uuid, text, text, text),
  pal_delete_round(uuid), pal_settle_round(uuid) to authenticated;
