-- Editar um jogo (adversário, competição, data/hora, casa/fora).
-- Casa/fora só muda enquanto não houver resultado, golos, previsões ou onzes (senão inverteria o sentido dos golos).
create or replace function update_match_details(
  p_match_id uuid, p_opponent text, p_competition text, p_kickoff timestamptz, p_home boolean
) returns void language plpgsql security definer set search_path = public as $$
declare v_m matches%rowtype; v_has_data boolean;
begin
  select * into v_m from matches where id = p_match_id;
  if not found then raise exception 'match not found'; end if;
  if not is_admin_of_season(v_m.season_id) then raise exception 'not authorized'; end if;
  if length(trim(coalesce(p_opponent, ''))) = 0 then raise exception 'opponent required'; end if;
  if length(trim(coalesce(p_competition, ''))) = 0 then raise exception 'competition required'; end if;

  if p_home <> v_m.home then
    select v_m.home_goals is not null or v_m.away_goals is not null
        or exists (select 1 from predictions where match_id = p_match_id)
        or exists (select 1 from fantasy_lineups where match_id = p_match_id)
        or exists (select 1 from match_goals where match_id = p_match_id)
    into v_has_data;
    if v_has_data then raise exception 'home flag locked'; end if;
  end if;

  update matches
  set opponent = trim(p_opponent), competition = trim(p_competition), kickoff_at = p_kickoff, home = p_home
  where id = p_match_id;

  -- se mudou a data, volta a numerar por ordem (recusa sozinho se já houver dados)
  begin perform renumber_matchdays(); exception when others then null; end;
end;
$$;

-- Apagar um jogo: só se ainda não tiver absolutamente nada associado.
create or replace function delete_match(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_m matches%rowtype;
begin
  select * into v_m from matches where id = p_match_id;
  if not found then raise exception 'match not found'; end if;
  if not is_admin_of_season(v_m.season_id) then raise exception 'not authorized'; end if;

  if v_m.home_goals is not null or v_m.away_goals is not null or v_m.status <> 'scheduled'
     or exists (select 1 from predictions where match_id = p_match_id)
     or exists (select 1 from fantasy_lineups where match_id = p_match_id)
     or exists (select 1 from match_lineups where match_id = p_match_id)
     or exists (select 1 from match_goals where match_id = p_match_id)
     or exists (select 1 from match_cards where match_id = p_match_id)
     or exists (select 1 from match_penalty_events where match_id = p_match_id)
     or exists (select 1 from match_bonus_points where match_id = p_match_id)
     or exists (select 1 from motm_votes where match_id = p_match_id)
  then
    raise exception 'match has data';
  end if;

  delete from matches where id = p_match_id;
  begin perform renumber_matchdays(); exception when others then null; end;
end;
$$;

revoke execute on function update_match_details(uuid, text, text, timestamptz, boolean), delete_match(uuid) from public, anon;
grant execute on function update_match_details(uuid, text, text, timestamptz, boolean), delete_match(uuid) to authenticated;
