-- No policies added on purpose: this table has no legitimate reason to be
-- readable or writable through the API. The only thing that touches it is
-- sync_admin_flag(), which runs as SECURITY DEFINER and bypasses RLS.
alter table admin_emails enable row level security;
