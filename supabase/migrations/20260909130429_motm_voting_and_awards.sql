-- Parent vote for "jogador da jornada" -- separate from the admin's
-- official Homem do Jogo (matches.man_of_the_match_id).
create table motm_votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  parent_id uuid not null references parents(id) on delete cascade,
  player_id uuid not null references players(id),
  created_at timestamptz not null default now(),
  unique (match_id, parent_id)
);

alter table motm_votes enable row level security;

create policy "parent selects own vote" on motm_votes for select using (auth.uid() = parent_id);
create policy "parent inserts own vote" on motm_votes for insert with check (auth.uid() = parent_id);
create policy "parent updates own vote" on motm_votes for update using (auth.uid() = parent_id);

-- Public tally (counts only, never who voted for whom) -- same pattern as
-- season_leaderboard: intentionally bypasses RLS to expose an aggregate.
create view motm_vote_tally as
select
  v.match_id,
  v.player_id,
  p.name as player_name,
  count(*)::int as votes
from motm_votes v
join players p on p.id = v.player_id
group by v.match_id, v.player_id, p.name;

grant select on motm_vote_tally to anon, authenticated;
comment on view motm_vote_tally is
  'Intentionally bypasses RLS to show public vote counts per player per match, without exposing which parent voted for whom (motm_votes itself stays owner-only).';

-- Prémios: per-matchday and per-month totals, same public-aggregate pattern
-- as season_leaderboard.
create view matchday_leaderboard as
select
  m.season_id,
  m.id as match_id,
  m.matchday,
  ft.id as fantasy_team_id,
  ft.name as team_name,
  coalesce(fp.points, 0) as points
from matches m
join predictions p on p.match_id = m.id
join fantasy_teams ft on ft.id = p.fantasy_team_id
left join fantasy_points fp on fp.prediction_id = p.id;

grant select on matchday_leaderboard to anon, authenticated;

create view monthly_leaderboard as
select
  m.season_id,
  date_trunc('month', m.kickoff_at)::date as month,
  ft.id as fantasy_team_id,
  ft.name as team_name,
  sum(coalesce(fp.points, 0))::int as points
from matches m
join predictions p on p.match_id = m.id
join fantasy_teams ft on ft.id = p.fantasy_team_id
left join fantasy_points fp on fp.prediction_id = p.id
group by m.season_id, date_trunc('month', m.kickoff_at), ft.id, ft.name;

grant select on monthly_leaderboard to anon, authenticated;
comment on view matchday_leaderboard is 'Public aggregate, same rationale as season_leaderboard.';
comment on view monthly_leaderboard is 'Public aggregate, same rationale as season_leaderboard.';
