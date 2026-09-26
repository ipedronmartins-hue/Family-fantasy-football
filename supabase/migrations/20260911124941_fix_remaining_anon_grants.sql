revoke execute on function register_family_payment(uuid, date, numeric, text) from public, anon;
grant execute on function register_family_payment(uuid, date, numeric, text) to authenticated;

revoke execute on function register_fixed_cost(text, text, numeric) from public, anon;
grant execute on function register_fixed_cost(text, text, numeric) to authenticated;
