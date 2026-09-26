alter table clubs enable row level security;
alter table teams enable row level security;
alter table seasons enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table match_goals enable row level security;
alter table match_lineups enable row level security;
alter table parents enable row level security;
alter table fantasy_teams enable row level security;
alter table predictions enable row level security;
alter table predicted_lineups enable row level security;
alter table fantasy_points enable row level security;
alter table scoring_rules enable row level security;
alter table team_fund_entries enable row level security;

-- Public read-only reference data: everyone (even before login) can see the
-- club, squad, calendar and results -- this is a matchday sheet, not a secret.
create policy "public read clubs" on clubs for select using (true);
create policy "public read teams" on teams for select using (true);
create policy "public read seasons" on seasons for select using (true);
create policy "public read players" on players for select using (true);
create policy "public read matches" on matches for select using (true);
create policy "public read match_goals" on match_goals for select using (true);
create policy "public read match_lineups" on match_lineups for select using (true);
create policy "public read scoring_rules" on scoring_rules for select using (true);
create policy "public read team_fund_entries" on team_fund_entries for select using (true);

-- Parents: a signed-in user manages only their own profile row
create policy "parent selects self" on parents for select using (auth.uid() = id);
create policy "parent inserts self" on parents for insert with check (auth.uid() = id);
create policy "parent updates self" on parents for update using (auth.uid() = id);

-- Fantasy teams: owned by the parent who created them
create policy "owner selects fantasy_team" on fantasy_teams for select using (auth.uid() = parent_id);
create policy "owner inserts fantasy_team" on fantasy_teams for insert with check (auth.uid() = parent_id);
create policy "owner updates fantasy_team" on fantasy_teams for update using (auth.uid() = parent_id);

-- Predictions: owned via the parent's fantasy team, and only while the match
-- is still open (locked_at is null or in the future)
create policy "owner selects prediction" on predictions for select using (
  exists (
    select 1 from fantasy_teams ft
    where ft.id = predictions.fantasy_team_id and ft.parent_id = auth.uid()
  )
);
create policy "owner inserts prediction before lock" on predictions for insert with check (
  exists (
    select 1 from fantasy_teams ft
    join matches m on m.id = predictions.match_id
    where ft.id = predictions.fantasy_team_id
      and ft.parent_id = auth.uid()
      and (m.locked_at is null or m.locked_at > now())
  )
);
create policy "owner updates prediction before lock" on predictions for update using (
  exists (
    select 1 from fantasy_teams ft
    join matches m on m.id = predictions.match_id
    where ft.id = predictions.fantasy_team_id
      and ft.parent_id = auth.uid()
      and (m.locked_at is null or m.locked_at > now())
  )
);

create policy "owner selects predicted_lineup" on predicted_lineups for select using (
  exists (
    select 1 from predictions p
    join fantasy_teams ft on ft.id = p.fantasy_team_id
    where p.id = predicted_lineups.prediction_id and ft.parent_id = auth.uid()
  )
);
create policy "owner inserts predicted_lineup" on predicted_lineups for insert with check (
  exists (
    select 1 from predictions p
    join fantasy_teams ft on ft.id = p.fantasy_team_id
    where p.id = predicted_lineups.prediction_id and ft.parent_id = auth.uid()
  )
);

-- Fantasy points: read-only for the owning parent, written only by the
-- server (service role) once results are entered
create policy "owner selects fantasy_points" on fantasy_points for select using (
  exists (
    select 1 from predictions p
    join fantasy_teams ft on ft.id = p.fantasy_team_id
    where p.id = fantasy_points.prediction_id and ft.parent_id = auth.uid()
  )
);
