-- 1. GUARD: parents can never grant themselves privileges or approve themselves.
-- Runs as the caller (invoker), so API calls show current_user = authenticated/anon;
-- trusted SECURITY DEFINER functions run as the owner and pass through.
create or replace function guard_parent_privileges()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.is_admin := false;
      new.is_platform_owner := false;
      new.status := 'pending';
    else
      new.is_admin := old.is_admin;
      new.is_platform_owner := old.is_platform_owner;
      new.status := old.status;
      new.season_id := old.season_id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists a_guard_parent_privileges on parents;
create trigger a_guard_parent_privileges
before insert or update on parents
for each row execute function guard_parent_privileges();

-- 2. ADMIN INVITES need a secret code (email alone can be hijacked now that
-- email confirmation is off).
alter table admin_invites add column if not exists code text not null
  default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
alter table admin_invites add column if not exists used_at timestamptz;
update admin_invites ai set used_at = now()
where exists (select 1 from auth.users u join parents p on p.id = u.id
              where lower(u.email) = lower(ai.email) and p.is_admin and p.season_id = ai.season_id);

-- Signing up with the invited email no longer grants admin by itself.
create or replace function sync_admin_flag()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  return new;
end $$;

create or replace function claim_team_admin(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_parent parents%rowtype;
begin
  select * into v_parent from parents where id = auth.uid();
  if v_parent.id is null then raise exception 'no profile'; end if;

  update admin_invites set used_at = now()
  where season_id = v_parent.season_id
    and upper(code) = upper(trim(p_code))
    and used_at is null;
  if not found then return false; end if;

  update parents set is_admin = true, status = 'active' where id = auth.uid();
  return true;
end $$;
revoke execute on function claim_team_admin(text) from public, anon;
grant execute on function claim_team_admin(text) to authenticated;

create or replace function list_admin_invites()
returns table(season_id uuid, email text, code text, used boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from parents where id = auth.uid() and is_platform_owner) then
    raise exception 'not authorized';
  end if;
  return query select ai.season_id, ai.email::text, ai.code, ai.used_at is not null from admin_invites ai;
end $$;
revoke execute on function list_admin_invites() from public, anon;
grant execute on function list_admin_invites() to authenticated;

-- 3. MVP-dependent prediction points recompute themselves whenever votes change.
do $$
declare d text;
begin
  select pg_get_functiondef('public.recalculate_match_points(uuid)'::regprocedure) into d;
  d := replace(d, 'public.recalculate_match_points(', 'public.recalculate_match_points_core(');
  d := replace(d, E'  if not exists (\n    select 1 from parents where id = auth.uid() and is_admin and season_id = v_match.season_id\n  ) then\n    raise exception ''not authorized'';\n  end if;\n', '');
  if position('not authorized' in d) > 0 then
    raise exception 'auth block not removed -- aborting';
  end if;
  execute d;
end $$;
revoke execute on function recalculate_match_points_core(uuid) from public, anon, authenticated;

create or replace function recompute_motm(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_winner uuid; v_match matches%rowtype;
begin
  select player_id into v_winner
  from (
    select player_id, count(*) as votes, min(created_at) as first_reached
    from motm_votes where match_id = p_match_id group by player_id
  ) tally
  order by votes desc, first_reached asc
  limit 1;

  update matches set man_of_the_match_id = v_winner where id = p_match_id
  returning * into v_match;

  if v_match.home_goals is not null and v_match.away_goals is not null
     and exists (select 1 from predictions where match_id = p_match_id)
     and exists (select 1 from fantasy_points fp join predictions p on p.id = fp.prediction_id where p.match_id = p_match_id) then
    perform recalculate_match_points_core(p_match_id);
  end if;
end $$;
revoke execute on function recompute_motm(uuid) from public, anon, authenticated;

-- 4. Rankings only count approved (active) parents.
create or replace view season_leaderboard as
select ft.season_id, ft.id as fantasy_team_id, ft.name as team_name,
  (coalesce(pred.total, 0) + coalesce(own.total, 0))::int as total_points
from fantasy_teams ft
join parents par on par.id = ft.parent_id and par.status = 'active'
left join (
  select p.fantasy_team_id, sum(fp.points) as total
  from predictions p join fantasy_points fp on fp.prediction_id = p.id group by p.fantasy_team_id
) pred on pred.fantasy_team_id = ft.id
left join (
  select fantasy_team_id, sum(points) as total from fantasy_lineup_points group by fantasy_team_id
) own on own.fantasy_team_id = ft.id;

create or replace view monthly_leaderboard as
select m.season_id, date_trunc('month', m.kickoff_at)::date as month,
  ft.id as fantasy_team_id, ft.name as team_name,
  (coalesce(sum(fp.points), 0) + coalesce(sum(flp.points), 0))::int as points
from matches m
join fantasy_teams ft on ft.season_id = m.season_id
join parents par on par.id = ft.parent_id and par.status = 'active'
left join predictions p on p.match_id = m.id and p.fantasy_team_id = ft.id
left join fantasy_points fp on fp.prediction_id = p.id
left join fantasy_lineup_points flp on flp.match_id = m.id and flp.fantasy_team_id = ft.id
group by m.season_id, date_trunc('month', m.kickoff_at), ft.id, ft.name;

create or replace view matchday_leaderboard as
select m.season_id, m.id as match_id, m.matchday, ft.id as fantasy_team_id, ft.name as team_name,
  (coalesce(fp.points, 0) + coalesce(flp.points, 0))::int as points
from matches m
join fantasy_teams ft on ft.season_id = m.season_id
join parents par on par.id = ft.parent_id and par.status = 'active'
left join predictions p on p.match_id = m.id and p.fantasy_team_id = ft.id
left join fantasy_points fp on fp.prediction_id = p.id
left join fantasy_lineup_points flp on flp.match_id = m.id and flp.fantasy_team_id = ft.id;

-- 5. Admin sees parents' emails; admin can reset a parent's password.
create or replace function get_team_parents()
returns table(id uuid, display_name text, status text, email text, team_name text)
language sql security definer stable set search_path = public as $$
  select p.id, p.display_name::text, p.status, u.email::text,
    (select ft.name::text from fantasy_teams ft where ft.parent_id = p.id limit 1)
  from parents p join auth.users u on u.id = p.id
  where p.season_id in (select season_id from parents where id = auth.uid() and is_admin)
  order by p.display_name;
$$;
revoke execute on function get_team_parents() from public, anon;
grant execute on function get_team_parents() to authenticated;

create or replace function admin_reset_parent_password(p_parent_id uuid, p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_caller_owner boolean;
begin
  if length(coalesce(p_password, '')) < 6 then raise exception 'password too short'; end if;
  select coalesce(is_platform_owner, false) into v_caller_owner from parents where id = auth.uid();
  if not coalesce(v_caller_owner, false) then
    if not exists (
      select 1 from parents a join parents t on t.season_id = a.season_id
      where a.id = auth.uid() and a.is_admin and t.id = p_parent_id
        and not t.is_admin and not t.is_platform_owner
    ) then
      raise exception 'not authorized';
    end if;
  end if;
  update auth.users
  set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
  where id = p_parent_id;
end $$;
revoke execute on function admin_reset_parent_password(uuid, text) from public, anon;
grant execute on function admin_reset_parent_password(uuid, text) to authenticated;

-- 6. Lint cleanup: helper only used inside policies.
revoke execute on function is_admin_of_season(uuid) from anon;
