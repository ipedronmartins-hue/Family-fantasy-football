-- Core club/team/season hierarchy (multi-tenant from day one, per spec)
create table clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  name text not null, -- e.g. "Sub-13"
  created_at timestamptz not null default now()
);

create table seasons (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  label text not null, -- e.g. "2026/27"
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now()
);

-- Squad: the real athletes for a season
create table players (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  external_id text, -- stable slug id, e.g. "DUARTE-CB", disambiguates same-name players
  name text not null,
  shirt_number int,
  position_group text not null check (position_group in ('GR','DEF','MED','EXT','AV')),
  position_label text,
  traits text[] default '{}',
  ytb_athlete_id text, -- future YourTalentBase integration
  rating numeric,
  created_at timestamptz not null default now(),
  unique (season_id, external_id)
);

-- Matches / calendar
create table matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  matchday int not null,
  opponent text not null,
  competition text,
  kickoff_at timestamptz not null,
  home boolean not null,
  featured boolean not null default false,
  -- filled in after the match by the admin
  home_goals int,
  away_goals int,
  man_of_the_match_id uuid references players(id),
  locked_at timestamptz, -- predictions close at this time
  created_at timestamptz not null default now(),
  unique (season_id, matchday)
);

create table match_goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  scorer_id uuid not null references players(id),
  assist_id uuid references players(id),
  minute int
);

create table match_lineups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id),
  started boolean not null default false,
  unique (match_id, player_id)
);

-- Parents / accounts
create table parents (
  id uuid primary key references auth.users(id) on delete cascade,
  season_id uuid not null references seasons(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Each parent's Fantasy team for a season
create table fantasy_teams (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents(id) on delete cascade,
  season_id uuid not null references seasons(id) on delete cascade,
  name text not null,
  formation text not null default '4-3-3',
  created_at timestamptz not null default now(),
  unique (parent_id, season_id)
);

-- One prediction per parent per match
create table predictions (
  id uuid primary key default gen_random_uuid(),
  fantasy_team_id uuid not null references fantasy_teams(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  predicted_home_goals int,
  predicted_away_goals int,
  predicted_scorer_id uuid references players(id),
  predicted_assist_id uuid references players(id),
  predicted_mvp_id uuid references players(id),
  submitted_at timestamptz not null default now(),
  unique (fantasy_team_id, match_id)
);

create table predicted_lineups (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references predictions(id) on delete cascade,
  player_id uuid not null references players(id),
  unique (prediction_id, player_id)
);

-- Fantasy points: computed rows, one per prediction, kept separate from the
-- scoring engine's rule config so rules can change without touching history
create table fantasy_points (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references predictions(id) on delete cascade unique,
  points int not null default 0,
  breakdown jsonb not null default '{}',
  calculated_at timestamptz not null default now()
);

-- Configurable scoring rules per season (admin-editable, not hardcoded in UI)
create table scoring_rules (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade unique,
  rules jsonb not null,
  updated_at timestamptz not null default now()
);

-- Team fund (the transport/equipment problem that started this project)
create table team_fund_entries (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  category text not null check (category in ('transporte','equipamento','torneios','inscricoes','material','outros')),
  description text,
  amount numeric not null,
  entry_type text not null check (entry_type in ('receita','despesa')),
  created_at timestamptz not null default now()
);

create index idx_players_season on players(season_id);
create index idx_matches_season on matches(season_id);
create index idx_predictions_match on predictions(match_id);
create index idx_fantasy_teams_season on fantasy_teams(season_id);
