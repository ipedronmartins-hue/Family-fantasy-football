-- sync_admin_flag is a trigger function only (uses NEW, which only exists
-- inside a trigger). It has no business being callable directly via the API.
revoke execute on function sync_admin_flag() from public, anon, authenticated;

-- recalculate_match_points already checks is_admin internally, but there is
-- no reason an anonymous (logged-out) visitor should even be able to call
-- it. Signed-in users still need to, since the admin calls it from the app
-- while authenticated -- the internal check is what actually gates it.
revoke execute on function recalculate_match_points(uuid) from anon;

-- season_leaderboard is deliberately defined without security_invoker: it
-- exposes ONLY an aggregate (team name + summed points), while the
-- underlying predictions/fantasy_points rows stay private via RLS. This is
-- the standard pattern for "public leaderboard, private inputs" and is
-- expected to keep tripping the security-definer-view lint.
comment on view season_leaderboard is
  'Intentionally bypasses RLS to aggregate points across all fantasy_teams for a public leaderboard. Exposes only team_name + total_points -- never individual predictions or their breakdown.';
