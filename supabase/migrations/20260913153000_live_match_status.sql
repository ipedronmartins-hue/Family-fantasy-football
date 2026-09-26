alter table matches add column status text not null default 'scheduled'
  check (status in ('scheduled', 'live', 'finished'));

-- Backfill: anything with a result already entered is finished; nothing
-- currently in progress since this column is brand new.
update matches set status = 'finished' where home_goals is not null and away_goals is not null;

-- Vice-capitão: se o capitão não acertar o MVP mas o vice acertar, o bónus
-- passa para o vice -- mecânica clássica de fantasy football.
alter table fantasy_lineups add column is_vice_captain boolean not null default false;
create unique index one_vice_captain_per_team on fantasy_lineups(fantasy_team_id) where is_vice_captain;

-- Enable realtime so parents see the score update live without refreshing.
alter publication supabase_realtime add table matches;
