-- Palpites dos Leões: palpites 1X2 para um grupo fechado de uma equipa de seniores.
-- Área separada do Fantasy da formação: tabelas próprias (prefixo pal_), sem tocar nas existentes.
--
-- Princípios:
--  * a app não recebe nem paga dinheiro; o tesoureiro regista "finos" a quem pagou ao clube
--  * os finos não se compram na app: só o tesoureiro/administrador os regista
--  * toda a escrita passa por funções; as tabelas só têm leitura (RLS)
--  * regras (limites, fecho, prémios, acumulado) correm no servidor

-- ---------------------------------------------------------------- tabelas

create table pal_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  club_name text not null,
  -- Tudo o que se segue é definido à mão pelo administrador (null = por definir).
  fino_value numeric(10,2) check (fino_value is null or fino_value >= 0),
  p1_pct numeric(5,2) check (p1_pct is null or p1_pct between 0 and 100),
  p2_pct numeric(5,2) check (p2_pct is null or p2_pct between 0 and 100),
  member_limit integer check (member_limit is null or member_limit > 0),
  jackpot_cap numeric(12,2) check (jackpot_cap is null or jackpot_cap >= 0),
  created_at timestamptz not null default now(),
  check (coalesce(p1_pct, 0) + coalesce(p2_pct, 0) <= 100)
);

create table pal_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references pal_groups(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 2 and 60),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  is_admin boolean not null default false,
  is_treasurer boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, group_id)
);

create table pal_admin_invites (
  email text not null check (email = lower(email)),
  group_id uuid not null references pal_groups(id) on delete cascade,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (email, group_id)
);

create table pal_rounds (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references pal_groups(id) on delete cascade,
  number integer not null check (number > 0),
  status text not null default 'open' check (status in ('open', 'settled')),
  carry_in numeric(12,2) not null default 0,
  -- Fotografia gravada ao apurar (as definições do grupo podem mudar depois).
  pot numeric(12,2),
  prize1 numeric(12,2),
  prize2 numeric(12,2),
  caixa numeric(12,2),
  carry_out numeric(12,2),
  overflow numeric(12,2),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  unique (group_id, number)
);
create index pal_rounds_group_idx on pal_rounds (group_id);

create table pal_fixtures (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references pal_rounds(id) on delete cascade,
  position smallint not null check (position > 0),
  home text not null check (length(btrim(home)) between 1 and 60),
  away text not null check (length(btrim(away)) between 1 and 60),
  kickoff timestamptz not null,
  result text check (result in ('1', 'X', '2')),
  unique (round_id, position)
);

create table pal_tickets (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references pal_rounds(id) on delete cascade,
  group_id uuid not null,
  user_id uuid not null,
  picks jsonb not null,
  cost integer not null check (cost > 0),
  best_hits smallint,
  prize numeric(12,2) not null default 0,
  settled boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (user_id, group_id) references pal_members (user_id, group_id) on delete cascade
);
create index pal_tickets_round_idx on pal_tickets (round_id);
create index pal_tickets_user_idx on pal_tickets (user_id, round_id);
create index pal_tickets_member_idx on pal_tickets (group_id, user_id);

-- Livro de finos: só se acrescentam linhas, nunca se editam nem apagam.
create table pal_ledger (
  id bigint generated always as identity primary key,
  group_id uuid not null,
  user_id uuid not null,
  delta numeric(12,2) not null check (delta <> 0),
  kind text not null check (kind in ('grant', 'bet', 'prize')),
  round_id uuid references pal_rounds(id),
  ticket_id uuid references pal_tickets(id),
  note text check (note is null or length(note) <= 200),
  created_by uuid,
  created_at timestamptz not null default now(),
  foreign key (user_id, group_id) references pal_members (user_id, group_id) on delete cascade
);
create index pal_ledger_user_idx on pal_ledger (group_id, user_id);
create index pal_ledger_round_idx on pal_ledger (round_id);
create index pal_ledger_ticket_idx on pal_ledger (ticket_id);

