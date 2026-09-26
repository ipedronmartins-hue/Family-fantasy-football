-- SECURITY DEFINER bypasses RLS internally, breaking the self-reference
-- that caused infinite recursion in the policy.
create or replace function is_admin_of_season(p_season_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from parents where id = auth.uid() and is_admin and season_id = p_season_id
  );
$$;

drop policy "admin selects own team parents" on parents;
create policy "admin selects own team parents" on parents for select using (
  is_admin_of_season(season_id)
);

drop policy "admin selects own team fantasy_teams" on fantasy_teams;
create policy "admin selects own team fantasy_teams" on fantasy_teams for select using (
  is_admin_of_season(season_id)
);
