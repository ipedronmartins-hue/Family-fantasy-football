drop view if exists season_leaderboard;
drop view if exists monthly_leaderboard;
drop view if exists matchday_leaderboard;

-- Season total = Previsão points (prediction accuracy) + Equipa points
-- (owning real players who performed well, captain doubled).
create view season_leaderboard as
select
  ft.season_id,
  ft.id as fantasy_team_id,
  ft.name as team_name,
  (coalesce(pred.total, 0) + coalesce(own.total, 0))::int as total_points
from fantasy_teams ft
left join (
  select p.fantasy_team_id, sum(fp.points) as total
  from predictions p join fantasy_points fp on fp.prediction_id = p.id
  group by p.fantasy_team_id
) pred on pred.fantasy_team_id = ft.id
left join (
  select fantasy_team_id, sum(points) as total
  from fantasy_lineup_points
  group by fantasy_team_id
) own on own.fantasy_team_id = ft.id;

grant select on season_leaderboard to anon, authenticated;
comment on view season_leaderboard is 'Public aggregate: Previsão points + Equipa (ownership) points combined. Bypasses RLS intentionally.';

create view monthly_leaderboard as
select
  m.season_id,
  date_trunc('month', m.kickoff_at)::date as month,
  ft.id as fantasy_team_id,
  ft.name as team_name,
  (coalesce(sum(fp.points), 0) + coalesce(sum(flp.points), 0))::int as points
from matches m
join fantasy_teams ft on ft.season_id = m.season_id
left join predictions p on p.match_id = m.id and p.fantasy_team_id = ft.id
left join fantasy_points fp on fp.prediction_id = p.id
left join fantasy_lineup_points flp on flp.match_id = m.id and flp.fantasy_team_id = ft.id
group by m.season_id, date_trunc('month', m.kickoff_at), ft.id, ft.name;

grant select on monthly_leaderboard to anon, authenticated;
comment on view monthly_leaderboard is 'Public aggregate, same rationale as season_leaderboard.';

create view matchday_leaderboard as
select
  m.season_id,
  m.id as match_id,
  m.matchday,
  ft.id as fantasy_team_id,
  ft.name as team_name,
  (coalesce(fp.points, 0) + coalesce(flp.points, 0))::int as points
from matches m
join fantasy_teams ft on ft.season_id = m.season_id
left join predictions p on p.match_id = m.id and p.fantasy_team_id = ft.id
left join fantasy_points fp on fp.prediction_id = p.id
left join fantasy_lineup_points flp on flp.match_id = m.id and flp.fantasy_team_id = ft.id;

grant select on matchday_leaderboard to anon, authenticated;
comment on view matchday_leaderboard is 'Public aggregate, same rationale as season_leaderboard.';
