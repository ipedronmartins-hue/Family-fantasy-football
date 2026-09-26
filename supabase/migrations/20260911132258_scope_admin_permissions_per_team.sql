-- Drop the flat "any admin can touch anything" policies and replace with
-- "admin of THIS team's season" checks. This is a strict tightening: an
-- admin who could do X before can still do X for their own team, but can
-- no longer touch another team's data.

drop policy "admin updates matches" on matches;
create policy "admin updates own team matches" on matches for update using (
  exists (
    select 1 from parents p
    where p.id = auth.uid() and p.is_admin and p.season_id = matches.season_id
  )
);

drop policy "admin inserts matches" on matches;
create policy "admin inserts own team matches" on matches for insert with check (
  exists (
    select 1 from parents p
    where p.id = auth.uid() and p.is_admin and p.season_id = matches.season_id
  )
);

drop policy "admin inserts match_goals" on match_goals;
create policy "admin inserts own team match_goals" on match_goals for insert with check (
  exists (
    select 1 from parents p
    join matches m on m.id = match_goals.match_id
    where p.id = auth.uid() and p.is_admin and p.season_id = m.season_id
  )
);

drop policy "admin deletes match_goals" on match_goals;
create policy "admin deletes own team match_goals" on match_goals for delete using (
  exists (
    select 1 from parents p
    join matches m on m.id = match_goals.match_id
    where p.id = auth.uid() and p.is_admin and p.season_id = m.season_id
  )
);

drop policy "admin inserts match_lineups" on match_lineups;
create policy "admin inserts own team match_lineups" on match_lineups for insert with check (
  exists (
    select 1 from parents p
    join matches m on m.id = match_lineups.match_id
    where p.id = auth.uid() and p.is_admin and p.season_id = m.season_id
  )
);

drop policy "admin deletes match_lineups" on match_lineups;
create policy "admin deletes own team match_lineups" on match_lineups for delete using (
  exists (
    select 1 from parents p
    join matches m on m.id = match_lineups.match_id
    where p.id = auth.uid() and p.is_admin and p.season_id = m.season_id
  )
);

drop policy "admin updates scoring_rules" on scoring_rules;
create policy "admin updates own team scoring_rules" on scoring_rules for update using (
  exists (
    select 1 from parents p
    where p.id = auth.uid() and p.is_admin and p.season_id = scoring_rules.season_id
  )
);

drop policy "admin writes team_fund_entries" on team_fund_entries;
create policy "admin writes own team_fund_entries" on team_fund_entries for insert with check (
  exists (
    select 1 from parents p
    where p.id = auth.uid() and p.is_admin and p.season_id = team_fund_entries.season_id
  )
);

-- players table never had an admin write policy at all (rosters were
-- seeded by hand) -- add one now, scoped per team, since teams will need
-- to manage their own roster.
create policy "admin inserts own team players" on players for insert with check (
  exists (
    select 1 from parents p
    where p.id = auth.uid() and p.is_admin and p.season_id = players.season_id
  )
);
create policy "admin updates own team players" on players for update using (
  exists (
    select 1 from parents p
    where p.id = auth.uid() and p.is_admin and p.season_id = players.season_id
  )
);
create policy "admin deletes own team players" on players for delete using (
  exists (
    select 1 from parents p
    where p.id = auth.uid() and p.is_admin and p.season_id = players.season_id
  )
);
