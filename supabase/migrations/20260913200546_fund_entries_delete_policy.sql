create policy "admin deletes own team_fund_entries" on team_fund_entries for delete using (
  exists (select 1 from parents p where p.id = auth.uid() and p.is_admin and p.season_id = team_fund_entries.season_id)
);
