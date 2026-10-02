-- Banco de suplentes (opcional): ordem de prioridade; nunca capitão/vice.
alter table fantasy_lineups add column if not exists is_bench boolean not null default false;
alter table fantasy_lineups add column if not exists bench_order smallint;
alter table fantasy_lineups add constraint fantasy_lineups_bench_consistent
  check ((is_bench and bench_order is not null) or (not is_bench and bench_order is null));
alter table fantasy_lineups add constraint fantasy_lineups_bench_no_captain
  check (not is_bench or (not is_captain and not is_vice_captain));
create unique index if not exists fantasy_lineups_bench_order_uniq
  on fantasy_lineups (fantasy_team_id, match_id, bench_order) where is_bench;

-- Motor de pontos do onze: se um titular fez 0 minutos, entra o primeiro suplente (por ordem)
-- que tenha jogado. Cada suplente que jogou substitui um titular que não jogou.
create or replace function recalculate_ownership_points(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_match matches%rowtype;
  v_rules jsonb;
  v_ownership jsonb;
  v_conceded int;
  v_team record;
  v_player_id uuid;
  v_is_bench boolean;
  v_pos text;
  v_minutes int;
  v_goals int;
  v_assists int;
  v_own_goals int;
  v_yellow int;
  v_red int;
  v_pen_miss int;
  v_pen_save int;
  v_bonus int;
  v_player_points int;
  v_team_points int;
  v_breakdown jsonb;
  v_players_breakdown jsonb;
  v_captain_id uuid;
  v_vice_id uuid;
  v_captain_minutes int;
  v_vice_minutes int;
  v_effective_captain uuid;
begin
  select * into v_match from matches where id = p_match_id;
  if v_match.id is null then
    raise exception 'match not found';
  end if;

  if not exists (
    select 1 from parents where id = auth.uid() and is_admin and season_id = v_match.season_id
  ) then
    raise exception 'not authorized';
  end if;

  if v_match.home_goals is null or v_match.away_goals is null then
    raise exception 'match result not entered yet';
  end if;

  select rules into v_rules from scoring_rules where season_id = v_match.season_id;
  v_ownership := v_rules->'ownership';
  v_conceded := case when v_match.home then v_match.away_goals else v_match.home_goals end;

  for v_team in select distinct fantasy_team_id from fantasy_lineups where match_id = p_match_id loop
    v_team_points := 0;
    v_players_breakdown := '[]'::jsonb;

    select player_id into v_captain_id from fantasy_lineups
      where fantasy_team_id = v_team.fantasy_team_id and match_id = p_match_id and is_captain;
    select player_id into v_vice_id from fantasy_lineups
      where fantasy_team_id = v_team.fantasy_team_id and match_id = p_match_id and is_vice_captain;

    select coalesce(minutes_played, 0) into v_captain_minutes from match_lineups
      where match_id = p_match_id and player_id = v_captain_id;
    select coalesce(minutes_played, 0) into v_vice_minutes from match_lineups
      where match_id = p_match_id and player_id = v_vice_id;

    v_effective_captain := case
      when v_captain_id is not null and coalesce(v_captain_minutes, 0) > 0 then v_captain_id
      when v_vice_id is not null and coalesce(v_vice_minutes, 0) > 0 then v_vice_id
      else null
    end;

    for v_player_id, v_pos in
      with starters as (
        select fl.player_id, p.position_group,
          coalesce((select ml.minutes_played from match_lineups ml
                    where ml.match_id = p_match_id and ml.player_id = fl.player_id), 0) as mins
        from fantasy_lineups fl join players p on p.id = fl.player_id
        where fl.fantasy_team_id = v_team.fantasy_team_id and fl.match_id = p_match_id and not fl.is_bench
      ),
      empty_starters as (
        select player_id, row_number() over (order by player_id) as rn from starters where mins = 0
      ),
      bench_played as (
        select fl.player_id, p.position_group, row_number() over (order by fl.bench_order) as rn
        from fantasy_lineups fl join players p on p.id = fl.player_id
        where fl.fantasy_team_id = v_team.fantasy_team_id and fl.match_id = p_match_id and fl.is_bench
          and coalesce((select ml.minutes_played from match_lineups ml
                        where ml.match_id = p_match_id and ml.player_id = fl.player_id), 0) > 0
      )
      select s.player_id, s.position_group from starters s
      union all
      select b.player_id, b.position_group from bench_played b join empty_starters e on e.rn = b.rn
    loop
      select coalesce(minutes_played, 0) into v_minutes from match_lineups
        where match_id = p_match_id and player_id = v_player_id;
      v_minutes := coalesce(v_minutes, 0);

      select coalesce(is_bench, false) into v_is_bench from fantasy_lineups
        where fantasy_team_id = v_team.fantasy_team_id and match_id = p_match_id and player_id = v_player_id;

      select count(*) into v_goals from match_goals
        where match_id = p_match_id and scorer_id = v_player_id and not is_own_goal;
      select count(*) into v_assists from match_goals
        where match_id = p_match_id and assist_id = v_player_id;
      select count(*) into v_own_goals from match_goals
        where match_id = p_match_id and scorer_id = v_player_id and is_own_goal;
      select count(*) into v_yellow from match_cards
        where match_id = p_match_id and player_id = v_player_id and card_type = 'yellow';
      select count(*) into v_red from match_cards
        where match_id = p_match_id and player_id = v_player_id and card_type = 'red';
      select count(*) into v_pen_miss from match_penalty_events
        where match_id = p_match_id and player_id = v_player_id and event_type = 'miss';
      select count(*) into v_pen_save from match_penalty_events
        where match_id = p_match_id and player_id = v_player_id and event_type = 'save';
      select coalesce(sum(points), 0) into v_bonus from match_bonus_points
        where match_id = p_match_id and player_id = v_player_id;

      v_player_points := 0;

      if v_minutes >= 60 then
        v_player_points := v_player_points + (v_ownership->>'played60Plus')::int;
      elsif v_minutes > 0 then
        v_player_points := v_player_points + (v_ownership->>'playedUpTo60')::int;
      end if;

      v_player_points := v_player_points + v_goals * (v_ownership->'goalsByPosition'->>v_pos)::int;
      v_player_points := v_player_points + v_assists * (v_ownership->>'assist')::int;
      v_player_points := v_player_points + v_own_goals * (v_ownership->>'ownGoal')::int;
      v_player_points := v_player_points + v_yellow * (v_ownership->>'yellowCard')::int;
      v_player_points := v_player_points + v_red * (v_ownership->>'redCard')::int;
      v_player_points := v_player_points + v_pen_miss * (v_ownership->>'penaltyMiss')::int;
      v_player_points := v_player_points + v_pen_save * (v_ownership->>'penaltySave')::int;
      v_player_points := v_player_points + v_bonus;

      if v_minutes >= 60 and v_conceded = 0 then
        if v_pos in ('GR', 'DEF') then
          v_player_points := v_player_points + (v_ownership->>'cleanSheetGoalkeeperDefender')::int;
        elsif v_pos in ('MED', 'EXT') then
          v_player_points := v_player_points + (v_ownership->>'cleanSheetMidfielder')::int;
        end if;
      end if;

      if v_pos in ('GR', 'DEF') and v_minutes > 0 and v_conceded >= 2 then
        v_player_points := v_player_points + floor(v_conceded / 2) * (v_ownership->>'goalsConcededPer2')::int;
      end if;

      if v_player_id = v_effective_captain then
        v_player_points := v_player_points * 2;
      end if;

      v_team_points := v_team_points + v_player_points;
      v_players_breakdown := v_players_breakdown || jsonb_build_object(
        'playerId', v_player_id,
        'points', v_player_points,
        'isCaptain', v_player_id = v_captain_id,
        'isViceCaptain', v_player_id = v_vice_id,
        'doubled', v_player_id = v_effective_captain,
        'minutes', v_minutes,
        'substitute', v_is_bench
      );
    end loop;

    v_breakdown := jsonb_build_object('players', v_players_breakdown);

    insert into fantasy_lineup_points (fantasy_team_id, match_id, points, breakdown, calculated_at)
    values (v_team.fantasy_team_id, p_match_id, v_team_points, v_breakdown, now())
    on conflict (fantasy_team_id, match_id) do update
      set points = excluded.points, breakdown = excluded.breakdown, calculated_at = now();
  end loop;
end;
$$;
