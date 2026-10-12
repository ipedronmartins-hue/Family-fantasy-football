alter table team_fund_entries drop constraint if exists team_fund_entries_category_check;
alter table team_fund_entries add constraint team_fund_entries_category_check
  check (category in ('transporte','equipamento','torneios','inscricoes','material','outros','quotas','servidor','lanches'));
