alter table teams add column slug text unique;
update teams set slug = 'gondomar' where id = '00000000-0000-0000-0000-000000000002';
alter table teams alter column slug set not null;

-- Replaces the old global admin_emails: an invite is now tied to a specific
-- season, so approving one team's admin can never grant admin rights on
-- another team.
create table admin_invites (
  email text not null,
  season_id uuid not null references seasons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (email, season_id)
);
alter table admin_invites enable row level security;
-- No policies: only sync_admin_flag (SECURITY DEFINER) and
-- approve_team_registration (SECURITY DEFINER) touch this table.

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

-- Migrate Rocka's existing Gondomar admin grant into the new scoped model.
insert into admin_invites (email, season_id)
values ('OWNER_EMAIL@example.com', '00000000-0000-0000-0000-000000000003');

-- Approves a pending registration: creates club + team + season + default
-- scoring rules + a scoped admin invite, all in one transaction.
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

  -- Generate a unique URL slug from the team name.
  v_slug := lower(regexp_replace(unaccent(v_request.team_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  while exists (select 1 from teams where slug = v_slug || case when v_suffix = 0 then '' else '-' || v_suffix end) loop
    v_suffix := v_suffix + 1;
  end loop;
  if v_suffix > 0 then
    v_slug := v_slug || '-' || v_suffix;
  end if;

  insert into clubs (name) values (v_request.club_name) returning id into v_club_id;
  insert into teams (club_id, name, slug, admin_contact_email)
  values (v_club_id, v_request.team_name, v_slug, v_request.contact_email)
  returning id into v_team_id;
  insert into seasons (team_id, label) values (v_team_id, '2026/27') returning id into v_season_id;

  insert into scoring_rules (season_id, rules) values (
    v_season_id,
    '{"startingXIGuess":3,"scorerGuess":5,"exactGoalsGuess":4,"exactResultGuess":8,"assistGuess":4,"manOfTheMatchGuess":6,"correctOutcomeGuess":3,"bonus":{"captain":2}}'::jsonb
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

drop table admin_emails;
drop function if exists sync_admin_flag() cascade;
