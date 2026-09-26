-- A votação fica aberta no dia do jogo, e fecha ao virar do dia seguinte
-- (hora de Portugal, não UTC).
drop policy "parent inserts own vote" on motm_votes;
create policy "parent inserts own vote" on motm_votes for insert with check (
  auth.uid() = parent_id
  and (now() at time zone 'Europe/Lisbon')::date <= (
    select (kickoff_at at time zone 'Europe/Lisbon')::date from matches where id = motm_votes.match_id
  )
);

drop policy "parent updates own vote" on motm_votes;
create policy "parent updates own vote" on motm_votes for update using (
  auth.uid() = parent_id
  and (now() at time zone 'Europe/Lisbon')::date <= (
    select (kickoff_at at time zone 'Europe/Lisbon')::date from matches where id = motm_votes.match_id
  )
);
