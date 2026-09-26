create policy "admin inserts matches" on matches for insert with check (
  exists (select 1 from parents where id = auth.uid() and is_admin)
);
