-- How long each player actually played -- drives the minutes-played points
-- and is required (60+) for clean sheet credit, matching real FPL.
alter table match_lineups add column minutes_played int not null default 0;

-- Own goals are a distinct, penalised event -- not a normal goal for the
-- scoring team's own player.
alter table match_goals add column is_own_goal boolean not null default false;

create table match_cards (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id),
  card_type text not null check (card_type in ('yellow', 'red'))
);

create table match_penalty_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id),
  event_type text not null check (event_type in ('miss', 'save'))
);

create table match_bonus_points (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id),
  points int not null check (points between 1 and 3),
  unique (match_id, player_id)
);

-- Fantasy points earned from OWNING real players in your XI for this
-- gameweek (goals/assists/clean sheets/cards/minutes/bonus), separate from
-- fantasy_points (which is Previsão prediction-accuracy points). The overall
-- ranking sums both.
create table fantasy_lineup_points (
  id uuid primary key default gen_random_uuid(),
  fantasy_team_id uuid not null references fantasy_teams(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  points int not null default 0,
  breakdown jsonb not null default '{}',
  calculated_at timestamptz not null default now(),
  unique (fantasy_team_id, match_id)
);

alter table match_cards enable row level security;
alter table match_penalty_events enable row level security;
alter table match_bonus_points enable row level security;
alter table fantasy_lineup_points enable row level security;

create policy "public read match_cards" on match_cards for select using (true);
create policy "public read match_penalty_events" on match_penalty_events for select using (true);
create policy "public read match_bonus_points" on match_bonus_points for select using (true);

create policy "admin writes own team match_cards" on match_cards for all using (
  exists (select 1 from parents p join matches m on m.id = match_cards.match_id where p.id = auth.uid() and p.is_admin and p.season_id = m.season_id)
) with check (
  exists (select 1 from parents p join matches m on m.id = match_cards.match_id where p.id = auth.uid() and p.is_admin and p.season_id = m.season_id)
);
create policy "admin writes own team match_penalty_events" on match_penalty_events for all using (
  exists (select 1 from parents p join matches m on m.id = match_penalty_events.match_id where p.id = auth.uid() and p.is_admin and p.season_id = m.season_id)
) with check (
  exists (select 1 from parents p join matches m on m.id = match_penalty_events.match_id where p.id = auth.uid() and p.is_admin and p.season_id = m.season_id)
);
create policy "admin writes own team match_bonus_points" on match_bonus_points for all using (
  exists (select 1 from parents p join matches m on m.id = match_bonus_points.match_id where p.id = auth.uid() and p.is_admin and p.season_id = m.season_id)
) with check (
  exists (select 1 from parents p join matches m on m.id = match_bonus_points.match_id where p.id = auth.uid() and p.is_admin and p.season_id = m.season_id)
);

create policy "owner selects own fantasy_lineup_points" on fantasy_lineup_points for select using (
  exists (select 1 from fantasy_teams ft where ft.id = fantasy_lineup_points.fantasy_team_id and ft.parent_id = auth.uid())
);
