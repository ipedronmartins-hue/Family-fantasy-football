alter table teams add column if not exists money_enabled boolean not null default true;
update teams set money_enabled = false where slug = 'gondomar-sub-10';
