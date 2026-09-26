create policy "admin selects own team parents" on parents for select using (
  exists (
    select 1 from parents p
    where p.id = auth.uid() and p.is_admin and p.season_id = parents.season_id
  )
);
