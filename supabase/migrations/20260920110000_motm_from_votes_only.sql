-- Homem do Jogo passa a ser determinado só pelos votos dos pais -- nunca
-- mais uma escolha manual do admin a competir com isso. Em empate, ganha
-- quem chegou primeiro a esse número de votos.
create or replace function recompute_motm(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner uuid;
begin
  select player_id into v_winner
  from (
    select player_id, count(*) as votes, min(created_at) as first_reached
    from motm_votes
    where match_id = p_match_id
    group by player_id
  ) tally
  order by votes desc, first_reached asc
  limit 1;

  update matches set man_of_the_match_id = v_winner where id = p_match_id;
end;
$$;

create or replace function trg_recompute_motm()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform recompute_motm(coalesce(new.match_id, old.match_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists motm_votes_recompute on motm_votes;
create trigger motm_votes_recompute
after insert or update or delete on motm_votes
for each row execute function trg_recompute_motm();

revoke execute on function recompute_motm(uuid) from public, anon;
grant execute on function recompute_motm(uuid) to authenticated;
