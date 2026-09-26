# Base de dados (Supabase)

`migrations/` tem todas as alterações à estrutura da base de dados, pela ordem em que
foram aplicadas no projeto Supabase de produção (o prefixo é a data e hora).

Aplicadas por ordem numa base de dados Postgres/Supabase vazia, recriam as tabelas,
regras de segurança (RLS), funções de pontuação e vistas de classificação.

Notas:
- `OWNER_EMAIL@example.com` substitui o email real do dono da plataforma. Ao recriar,
  troca pelo email verdadeiro.
- A migração de 20/09 (nomes do plantel) ficou sem conteúdo de propósito: eram nomes de
  menores. Os dados (pais, jogadores, pontos, fundo) não estão aqui — só a estrutura.
- Daqui para a frente, cada migração nova aplicada no Supabase deve também ser gravada
  aqui, para o repositório continuar completo.
