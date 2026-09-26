create or replace function approve_team_registration(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request team_registration_requests%rowtype;
  v_club_id uuid;
  v_team_id uuid;
  v_season_id uuid;
  v_slug text;
  v_suffix int := 0;
begin
  if not exists (select 1 from parents where id = auth.uid() and is_platform_owner) then
    raise exception 'not authorized';
  end if;

  select * into v_request from team_registration_requests where id = p_request_id and status = 'pending';
  if v_request.id is null then
    raise exception 'request not found or already handled';
  end if;

  v_slug := lower(v_request.club_name || ' ' || v_request.team_name);
  v_slug := translate(v_slug, 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN');
  v_slug := lower(regexp_replace(v_slug, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);

  while exists (select 1 from teams where slug = v_slug || case when v_suffix = 0 then '' else '-' || v_suffix end) loop
    v_suffix := v_suffix + 1;
  end loop;
  if v_suffix > 0 then
    v_slug := v_slug || '-' || v_suffix;
  end if;

  insert into clubs (name) values (v_request.club_name) returning id into v_club_id;
  insert into teams (club_id, name, slug, admin_contact_email, format)
  values (v_club_id, v_request.team_name, v_slug, v_request.contact_email, v_request.format)
  returning id into v_team_id;
  insert into seasons (team_id, label) values (v_team_id, '2026/27') returning id into v_season_id;

  insert into scoring_rules (season_id, rules) values (
    v_season_id,
    '{"startingXIGuess":3,"scorerGuess":5,"exactGoalsGuess":4,"exactResultGuess":8,"assistGuess":4,"manOfTheMatchGuess":6,"correctOutcomeGuess":3,"bonus":{"captain":2},"ownership":{"goalsByPosition":{"GR":10,"DEF":6,"MED":5,"EXT":5,"AV":4},"assist":3,"cleanSheetGoalkeeperDefender":4,"cleanSheetMidfielder":1,"playedUpTo60":1,"played60Plus":2,"ownGoal":-2,"yellowCard":-1,"redCard":-3,"penaltyMiss":-2,"penaltySave":5,"goalsConcededPer2":-1}}'::jsonb
  );

  insert into admin_invites (email, season_id) values (v_request.contact_email, v_season_id);

  update team_registration_requests
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where id = p_request_id;

  return v_slug;
end;
$$;

revoke execute on function approve_team_registration(uuid) from public, anon;
grant execute on function approve_team_registration(uuid) to authenticated;
