create or replace function recalculate_match_points(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match matches%rowtype;
  v_rules jsonb;
  v_pred predictions%rowtype;
  v_points int;
  v_breakdown jsonb;
  v_is_captain boolean;
  v_scorer_hit boolean;
  v_assist_hit boolean;
  v_mvp_hit boolean;
  v_result_hit boolean;
begin
  if not exists (select 1 from parents where id = auth.uid() and is_admin) then
    raise exception 'not authorized';
  end if;

  select * into v_match from matches where id = p_match_id;
  if v_match.home_goals is null or v_match.away_goals is null then
    raise exception 'match result not entered yet';
  end if;

  select rules into v_rules from scoring_rules where season_id = v_match.season_id;

  for v_pred in select * from predictions where match_id = p_match_id loop
    v_points := 0;
    v_breakdown := '{}'::jsonb;

    v_result_hit := v_pred.predicted_home_goals = v_match.home_goals
                and v_pred.predicted_away_goals = v_match.away_goals;
    if v_result_hit then
      v_points := v_points + (v_rules->>'exactResultGuess')::int;
      v_breakdown := v_breakdown || jsonb_build_object('exactResult', (v_rules->>'exactResultGuess')::int);
    end if;

    v_scorer_hit := v_pred.predicted_scorer_id is not null and exists (
      select 1 from match_goals where match_id = p_match_id and scorer_id = v_pred.predicted_scorer_id
    );
    if v_scorer_hit then
      v_points := v_points + (v_rules->>'scorerGuess')::int;
      v_breakdown := v_breakdown || jsonb_build_object('scorer', (v_rules->>'scorerGuess')::int);
    end if;

    v_assist_hit := v_pred.predicted_assist_id is not null and exists (
      select 1 from match_goals where match_id = p_match_id and assist_id = v_pred.predicted_assist_id
    );
    if v_assist_hit then
      v_points := v_points + (v_rules->>'assistGuess')::int;
      v_breakdown := v_breakdown || jsonb_build_object('assist', (v_rules->>'assistGuess')::int);
    end if;

    v_mvp_hit := v_pred.predicted_mvp_id is not null and v_pred.predicted_mvp_id = v_match.man_of_the_match_id;
    if v_mvp_hit then
      v_points := v_points + (v_rules->>'manOfTheMatchGuess')::int;
      v_breakdown := v_breakdown || jsonb_build_object('manOfTheMatch', (v_rules->>'manOfTheMatchGuess')::int);
    end if;

    -- Captain bonus: if the predicted MVP is also this parent's captain, add the captain bonus
    select exists (
      select 1 from fantasy_lineups fl
      where fl.fantasy_team_id = v_pred.fantasy_team_id
        and fl.player_id = v_pred.predicted_mvp_id
        and fl.is_captain
    ) into v_is_captain;
    if v_mvp_hit and v_is_captain then
      v_points := v_points + (v_rules->'bonus'->>'captain')::int;
      v_breakdown := v_breakdown || jsonb_build_object('captainBonus', (v_rules->'bonus'->>'captain')::int);
    end if;

    insert into fantasy_points (prediction_id, points, breakdown, calculated_at)
    values (v_pred.id, v_points, v_breakdown, now())
    on conflict (prediction_id) do update
      set points = excluded.points, breakdown = excluded.breakdown, calculated_at = now();
  end loop;
end;
$$;
