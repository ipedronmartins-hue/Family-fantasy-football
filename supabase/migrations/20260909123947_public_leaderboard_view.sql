-- Intentionally NOT security_invoker: this view exposes only the aggregate
-- (team name + total points), which is meant to be public, while the
-- underlying predictions/fantasy_points rows stay owner-only via RLS.
create view season_leaderboard as
select
  ft.season_id,
  ft.id as fantasy_team_id,
  ft.name as team_name,
  coalesce(sum(fp.points), 0)::int as total_points
from fantasy_teams ft
left join predictions p on p.fantasy_team_id = ft.id
left join fantasy_points fp on fp.prediction_id = p.id
group by ft.season_id, ft.id, ft.name;

grant select on season_leaderboard to anon, authenticated;
