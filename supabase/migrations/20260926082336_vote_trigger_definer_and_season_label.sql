create or replace function trg_recompute_motm()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform recompute_motm(coalesce(new.match_id, old.match_id));
  return coalesce(new, old);
end $$;

create or replace function current_season_label()
returns text language sql stable as $$
  select case
    when extract(month from now()) >= 7
      then extract(year from now())::int || '/' || lpad(((extract(year from now())::int + 1) % 100)::text, 2, '0')
    else (extract(year from now())::int - 1) || '/' || lpad((extract(year from now())::int % 100)::text, 2, '0')
  end;
$$;

do $$
declare d text;
begin
  select pg_get_functiondef('public.approve_team_registration(uuid)'::regprocedure) into d;
  d := replace(d, 'values (v_team_id, ''2026/27'')', 'values (v_team_id, current_season_label())');
  if position('current_season_label()' in d) = 0 then
    raise exception 'season label not replaced -- aborting';
  end if;
  execute d;
end $$;
