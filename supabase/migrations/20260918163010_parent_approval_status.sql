alter table parents add column status text not null default 'pending'
  check (status in ('pending', 'active', 'suspended'));

-- Admins and the platform owner never need approval -- they ARE the approver.
create or replace function sync_admin_flag()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if exists (
    select 1 from admin_invites ai
    join auth.users u on u.email = ai.email
    where u.id = new.id and ai.season_id = new.season_id
  ) then
    new.is_admin := true;
    new.status := 'active';
  end if;
  return new;
end;
$function$;

create or replace function sync_platform_owner_flag()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if exists (
    select 1 from platform_owners po
    join auth.users u on u.email = po.email
    where u.id = new.id
  ) then
    new.is_platform_owner := true;
    new.status := 'active';
  end if;
  return new;
end;
$function$;

-- Backfill: everyone already on the platform today keeps working normally.
update parents set status = 'active' where status = 'pending';

-- Admin approve/suspend/reactivate a parent -- scoped to their own team.
create or replace function set_parent_status(p_parent_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
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

  update parents set status = p_status where id = p_parent_id;
end;
$$;

revoke execute on function set_parent_status(uuid, text) from public, anon;
grant execute on function set_parent_status(uuid, text) to authenticated;
