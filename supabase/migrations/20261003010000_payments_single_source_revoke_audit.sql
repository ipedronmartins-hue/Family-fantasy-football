-- 1. Histórico de tudo o que é anulado/removido (só admin da equipa e dono da plataforma leem)
create table if not exists financial_audit_log (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  reason text,
  done_by uuid references parents(id) on delete set null,
  done_at timestamptz not null default now()
);
alter table financial_audit_log enable row level security;
revoke all on financial_audit_log from anon;
create policy "admin reads own season log" on financial_audit_log for select
  using (is_admin_of_season(season_id));
create policy "owner reads all log" on financial_audit_log for select
  using (exists (select 1 from parents where id = auth.uid() and is_platform_owner));

-- 2. Registar contributo: cria sozinho a receita no fundo, ligada ao pagamento.
-- (Sem o nome da família na descrição: o fundo é de leitura pública.)
create or replace function register_family_payment(p_fantasy_team_id uuid, p_month date, p_amount numeric, p_method text)
returns void language plpgsql security definer set search_path = public as $$
declare v_season uuid; v_entry uuid;
begin
  select season_id into v_season from fantasy_teams where id = p_fantasy_team_id;
  if v_season is null then raise exception 'fantasy team not found'; end if;
  if not exists (select 1 from parents where id = auth.uid() and is_admin and season_id = v_season) then
    raise exception 'not authorized';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid amount'; end if;

  select fund_entry_id into v_entry from family_payments
  where fantasy_team_id = p_fantasy_team_id and month = p_month;

  if v_entry is not null and exists (select 1 from team_fund_entries where id = v_entry) then
    update team_fund_entries set amount = p_amount where id = v_entry;
  else
    insert into team_fund_entries (season_id, category, description, amount, entry_type)
    values (v_season, 'quotas', 'Contributo mensal', p_amount, 'receita')
    returning id into v_entry;
  end if;

  insert into family_payments (fantasy_team_id, season_id, month, amount, method, registered_by, fund_entry_id)
  values (p_fantasy_team_id, v_season, p_month, p_amount, p_method, auth.uid(), v_entry)
  on conflict (fantasy_team_id, month) do update
    set amount = excluded.amount, method = excluded.method, paid_at = now(),
        registered_by = excluded.registered_by, fund_entry_id = excluded.fund_entry_id;
end $$;

-- 3. Anular um contributo (sai também do fundo)
create or replace function revoke_family_payment(p_payment_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_pay family_payments%rowtype; v_name text;
begin
  select * into v_pay from family_payments where id = p_payment_id;
  if not found then raise exception 'payment not found'; end if;
  if not is_admin_of_season(v_pay.season_id) then raise exception 'not authorized'; end if;
  select name into v_name from fantasy_teams where id = v_pay.fantasy_team_id;

  insert into financial_audit_log (season_id, action, details, reason, done_by)
  values (v_pay.season_id, 'contributo_anulado',
    jsonb_build_object('familia', v_name, 'mes', v_pay.month, 'valor', v_pay.amount,
                       'metodo', v_pay.method, 'saiu_do_fundo', v_pay.fund_entry_id is not null),
    p_reason, auth.uid());

  delete from family_payments where id = p_payment_id;
  if v_pay.fund_entry_id is not null then
    delete from team_fund_entries where id = v_pay.fund_entry_id;
  end if;
end $$;

-- 4. Remover um movimento do fundo (não os ligados a contributos: esses anulam-se no contributo)
create or replace function remove_fund_entry(p_entry_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_e team_fund_entries%rowtype;
begin
  select * into v_e from team_fund_entries where id = p_entry_id;
  if not found then raise exception 'entry not found'; end if;
  if not is_admin_of_season(v_e.season_id) then raise exception 'not authorized'; end if;
  if exists (select 1 from family_payments where fund_entry_id = p_entry_id) then
    raise exception 'linked to a payment';
  end if;

  insert into financial_audit_log (season_id, action, details, reason, done_by)
  values (v_e.season_id, 'movimento_removido',
    jsonb_build_object('tipo', v_e.entry_type, 'valor', v_e.amount, 'categoria', v_e.category, 'nota', v_e.description),
    p_reason, auth.uid());
  delete from team_fund_entries where id = p_entry_id;
end $$;

-- 5. Anular o pagamento dos 20 € de uma equipa (só o dono da plataforma)
create or replace function revoke_platform_payment(p_payment_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_pay platform_payments%rowtype; v_team text;
begin
  if not exists (select 1 from parents where id = auth.uid() and is_platform_owner) then
    raise exception 'not authorized';
  end if;
  select * into v_pay from platform_payments where id = p_payment_id;
  if not found then raise exception 'payment not found'; end if;
  select c.name || ' ' || t.name into v_team from teams t join clubs c on c.id = t.club_id where t.id = v_pay.team_id;

  insert into financial_audit_log (team_id, action, details, reason, done_by)
  values (v_pay.team_id, 'pagamento_plataforma_anulado',
    jsonb_build_object('equipa', v_team, 'mes', v_pay.month, 'valor', v_pay.amount, 'metodo', v_pay.method),
    p_reason, auth.uid());
  delete from platform_payments where id = p_payment_id;
end $$;

revoke execute on function revoke_family_payment(uuid, text), remove_fund_entry(uuid, text), revoke_platform_payment(uuid, text) from public, anon;
grant execute on function revoke_family_payment(uuid, text), remove_fund_entry(uuid, text), revoke_platform_payment(uuid, text) to authenticated;

-- 6. Liga os contributos antigos às receitas lançadas à mão logo a seguir (mesmo valor, até 3 min depois).
update family_payments fp set fund_entry_id = e.id
from team_fund_entries e
where fp.fund_entry_id is null
  and e.season_id = fp.season_id and e.entry_type = 'receita' and e.amount = fp.amount
  and e.created_at between fp.paid_at and fp.paid_at + interval '3 minutes'
  and not exists (select 1 from family_payments o where o.fund_entry_id = e.id);
