create policy "admin selects own team fantasy_teams" on fantasy_teams for select using (
  exists (
    select 1 from parents p
    where p.id = auth.uid() and p.is_admin and p.season_id = fantasy_teams.season_id
  )
);
