// Tipos e ajudantes da área "Palpites dos Leões".

export const PAL_SLUG = "leoes";

export interface PalGroup {
  id: string;
  slug: string;
  name: string;
  club_name: string;
  fino_value: number | null;
  p1_pct: number | null;
  p2_pct: number | null;
  member_limit: number | null;
  jackpot_cap: number | null;
}

export interface PalFixture {
  id: string;
  position: number;
  home: string;
  away: string;
  kickoff: string;
  result: "1" | "X" | "2" | null;
  score_home: number | null;
  score_away: number | null;
}

export interface PalRound {
  id: string;
  number: number;
  status: "open" | "settled";
  bets_closed_at: string | null;
  super_fixture_id: string | null;
}

export interface PalTicket {
  id: string;
  picks: string[][];
  cost: number;
  best_hits: number | null;
  prize: number;
  settled: boolean;
  created_at: string;
  super_home: number | null;
  super_away: number | null;
  super_hit: boolean | null;
}

export interface PalSummary {
  pot: number;
  prize1: number;
  prize2: number;
  caixa: number | null;
  carry_in: number;
  carry_out: number | null;
  overflow: number | null;
  tickets: number;
  settled: boolean;
}

export interface PalLeaderRow {
  user_id: string;
  display_name: string;
  rounds_played: number;
  total_hits: number;
  best_hits: number;
  total_prize: number;
}

export const OPTIONS = ["1", "X", "2"] as const;

/** Custo de um boletim: produto do nº de opções marcadas em cada jogo. */
export function slipCost(picks: string[][]): number {
  if (picks.some((p) => p.length === 0)) return 0;
  return picks.reduce((acc, p) => acc * p.length, 1);
}

export function fmtFinos(n: number): string {
  const v = Math.round(n * 100) / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

export function fmtEuro(n: number): string {
  return `${(Math.round(n * 100) / 100).toFixed(2).replace(".", ",")} €`;
}

export function fmtKickoff(iso: string): string {
  return new Date(iso).toLocaleString("pt-PT", {
    timeZone: "Europe/Lisbon",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Traduz as mensagens de erro das funções da base de dados. */
export function palError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  const table: [string, string][] = [
    ["insufficient finos", "Não tens finos suficientes para este boletim."],
    ["limit exceeded", "Passavas o teu limite de finos por jornada."],
    ["round closed", "Os palpites desta jornada já foram fechados pelo capitão."],
    ["not an active member", "A tua conta ainda não foi aprovada."],
    ["not authorized", "Não tens permissão para isto."],
    ["round in progress", "Já há palpites nesta jornada: as regras só mudam depois de apurar."],
    ["round already open", "Já existe uma jornada aberta. Apura-a primeiro."],
    ["round has tickets", "Esta jornada já tem palpites."],
    ["missing results", "Faltam resultados de alguns jogos."],
    ["already settled", "Esta jornada já foi apurada."],
    ["kickoff in the past", "A hora do primeiro jogo tem de estar no futuro."],
    ["invalid kickoff", "Hora inválida. Usa o formato 2026-10-17 15:00."],
    ["invalid fixtures", "Jogos inválidos: precisa de entre 2 e 13 jogos com duas equipas diferentes."],
    ["not started", "Esse jogo ainda não começou."],
    ["invalid super", "Falta o resultado do Super 7: golos de cada equipa (0 a 50)."],
    ["super fixture", "O jogo Super 7 regista-se pelo resultado exato (golos)."],
    ["invalid score", "Resultado inválido: golos entre 0 e 50."],
    ["negative balance", "O saldo não pode ficar negativo."],
    ["invalid amount", "Quantidade inválida."],
    ["percentages over 100", "A soma dos prémios passa os 100%."],
    ["round number exists", "Já existe uma jornada com esse número."],
    ["invalid name", "Escreve um nome entre 2 e 60 letras."],
  ];
  for (const [k, v] of table) if (m.includes(k)) return v;
  return "Algo correu mal. Tenta outra vez.";
}
