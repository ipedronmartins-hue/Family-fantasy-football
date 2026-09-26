create policy "owner deletes predicted_lineup" on predicted_lineups for delete using (
  exists (
    select 1 from predictions p
    join fantasy_teams ft on ft.id = p.fantasy_team_id
    where p.id = predicted_lineups.prediction_id and ft.parent_id = auth.uid()
  )
);
