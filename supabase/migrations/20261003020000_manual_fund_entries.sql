-- O dinheiro entra no fundo à mão. Registar um contributo só regista quem pagou.
create or replace function register_family_payment(p_fantasy_team_id uuid, p_month date, p_amount numeric, p_method text)
returns void language plpgsql security definer set search_path = public as $$
declare v_season uuid;
begin
  select season_id into v_season from fantasy_teams where id = p_fantasy_team_id;
  if v_season is null then raise exception 'fantasy team not found'; end if;
  if not exists (select 1 from parents where id = auth.uid() and is_admin and season_id = v_season) then
    raise exception 'not authorized';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid amount'; end if;

  insert into family_payments (fantasy_team_id, season_id, month, amount, method, registered_by)
  values (p_fantasy_team_id, v_season, p_month, p_amount, p_method, auth.uid())
  on conflict (fantasy_team_id, month) do update
    set amount = excluded.amount, method = excluded.method, paid_at = now(),
        registered_by = excluded.registered_by;
end $$;

-- Anular um contributo NÃO mexe no fundo (remove-se à parte, se foi lançado).
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
    jsonb_build_object('familia', v_name, 'mes', v_pay.month, 'valor', v_pay.amount, 'metodo', v_pay.method),
    p_reason, auth.uid());

  delete from family_payments where id = p_payment_id;
end $$;

update family_payments set fund_entry_id = null where fund_entry_id is not null;
