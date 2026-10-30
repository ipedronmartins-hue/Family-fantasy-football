-- Pais podem alterar o próprio nome e o nome da equipa; nomes de pais únicos por época
create or replace function public.parent_name_taken(p_season uuid, p_name text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from parents
    where season_id = p_season and id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
      and lower(trim(display_name)) = lower(trim(p_name))
  );
$$;

create or replace function public.update_my_profile(p_display_name text, p_team_name text)
returns void language plpgsql security definer set search_path = public as $$
declare v_season uuid;
begin
  if auth.uid() is null then raise exception 'Sessão expirada'; end if;
  if length(trim(p_display_name)) < 3 then raise exception 'O nome é demasiado curto'; end if;
  if length(trim(p_team_name)) < 2 then raise exception 'O nome da equipa é demasiado curto'; end if;
  select season_id into v_season from parents where id = auth.uid();
  if v_season is null then raise exception 'Perfil não encontrado'; end if;
  if parent_name_taken(v_season, p_display_name) then
    raise exception 'Já existe um pai com esse nome. Acrescenta o apelido ou o nome do teu filho (ex: Ana - mãe do Vasco).';
  end if;
  update parents set display_name = trim(p_display_name) where id = auth.uid();
  update fantasy_teams set name = trim(p_team_name) where parent_id = auth.uid();
end $$;

grant execute on function public.parent_name_taken(uuid, text) to authenticated;
grant execute on function public.update_my_profile(text, text) to authenticated;
