alter table teams add column format text not null default 'fut11'
  check (format in ('fut5', 'fut7', 'fut9', 'fut11'));

alter table team_registration_requests add column format text not null default 'fut11'
  check (format in ('fut5', 'fut7', 'fut9', 'fut11'));
