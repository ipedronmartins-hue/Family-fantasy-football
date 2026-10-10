-- A caixa do clube só é visível ao capitão e ao tesoureiro (função + colunas da tabela).
revoke select on pal_rounds from authenticated;
grant select (id, group_id, number, status, carry_in, pot, prize1, prize2, carry_out, created_at, settled_at, bets_closed_at, super_fixture_id)
  on pal_rounds to authenticated;
-- pal_round_summary: devolve caixa/overflow a null a quem não é staff (ver função na base de dados).
