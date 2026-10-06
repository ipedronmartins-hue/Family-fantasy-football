-- 1. Ninguém pode suspender (ou pôr pendente) a própria conta: o admin ficava trancado de fora.
create or replace function set_parent_status(p_parent_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_target_season uuid;
begin
  if p_status not in ('pending', 'active', 'suspended') then
    raise exception 'invalid status';
  end if;

  select season_id into v_target_season from parents where id = p_parent_id;
  if v_target_season is null then
    raise exception 'parent not found';
  end if;

  if not exists (
    select 1 from parents where id = auth.uid() and is_admin and season_id = v_target_season
  ) then
    raise exception 'not authorized';
  end if;

  if p_parent_id = auth.uid() and p_status <> 'active' then
    raise exception 'cannot change own status';
  end if;

  update parents set status = p_status where id = p_parent_id;
end;
$$;

-- 2. Numera as jornadas pela ordem das datas (as importações em várias vezes baralhavam tudo).
-- Recusa se algum jogo cujo número mudaria já tiver previsões, onzes, minutos, golos ou votos.
create or replace function renumber_matchdays()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_season uuid;
  v_blocked int;
begin
  select season_id into v_season from parents where id = auth.uid() and is_admin;
  if v_season is null then raise exception 'not authorized'; end if;

  with r as (
    select id, matchday as old_md, row_number() over (order by kickoff_at, id)::int as new_md
    from matches where season_id = v_season
  )
  select count(*) into v_blocked from r
  where r.old_md <> r.new_md and (
    exists (select 1 from predictions p where p.match_id = r.id)
    or exists (select 1 from fantasy_lineups fl where fl.match_id = r.id)
    or exists (select 1 from match_lineups ml where ml.match_id = r.id)
    or exists (select 1 from match_goals g where g.match_id = r.id)
    or exists (select 1 from motm_votes v where v.match_id = r.id)
  );
  if v_blocked > 0 then raise exception 'has data'; end if;

  -- duas fases para não chocar com a regra (season_id, matchday) única
  update matches set matchday = matchday + 1000
  where season_id = v_season and id in (
    select id from (
      select id, matchday as old_md, row_number() over (order by kickoff_at, id)::int as new_md
      from matches where season_id = v_season
    ) x where old_md <> new_md
  );
  update matches m set matchday = x.new_md
  from (
    select id, row_number() over (order by kickoff_at, id)::int as new_md
    from matches where season_id = v_season
  ) x
  where m.id = x.id and m.season_id = v_season and m.matchday >= 1000;
end;
$$;
revoke execute on function renumber_matchdays() from public, anon;
grant execute on function renumber_matchdays() to authenticated;
