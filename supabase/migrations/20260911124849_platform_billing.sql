-- Platform owner: the ONE person who can see/manage billing and blocking
-- across ALL teams (not the same as a team's own admin).
alter table parents add column is_platform_owner boolean not null default false;

create table platform_owners (email text primary key);
alter table platform_owners enable row level security;
-- No policies on purpose: only sync_platform_owner_flag (SECURITY DEFINER) touches this.

create or replace function sync_platform_owner_flag() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from platform_owners po
    join auth.users u on u.email = po.email
    where u.id = new.id
  ) then
    new.is_platform_owner := true;
  end if;
  return new;
end;
$$;

create trigger set_platform_owner_on_insert
before insert on parents
for each row execute function sync_platform_owner_flag();

revoke execute on function sync_platform_owner_flag() from public, anon, authenticated;

insert into platform_owners (email) values ('OWNER_EMAIL@example.com');

-- Retroactively flag Ivo's existing parent row (he already signed up before
-- this table existed, so the trigger never ran for him).
update parents set is_platform_owner = true
where id in (select id from auth.users where email = 'OWNER_EMAIL@example.com');

-- Team-level billing status: whether a team's platform access is active.
alter table teams add column platform_status text not null default 'active'
  check (platform_status in ('active', 'blocked'));
alter table teams add column admin_contact_email text;

-- Platform fee paid BY a team TO the platform owner -- separate from
-- family_payments (parents paying their own team's internal fund).
create table platform_payments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  month date not null,
  amount numeric not null default 20,
  method text not null default 'dinheiro',
  paid_at timestamptz not null default now(),
  registered_by uuid references parents(id),
  unique (team_id, month)
);

alter table platform_payments enable row level security;

create policy "platform owner selects platform_payments" on platform_payments for select using (
  exists (select 1 from parents where id = auth.uid() and is_platform_owner)
);
create policy "platform owner inserts platform_payments" on platform_payments for insert with check (
  exists (select 1 from parents where id = auth.uid() and is_platform_owner)
);
create policy "team admin selects own platform_payments" on platform_payments for select using (
  exists (
    select 1 from parents p
    join seasons s on s.id = p.season_id
    where p.id = auth.uid() and p.is_admin and s.team_id = platform_payments.team_id
  )
);

-- Platform owner can update team billing status (block/unblock).
create policy "platform owner updates teams" on teams for update using (
  exists (select 1 from parents where id = auth.uid() and is_platform_owner)
);

-- Public intake form for new teams wanting to join the platform.
create table team_registration_requests (
  id uuid primary key default gen_random_uuid(),
  club_name text not null,
  team_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references parents(id)
);

alter table team_registration_requests enable row level security;

create policy "anyone inserts registration request" on team_registration_requests for insert with check (true);
create policy "platform owner selects registration requests" on team_registration_requests for select using (
  exists (select 1 from parents where id = auth.uid() and is_platform_owner)
);
create policy "platform owner updates registration requests" on team_registration_requests for update using (
  exists (select 1 from parents where id = auth.uid() and is_platform_owner)
);

-- Backfill: Gondomar's own team record, so the billing UI has something to show.
update teams set admin_contact_email = 'OWNER_EMAIL@example.com'
where id = '00000000-0000-0000-0000-000000000002';
