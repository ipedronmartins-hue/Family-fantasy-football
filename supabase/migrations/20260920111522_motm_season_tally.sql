create view motm_season_tally as
select
  m.season_id,
  p.id as player_id,
  p.name as player_name,
  p.shirt_number,
  count(*) as awards
from matches m
join players p on p.id = m.man_of_the_match_id
where m.man_of_the_match_id is not null
group by m.season_id, p.id, p.name, p.shirt_number;

grant select on motm_season_tally to anon, authenticated;
comment on view motm_season_tally is 'Public aggregate: how many times each player has been voted Homem do Jogo this season. Bypasses RLS intentionally, same rationale as season_leaderboard.';
