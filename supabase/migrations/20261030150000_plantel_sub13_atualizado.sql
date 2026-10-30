-- Plantel Sub-13 2026/27: nomes completos, posições e remoção do Tomás M. (inativo, mantém histórico)
alter table players add column if not exists active boolean not null default true;

update players p set name = v.name, position_group = v.grp, position_label = v.label, active = true
from (values
  (1,  'Enzo Faria',          'GR',  'Guarda-Redes'),
  (99, 'Rafael Delindro',     'GR',  'Guarda-Redes'),
  (5,  'Tomás Sousa',         'DEF', 'Defesa'),
  (7,  'Gabriel Fernandes',   'DEF', 'Defesa'),
  (27, 'Fernando Gonçalves',  'DEF', 'Defesa'),
  (13, 'Guilherme Barbosa',   'DEF', 'Defesa'),
  (3,  'Santos',              'DEF', 'Defesa'),
  (4,  'Duarte Costa',        'DEF', 'Defesa'),
  (9,  'Dinis Soares',        'DEF', 'Defesa'),
  (8,  'José Sousa',          'MED', 'Médio'),
  (10, 'Vasco Coutinho',      'MED', 'Médio'),
  (18, 'Gabriel Silveira',    'MED', 'Médio'),
  (28, 'Santiago Gonçalves',  'MED', 'Médio'),
  (77, 'Denys Musenko',       'MED', 'Médio'),
  (17, 'Salvador Pinho',      'MED', 'Médio'),
  (19, 'Duarte Santos',       'MED', 'Médio'),
  (26, 'Duarte Silva',        'MED', 'Médio'),
  (11, 'Mateus Silva',        'MED', 'Médio'),
  (6,  'Miguel Gaspar',       'AV',  'Avançado'),
  (20, 'Eduardo Pedros',      'AV',  'Avançado'),
  (29, 'Francisco Rocha',     'AV',  'Avançado'),
  (12, 'Guilherme Sousa',     'AV',  'Avançado'),
  (30, 'Dinis Duarte',        'AV',  'Avançado'),
  (14, 'Bernardo Lima',       'AV',  'Avançado')
) as v(num, name, grp, label)
where p.season_id = '00000000-0000-0000-0000-000000000003' and p.shirt_number = v.num;

update players set active = false
where season_id = '00000000-0000-0000-0000-000000000003' and shirt_number = 47;
