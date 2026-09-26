-- Priority 6 groundwork: admin flag on parents, auto-set from an allowlist
alter table parents add column is_admin boolean not null default false;

create table admin_emails (
  email text primary key
);

create or replace function sync_admin_flag() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from admin_emails ae
    join auth.users u on u.email = ae.email
    where u.id = new.id
  ) then
    new.is_admin := true;
  end if;
  return new;
end;
$$;

create trigger set_admin_on_insert
before insert on parents
for each row execute function sync_admin_flag();

-- Priority 3: persistent starting XI + captain, separate from per-match predictions
create table fantasy_lineups (
  id uuid primary key default gen_random_uuid(),
  fantasy_team_id uuid not null references fantasy_teams(id) on delete cascade,
  player_id uuid not null references players(id),
  is_captain boolean not null default false,
  created_at timestamptz not null default now(),
  unique (fantasy_team_id, player_id)
);

create unique index one_captain_per_team on fantasy_lineups(fantasy_team_id) where is_captain;

alter table fantasy_lineups enable row level security;

create policy "owner selects fantasy_lineup" on fantasy_lineups for select using (
  exists (select 1 from fantasy_teams ft where ft.id = fantasy_lineups.fantasy_team_id and ft.parent_id = auth.uid())
);
create policy "owner inserts fantasy_lineup" on fantasy_lineups for insert with check (
  exists (select 1 from fantasy_teams ft where ft.id = fantasy_lineups.fantasy_team_id and ft.parent_id = auth.uid())
);
create policy "owner updates fantasy_lineup" on fantasy_lineups for update using (
  exists (select 1 from fantasy_teams ft where ft.id = fantasy_lineups.fantasy_team_id and ft.parent_id = auth.uid())
);
create policy "owner deletes fantasy_lineup" on fantasy_lineups for delete using (
  exists (select 1 from fantasy_teams ft where ft.id = fantasy_lineups.fantasy_team_id and ft.parent_id = auth.uid())
);

-- Priority 6/7: admin write access on match data + scoring config
create policy "admin updates matches" on matches for update using (
  exists (select 1 from parents where id = auth.uid() and is_admin)
);
create policy "admin inserts match_goals" on match_goals for insert with check (
  exists (select 1 from parents where id = auth.uid() and is_admin)
);
create policy "admin deletes match_goals" on match_goals for delete using (
  exists (select 1 from parents where id = auth.uid() and is_admin)
);
create policy "admin inserts match_lineups" on match_lineups for insert with check (
  exists (select 1 from parents where id = auth.uid() and is_admin)
);
create policy "admin updates scoring_rules" on scoring_rules for update using (
  exists (select 1 from parents where id = auth.uid() and is_admin)
);
create policy "admin writes team_fund_entries" on team_fund_entries for insert with check (
  exists (select 1 from parents where id = auth.uid() and is_admin)
);
