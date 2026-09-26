create or replace function sync_admin_flag() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from admin_invites ai
    join auth.users u on u.email = ai.email
    where u.id = new.id and ai.season_id = new.season_id
  ) then
    new.is_admin := true;
  end if;
  return new;
end;
$$;

create trigger set_admin_on_insert
before insert on parents
for each row execute function sync_admin_flag();

revoke execute on function sync_admin_flag() from public, anon, authenticated;
