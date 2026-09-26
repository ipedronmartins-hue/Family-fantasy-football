alter table players add column set_pieces text;
comment on column players.set_pieces is 'Free text, e.g. "Grandes penalidades, livres" -- shown to parents as a hint when guessing scorer/assist.';
