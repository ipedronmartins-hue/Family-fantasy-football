alter table teams add column if not exists sponsor_name text
  check (sponsor_name is null or char_length(sponsor_name) <= 60);

create or replace function set_team_sponsor(p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare v_team uuid;
begin
  select s.team_id into v_team
  from parents p join seasons s on s.id = p.season_id
  where p.id = auth.uid() and p.is_admin;
  if v_team is null then raise exception 'not authorized'; end if;
  update teams set sponsor_name = nullif(trim(p_name), '') where id = v_team;
end $$;
revoke execute on function set_team_sponsor(text) from public, anon;
grant execute on function set_team_sponsor(text) to authenticated;
