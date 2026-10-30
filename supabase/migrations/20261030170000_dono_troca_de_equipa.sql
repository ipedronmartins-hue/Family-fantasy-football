-- Dono da plataforma pode ser admin de várias equipas: a conta "segue" a equipa que está a abrir.
create or replace function public.switch_owner_team(p_slug text)
returns void language plpgsql security definer set search_path = public as $$
declare v_parent parents%rowtype; v_season uuid; v_format text;
begin
  select * into v_parent from parents where id = auth.uid();
  if v_parent.id is null or not v_parent.is_platform_owner then return; end if;

  select s.id, t.format into v_season, v_format
  from teams t join seasons s on s.team_id = t.id
  where t.slug = p_slug order by s.created_at desc limit 1;
  if v_season is null or v_season = v_parent.season_id then return; end if;

  update parents set season_id = v_season, is_admin = true, status = 'active' where id = auth.uid();

  if not exists (select 1 from fantasy_teams where parent_id = auth.uid() and season_id = v_season) then
    insert into fantasy_teams (parent_id, season_id, name, formation)
    values (auth.uid(), v_season, v_parent.display_name,
      case v_format when 'fut5' then '2-2' when 'fut7' then '3-2-1' when 'fut9' then '3-3-2' else '4-3-3' end);
  end if;
end $$;
grant execute on function public.switch_owner_team(text) to authenticated;
