create or replace function my_invited_team_slug()
returns text language sql security definer stable set search_path = public as $$
  select t.slug
  from admin_invites ai
  join seasons s on s.id = ai.season_id
  join teams t on t.id = s.team_id
  join auth.users u on lower(u.email) = lower(ai.email)
  where u.id = auth.uid() and ai.used_at is null
  limit 1;
$$;
revoke execute on function my_invited_team_slug() from public, anon;
grant execute on function my_invited_team_slug() to authenticated;