-- ---------------------------------------------------------------- ajudantes de segurança

create or replace function pal_has_membership(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from pal_members where group_id = p_group and user_id = auth.uid());
$$;

create or replace function pal_is_member(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from pal_members where group_id = p_group and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function pal_is_admin(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from pal_members
    where group_id = p_group and user_id = auth.uid() and status = 'active' and is_admin
  );
$$;

create or replace function pal_is_staff(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from pal_members
    where group_id = p_group and user_id = auth.uid() and status = 'active' and (is_admin or is_treasurer)
  );
$$;

-- Os palpites dos outros só se vêem depois de a jornada fechar (1.º jogo começou ou jornada apurada).
create or replace function pal_round_closed(p_round uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    r.status = 'settled' or now() >= (select min(f.kickoff) from pal_fixtures f where f.round_id = r.id),
    false
  )
  from pal_rounds r where r.id = p_round;
$$;

-- ---------------------------------------------------------------- leitura (RLS)

alter table pal_groups enable row level security;
alter table pal_members enable row level security;
alter table pal_admin_invites enable row level security;
alter table pal_rounds enable row level security;
alter table pal_fixtures enable row level security;
alter table pal_tickets enable row level security;
alter table pal_ledger enable row level security;

revoke all on pal_groups, pal_members, pal_admin_invites, pal_rounds, pal_fixtures, pal_tickets, pal_ledger
  from public, anon, authenticated;
grant select on pal_groups, pal_members, pal_rounds, pal_fixtures, pal_tickets, pal_ledger to authenticated;
-- pal_admin_invites: sem nenhuma permissão; só as funções (security definer) lhe tocam.

create policy pal_groups_select on pal_groups for select to authenticated
  using (pal_has_membership(id));

create policy pal_members_select on pal_members for select to authenticated
  using (user_id = (select auth.uid()) or pal_is_admin(group_id));

create policy pal_rounds_select on pal_rounds for select to authenticated
  using (pal_is_member(group_id));

create policy pal_fixtures_select on pal_fixtures for select to authenticated
  using (exists (select 1 from pal_rounds r where r.id = pal_fixtures.round_id and pal_is_member(r.group_id)));

create policy pal_tickets_select on pal_tickets for select to authenticated
  using (user_id = (select auth.uid()) or (pal_is_member(group_id) and pal_round_closed(round_id)));

create policy pal_ledger_select on pal_ledger for select to authenticated
  using (user_id = (select auth.uid()) or pal_is_staff(group_id));

-- ---------------------------------------------------------------- lógica pura

-- Quantas combinações de um cartão têm 0..n acertos (índice = acertos + 1),
-- sem expandir as combinações (um cartão pode cobrir milhares).
create or replace function pal_hit_counts(p_picks jsonb, p_results text[]) returns numeric[]
language plpgsql immutable set search_path = public as $$
declare
  n int := coalesce(array_length(p_results, 1), 0);
  ways numeric[];
  nw numeric[];
  i int;
  h int;
  s int;
  hit boolean;
begin
  ways := array_fill(0::numeric, array[n + 1]);
  ways[1] := 1;
  for i in 1..n loop
    s := jsonb_array_length(p_picks -> (i - 1));
    hit := (p_picks -> (i - 1)) ? p_results[i];
    nw := array_fill(0::numeric, array[n + 1]);
    for h in 0..(i - 1) loop
      if ways[h + 1] = 0 then continue; end if;
      if hit then
        nw[h + 2] := nw[h + 2] + ways[h + 1];
        nw[h + 1] := nw[h + 1] + ways[h + 1] * (s - 1);
      else
        nw[h + 1] := nw[h + 1] + ways[h + 1] * s;
      end if;
    end loop;
    ways := nw;
  end loop;
  return ways;
end $$;

-- Valida os palpites e devolve-os normalizados (ordem 1, X, 2) com o custo.
create or replace function pal_normalize_picks(p_picks jsonb, p_n int, out norm jsonb, out cost int)
language plpgsql immutable set search_path = public as $$
declare
  i int;
  el jsonb;
  opts text[];
  len int;
begin
  if p_picks is null or jsonb_typeof(p_picks) <> 'array' or jsonb_array_length(p_picks) <> p_n then
    raise exception 'invalid picks';
  end if;
  norm := '[]'::jsonb;
  cost := 1;
  for i in 0..(p_n - 1) loop
    el := p_picks -> i;
    if jsonb_typeof(el) <> 'array' then raise exception 'invalid picks'; end if;
    len := jsonb_array_length(el);
    if len < 1 or len > 3 then raise exception 'invalid picks'; end if;
    if exists (
      select 1 from jsonb_array_elements(el) e
      where jsonb_typeof(e) <> 'string' or (e #>> '{}') not in ('1', 'X', '2')
    ) then raise exception 'invalid picks'; end if;
    select array_agg(distinct e #>> '{}') into opts from jsonb_array_elements(el) e;
    if array_length(opts, 1) <> len then raise exception 'invalid picks'; end if;
    norm := norm || jsonb_build_array(
      (select jsonb_agg(o order by case o when '1' then 1 when 'X' then 2 else 3 end) from unnest(opts) o)
    );
    cost := cost * len;
  end loop;
end $$;

-- ---------------------------------------------------------------- escrita: membros

create or replace function pal_join_group(p_slug text, p_name text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_group pal_groups%rowtype;
  v_status text;
  v_invited boolean;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_group from pal_groups where slug = p_slug;
  if v_group.id is null then raise exception 'group not found'; end if;

  select status into v_status from pal_members where user_id = v_uid and group_id = v_group.id;
  if v_status is not null then return v_status; end if;

  if length(btrim(coalesce(p_name, ''))) < 2 or length(btrim(p_name)) > 60 then
    raise exception 'invalid name';
  end if;

  select lower(email) into v_email from auth.users where id = v_uid;
  v_invited := exists (
    select 1 from pal_admin_invites
    where email = v_email and group_id = v_group.id and used_at is null
  );

  insert into pal_members (user_id, group_id, display_name, status, is_admin)
  values (v_uid, v_group.id, btrim(p_name), case when v_invited then 'active' else 'pending' end, v_invited);

  if v_invited then
    update pal_admin_invites set used_at = now() where email = v_email and group_id = v_group.id;
  end if;
  return case when v_invited then 'active' else 'pending' end;
end $$;

create or replace function pal_members_admin(p_group uuid)
returns table(user_id uuid, display_name text, status text, is_admin boolean, is_treasurer boolean, email text, balance numeric)
language plpgsql stable security definer set search_path = public as $$
declare v_admin boolean;
begin
  if not pal_is_staff(p_group) then raise exception 'not authorized'; end if;
  v_admin := pal_is_admin(p_group);
  return query
    select m.user_id, m.display_name::text, m.status::text, m.is_admin, m.is_treasurer,
           case when v_admin then u.email::text else null end,
           coalesce((select sum(l.delta) from pal_ledger l where l.group_id = m.group_id and l.user_id = m.user_id), 0)
    from pal_members m join auth.users u on u.id = m.user_id
    where m.group_id = p_group
    order by case m.status when 'pending' then 0 when 'active' then 1 else 2 end, m.display_name;
end $$;

create or replace function pal_set_member_status(p_group uuid, p_user uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not pal_is_admin(p_group) then raise exception 'not authorized'; end if;
  if p_status not in ('pending', 'active', 'suspended') then raise exception 'invalid status'; end if;
  if p_user = auth.uid() then raise exception 'own status'; end if;
  update pal_members set status = p_status
  where group_id = p_group and user_id = p_user and not is_admin;
  if not found then raise exception 'member not found'; end if;
end $$;

create or replace function pal_set_treasurer(p_group uuid, p_user uuid, p_flag boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not pal_is_admin(p_group) then raise exception 'not authorized'; end if;
  update pal_members set is_treasurer = coalesce(p_flag, false)
  where group_id = p_group and user_id = p_user and not is_admin;
  if not found then raise exception 'member not found'; end if;
end $$;

-- O tesoureiro regista finos a quem pagou a quota ao clube. Correções (valores negativos): só o administrador.
create or replace function pal_grant_finos(p_group uuid, p_user uuid, p_amount int, p_note text default null)
returns numeric
language plpgsql security definer set search_path = public as $$
declare v_balance numeric;
begin
  if not pal_is_staff(p_group) then raise exception 'not authorized'; end if;
  if p_amount is null or p_amount = 0 or abs(p_amount) > 500 then raise exception 'invalid amount'; end if;
  if p_amount < 0 and not pal_is_admin(p_group) then raise exception 'not authorized'; end if;

  perform 1 from pal_members
  where group_id = p_group and user_id = p_user and status = 'active' for update;
  if not found then raise exception 'member not found'; end if;

  select coalesce(sum(delta), 0) into v_balance from pal_ledger where group_id = p_group and user_id = p_user;
  if v_balance + p_amount < 0 then raise exception 'negative balance'; end if;

  insert into pal_ledger (group_id, user_id, delta, kind, note, created_by)
  values (p_group, p_user, p_amount, 'grant', nullif(btrim(p_note), ''), auth.uid());
  return v_balance + p_amount;
end $$;

-- ---------------------------------------------------------------- escrita: definições e jornadas

create or replace function pal_update_settings(
  p_group uuid, p_fino_value numeric, p_p1 numeric, p_p2 numeric, p_limit int, p_cap numeric
) returns void
language plpgsql security definer set search_path = public as $$
declare v_group pal_groups%rowtype;
begin
  if not pal_is_admin(p_group) then raise exception 'not authorized'; end if;
  if coalesce(p_p1, 0) + coalesce(p_p2, 0) > 100 then raise exception 'percentages over 100'; end if;
  select * into v_group from pal_groups where id = p_group for update;

  -- Com palpites já feitos na jornada aberta, as regras não mudam a meio.
  if exists (
    select 1 from pal_tickets t join pal_rounds r on r.id = t.round_id
    where r.group_id = p_group and r.status = 'open'
  ) and (
    v_group.p1_pct is distinct from p_p1 or v_group.p2_pct is distinct from p_p2
    or v_group.member_limit is distinct from p_limit or v_group.jackpot_cap is distinct from p_cap
  ) then
    raise exception 'round in progress';
  end if;

  update pal_groups
  set fino_value = p_fino_value, p1_pct = p_p1, p2_pct = p_p2, member_limit = p_limit, jackpot_cap = p_cap
  where id = p_group;
end $$;

-- p_fixtures: [{"home": "...", "away": "...", "kickoff": "2026-10-10 15:00"}], hora de Lisboa.
create or replace function pal_create_round(p_group uuid, p_number int, p_fixtures jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_round uuid;
  v_n int;
  v_num int;
  v_carry numeric;
  v_first timestamptz;
  f jsonb;
  i int := 0;
  v_kick timestamptz;
begin
  if not pal_is_admin(p_group) then raise exception 'not authorized'; end if;
  perform 1 from pal_groups where id = p_group for update;
  if exists (select 1 from pal_rounds where group_id = p_group and status = 'open') then
    raise exception 'round already open';
  end if;
  if p_fixtures is null or jsonb_typeof(p_fixtures) <> 'array' then raise exception 'invalid fixtures'; end if;
  v_n := jsonb_array_length(p_fixtures);
  if v_n < 2 or v_n > 13 then raise exception 'invalid fixtures'; end if;

  v_num := coalesce(p_number, (select coalesce(max(number), 0) + 1 from pal_rounds where group_id = p_group));
  select coalesce(carry_out, 0) into v_carry
  from pal_rounds where group_id = p_group and status = 'settled' order by settled_at desc limit 1;

  begin
    insert into pal_rounds (group_id, number, carry_in) values (p_group, v_num, coalesce(v_carry, 0))
    returning id into v_round;
  exception when unique_violation then
    raise exception 'round number exists';
  end;

  for f in select * from jsonb_array_elements(p_fixtures) loop
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
    insert into pal_fixtures (round_id, position, home, away, kickoff)
    values (v_round, i, btrim(f ->> 'home'), btrim(f ->> 'away'), v_kick);
  end loop;

  select min(kickoff) into v_first from pal_fixtures where round_id = v_round;
  if v_first <= now() then raise exception 'kickoff in the past'; end if;
  return v_round;
end $$;

create or replace function pal_set_fixture_kickoff(p_fixture uuid, p_kickoff_local text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_fix pal_fixtures%rowtype;
  v_round pal_rounds%rowtype;
  v_kick timestamptz;
begin
  select * into v_fix from pal_fixtures where id = p_fixture;
  if v_fix.id is null then raise exception 'fixture not found'; end if;
  select * into v_round from pal_rounds where id = v_fix.round_id;
  if not pal_is_admin(v_round.group_id) then raise exception 'not authorized'; end if;
  if v_round.status <> 'open' or v_fix.result is not null then raise exception 'round closed'; end if;
  begin
    v_kick := p_kickoff_local::timestamp at time zone 'Europe/Lisbon';
  exception when others then
    raise exception 'invalid kickoff';
  end;
  if v_kick is null or v_kick <= now() then raise exception 'kickoff in the past'; end if;
  update pal_fixtures set kickoff = v_kick where id = p_fixture;
end $$;

create or replace function pal_delete_round(p_round uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_round pal_rounds%rowtype;
begin
  select * into v_round from pal_rounds where id = p_round for update;
  if v_round.id is null then raise exception 'round not found'; end if;
  if not pal_is_admin(v_round.group_id) then raise exception 'not authorized'; end if;
  if v_round.status <> 'open' or exists (select 1 from pal_tickets where round_id = p_round) then
    raise exception 'round has tickets';
  end if;
  delete from pal_rounds where id = p_round;
end $$;

create or replace function pal_set_result(p_fixture uuid, p_result text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_fix pal_fixtures%rowtype;
  v_round pal_rounds%rowtype;
begin
  select * into v_fix from pal_fixtures where id = p_fixture;
  if v_fix.id is null then raise exception 'fixture not found'; end if;
  select * into v_round from pal_rounds where id = v_fix.round_id;
  if not pal_is_admin(v_round.group_id) then raise exception 'not authorized'; end if;
  if v_round.status <> 'open' then raise exception 'round closed'; end if;
  if p_result is not null and p_result not in ('1', 'X', '2') then raise exception 'invalid result'; end if;
  if p_result is not null and now() < v_fix.kickoff then raise exception 'not started'; end if;
  update pal_fixtures set result = p_result where id = p_fixture;
end $$;

-- ---------------------------------------------------------------- escrita: palpites

create or replace function pal_place_ticket(p_round uuid, p_picks jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_round pal_rounds%rowtype;
  v_group pal_groups%rowtype;
  v_n int;
  v_first timestamptz;
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

  -- Bloqueia a linha do jogador: dois palpites ao mesmo tempo não furam o saldo nem o limite.
  perform 1 from pal_members
  where user_id = v_uid and group_id = v_round.group_id and status = 'active' for update;
  if not found then raise exception 'not an active member'; end if;

  if v_round.status <> 'open' then raise exception 'round closed'; end if;
  select count(*), min(kickoff) into v_n, v_first from pal_fixtures where round_id = p_round;
  if v_n = 0 or now() >= v_first then raise exception 'round closed'; end if;

  select norm, cost into v_norm, v_cost from pal_normalize_picks(p_picks, v_n);

  select coalesce(sum(cost), 0) into v_used from pal_tickets where round_id = p_round and user_id = v_uid;
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

-- ---------------------------------------------------------------- apuramento

create or replace function pal_settle_round(p_round uuid)
returns table(pot numeric, prize1 numeric, prize2 numeric, caixa numeric, carry numeric, winners1 numeric, winners2 numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_round pal_rounds%rowtype;
  v_group pal_groups%rowtype;
  v_results text[];
  v_n int;
  v_pot numeric;
  v_pool1 numeric;
  v_pool2 numeric;
  v_caixa numeric;
  v_w1 numeric := 0;
  v_w2 numeric := 0;
  v_per1 numeric := 0;
  v_per2 numeric := 0;
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
  if v_round.status <> 'open' then raise exception 'already settled'; end if;
  select * into v_group from pal_groups where id = v_round.group_id;

  if exists (select 1 from pal_fixtures where round_id = p_round and result is null) then
    raise exception 'missing results';
  end if;
  select array_agg(f.result order by f.position), count(*) into v_results, v_n
  from pal_fixtures f where f.round_id = p_round;

  select coalesce(sum(tk.cost), 0) into v_pot from pal_tickets tk where tk.round_id = p_round;
  v_pool1 := round(v_pot * coalesce(v_group.p1_pct, 0) / 100, 2);
  v_pool2 := round(v_pot * coalesce(v_group.p2_pct, 0) / 100, 2);
  v_caixa := v_pot - v_pool1 - v_pool2;
  v_pool1 := v_pool1 + v_round.carry_in;

  -- Prémio 1: todos certos. Prémio 2: um errado. Cada combinação certa leva a sua parte.
  for t in select tk.id, tk.picks from pal_tickets tk where tk.round_id = p_round loop
    v_ways := pal_hit_counts(t.picks, v_results);
    v_w1 := v_w1 + v_ways[v_n + 1];
    v_w2 := v_w2 + v_ways[v_n];
  end loop;
  if v_w1 > 0 then v_per1 := trunc(v_pool1 / v_w1, 2); end if;
  if v_w2 > 0 then v_per2 := trunc(v_pool2 / v_w2, 2); end if;

  for t in select tk.id, tk.user_id, tk.group_id, tk.picks from pal_tickets tk where tk.round_id = p_round loop
    v_ways := pal_hit_counts(t.picks, v_results);
    v_best := 0;
    for h in reverse v_n..0 loop
      if v_ways[h + 1] > 0 then v_best := h; exit; end if;
    end loop;
    v_prize := v_ways[v_n + 1] * v_per1 + v_ways[v_n] * v_per2;
    update pal_tickets set best_hits = v_best, prize = v_prize, settled = true where id = t.id;
    if v_prize > 0 then
      insert into pal_ledger (group_id, user_id, delta, kind, round_id, ticket_id, created_by)
      values (t.group_id, t.user_id, v_prize, 'prize', p_round, t.id, auth.uid());
    end if;
  end loop;

  -- Sobras de arredondamento vão para a caixa; prémios sem vencedor acumulam (com teto).
  v_caixa := v_caixa
    + case when v_w1 > 0 then v_pool1 - v_per1 * v_w1 else 0 end
    + case when v_w2 > 0 then v_pool2 - v_per2 * v_w2 else 0 end;
  v_raw := case when v_w1 = 0 then v_pool1 else 0 end + case when v_w2 = 0 then v_pool2 else 0 end;
  v_carry := case when v_group.jackpot_cap is null then v_raw else least(v_raw, v_group.jackpot_cap) end;
  v_over := v_raw - v_carry;
  v_caixa := v_caixa + v_over;

  update pal_rounds
  set status = 'settled', settled_at = now(), pot = v_pot, prize1 = v_pool1, prize2 = v_pool2,
      caixa = v_caixa, carry_out = v_carry, overflow = v_over
  where id = p_round;

  return query select v_pot, v_pool1, v_pool2, v_caixa, v_carry, v_w1, v_w2;
end $$;

-- ---------------------------------------------------------------- leitura agregada

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
  v_p2 numeric;
begin
  select * into v_round from pal_rounds where id = p_round;
  if v_round.id is null or not pal_is_member(v_round.group_id) then raise exception 'not authorized'; end if;
  select count(*), coalesce(sum(tk.cost), 0) into v_tickets, v_pot from pal_tickets tk where tk.round_id = p_round;
  if v_round.status = 'settled' then
    return query select v_round.pot, v_round.prize1, v_round.prize2, v_round.caixa, v_round.carry_in,
                        v_round.carry_out, v_round.overflow, v_tickets, true;
    return;
  end if;
  select * into v_group from pal_groups where id = v_round.group_id;
  v_p1 := round(v_pot * coalesce(v_group.p1_pct, 0) / 100, 2);
  v_p2 := round(v_pot * coalesce(v_group.p2_pct, 0) / 100, 2);
  return query select v_pot, v_p1 + v_round.carry_in, v_p2, v_pot - v_p1 - v_p2, v_round.carry_in,
                      null::numeric, null::numeric, v_tickets, false;
end $$;

create or replace function pal_leaderboard(p_group uuid)
returns table(user_id uuid, display_name text, rounds_played bigint, total_hits bigint, best_hits int, total_prize numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not pal_is_member(p_group) then raise exception 'not authorized'; end if;
  return query
    with per_round as (
      select tk.user_id, tk.round_id, max(tk.best_hits)::int as bh, sum(tk.prize) as pz
      from pal_tickets tk join pal_rounds r on r.id = tk.round_id
      where r.group_id = p_group and r.status = 'settled'
      group by tk.user_id, tk.round_id
    )
    select m.user_id, m.display_name::text, count(pr.round_id), coalesce(sum(pr.bh), 0)::bigint,
           coalesce(max(pr.bh), 0)::int, coalesce(sum(pr.pz), 0)
    from pal_members m left join per_round pr on pr.user_id = m.user_id
    where m.group_id = p_group and m.status = 'active'
    group by m.user_id, m.display_name
    order by 4 desc, 6 desc, 2;
end $$;

-- ---------------------------------------------------------------- permissões das funções

revoke execute on function
  pal_has_membership(uuid), pal_is_member(uuid), pal_is_admin(uuid), pal_is_staff(uuid), pal_round_closed(uuid),
  pal_hit_counts(jsonb, text[]), pal_normalize_picks(jsonb, int),
  pal_join_group(text, text), pal_members_admin(uuid), pal_set_member_status(uuid, uuid, text),
  pal_set_treasurer(uuid, uuid, boolean), pal_grant_finos(uuid, uuid, int, text),
  pal_update_settings(uuid, numeric, numeric, numeric, int, numeric), pal_create_round(uuid, int, jsonb),
  pal_set_fixture_kickoff(uuid, text), pal_delete_round(uuid), pal_set_result(uuid, text),
  pal_place_ticket(uuid, jsonb), pal_settle_round(uuid), pal_round_summary(uuid), pal_leaderboard(uuid)
  from public, anon;

grant execute on function
  pal_has_membership(uuid), pal_is_member(uuid), pal_is_admin(uuid), pal_is_staff(uuid), pal_round_closed(uuid),
  pal_join_group(text, text), pal_members_admin(uuid), pal_set_member_status(uuid, uuid, text),
  pal_set_treasurer(uuid, uuid, boolean), pal_grant_finos(uuid, uuid, int, text),
  pal_update_settings(uuid, numeric, numeric, numeric, int, numeric), pal_create_round(uuid, int, jsonb),
  pal_set_fixture_kickoff(uuid, text), pal_delete_round(uuid), pal_set_result(uuid, text),
  pal_place_ticket(uuid, jsonb), pal_settle_round(uuid), pal_round_summary(uuid), pal_leaderboard(uuid)
  to authenticated;
-- pal_hit_counts e pal_normalize_picks são só internas: ficam sem permissão para a API.

-- ---------------------------------------------------------------- grupo

insert into pal_groups (slug, name, club_name) values ('leoes', 'Palpites dos Leões', 'Leões Valboenses');
insert into pal_admin_invites (email, group_id)
select 'vitor_17_gondomar@hotmail.com', id from pal_groups where slug = 'leoes';
