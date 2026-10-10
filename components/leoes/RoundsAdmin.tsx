"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { fmtKickoff, type PalFixture, type PalRound } from "@/lib/palpites";

export interface AdminRound {
  round: PalRound & { status: "open" | "scheduled" };
  fixtures: PalFixture[];
  ticketCount: number;
}

type Runner = (fn: () => PromiseLike<{ error: { message: string } | null }>, okText: string) => Promise<boolean>;

interface Props {
  groupId: string;
  rounds: AdminRound[];
  busy: boolean;
  run: Runner;
  onError: (text: string) => void;
}

const card = "rounded-2xl border border-line bg-white p-4";
const input = "w-full rounded-xl border border-line px-3 py-2 text-sm";
const btn = "rounded-xl bg-blue px-3 py-2 text-xs font-semibold text-white disabled:opacity-50";
const btnGhost = "rounded-xl border border-line bg-bg px-3 py-2 text-xs font-semibold text-ink disabled:opacity-50";

interface ParsedRound {
  number: number | null;
  fixtures: { home: string; away: string; kickoff: string }[];
}

/**
 * Texto colado → jornadas. Cada jornada começa com «Jornada 3» (ou sem cabeçalho, se for só uma).
 * Cada jogo: «2026-10-17 15:00 Casa - Fora».
 */
export function parseRounds(text: string): ParsedRound[] | string {
  const rounds: ParsedRound[] = [];
  let cur: ParsedRound | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const head = line.match(/^jornada\s+(\d+)\s*:?$/i);
    if (head) {
      cur = { number: Number(head[1]), fixtures: [] };
      rounds.push(cur);
      continue;
    }
    const m = line.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})\s+(.+?)\s+[-–—]\s+(.+)$/);
    if (!m) return `Não percebi a linha: "${line}". Usa: 2026-10-17 15:00 Casa - Fora`;
    if (!cur) {
      cur = { number: null, fixtures: [] };
      rounds.push(cur);
    }
    cur.fixtures.push({ kickoff: `${m[1]} ${m[2].padStart(5, "0")}`, home: m[3].trim(), away: m[4].trim() });
  }
  if (rounds.length === 0) return "Cola pelo menos uma jornada.";
  for (const r of rounds) {
    if (r.fixtures.length < 2 || r.fixtures.length > 13) {
      return `${r.number ? `A jornada ${r.number}` : "A jornada"} tem ${r.fixtures.length} jogos: tem de ter entre 2 e 13.`;
    }
  }
  return rounds;
}

/** ISO → «2026-10-17 15:00» na hora de Lisboa. */
function toLocalInput(iso: string): string {
  const p = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
  return p.replace("T", " ");
}

export default function RoundsAdmin({ groupId, rounds, busy, run, onError }: Props) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ home: "", away: "", kickoff: "" });
  const [scores, setScores] = useState<Record<string, { h: string; a: string }>>({});
  const sb = () => createBrowserSupabase();

  async function bulkCreate() {
    const parsed = parseRounds(text);
    if (typeof parsed === "string") return onError(parsed);
    const ok = await run(
      () => sb().rpc("pal_create_rounds", { p_group: groupId, p_rounds: parsed }),
      parsed.length === 1 ? "Jornada criada." : `${parsed.length} jornadas criadas. A primeira abre aos palpites, as outras ficam agendadas.`
    );
    if (ok) setText("");
  }

  function startEdit(f: PalFixture) {
    setEditing(f.id);
    setDraft({ home: f.home, away: f.away, kickoff: toLocalInput(f.kickoff) });
  }

  async function saveEdit(id: string) {
    const ok = await run(
      () =>
        sb().rpc("pal_update_fixture", {
          p_fixture: id,
          p_home: draft.home,
          p_away: draft.away,
          p_kickoff_local: draft.kickoff,
        }),
      "Jogo atualizado."
    );
    if (ok) setEditing(null);
  }

  const open = rounds.find((r) => r.round.status === "open");

  return (
    <section className={card}>
      <h2 className="font-display text-lg font-semibold">Jornadas</h2>

      <p className="mt-1 text-xs text-ink/60">
        Cola uma ou várias jornadas de uma vez. Cada jornada começa com «Jornada 3» e depois um jogo por linha:{" "}
        <code>2026-10-17 15:00 Casa - Fora</code>. A de número mais baixo abre aos palpites; as outras ficam agendadas e
        abrem sozinhas quando apurares a anterior.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className={`${input} mt-2 font-mono text-xs`}
        placeholder={"Jornada 1\n2026-10-17 15:00 Casa - Fora\n2026-10-17 15:00 Casa - Fora\n\nJornada 2\n2026-10-24 15:00 Casa - Fora\n2026-10-24 15:00 Casa - Fora"}
      />
      <button className={`${btn} mt-2`} disabled={busy || !text.trim()} onClick={bulkCreate}>
        Inserir jornadas
      </button>
      <p className="mt-2 text-[11px] text-ink/50">Os palpites ficam abertos até o capitão os fechar à mão (botão «Fechar palpites» em cada jornada). Entre 2 e 13 jogos. Em cada jornada escolhe um jogo «Super 7» (resultado exato): o prémio é de quem acertar tudo, incluindo o Super 7.</p>

      {rounds.length === 0 && <p className="mt-4 text-sm text-ink/60">Ainda não há jornadas abertas ou agendadas.</p>}

      <ul className="mt-4 flex flex-col gap-4">
        {rounds.map(({ round, fixtures, ticketCount }) => {
          const isOpen = round.status === "open";
          const allResults = fixtures.length > 0 && fixtures.every((f) => f.result);
          const canEditTeams = ticketCount === 0;
          return (
            <li key={round.id} className="rounded-xl border border-line p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold">
                  Jornada {round.number}{" "}
                  <span className={`text-[11px] ${isOpen ? "text-[#128C7E]" : "text-ink/50"}`}>
                    {isOpen ? `${round.bets_closed_at ? "palpites fechados" : "aberta"} · ${ticketCount} ${ticketCount === 1 ? "boletim" : "boletins"}` : "agendada"}
                  </span>
                </p>
                <div className="flex gap-2">
                {isOpen && (
                  <button
                    className={btn}
                    disabled={busy}
                    onClick={() => {
                      const closing = !round.bets_closed_at;
                      if (!closing || confirm(`Fechar os palpites da jornada ${round.number}? Ninguém mais poderá apostar.`)) {
                        run(
                          () => sb().rpc("pal_set_bets_closed", { p_round: round.id, p_closed: closing }),
                          closing ? "Palpites fechados." : "Palpites reabertos."
                        );
                      }
                    }}
                  >
                    {round.bets_closed_at ? "Reabrir palpites" : "Fechar palpites"}
                  </button>
                )}
                <button
                  className={btnGhost}
                  disabled={busy || ticketCount > 0}
                  onClick={() => {
                    if (confirm(`Apagar a jornada ${round.number} e os seus jogos?`)) {
                      run(() => sb().rpc("pal_delete_round", { p_round: round.id }), "Jornada apagada.");
                    }
                  }}
                >
                  Apagar
                </button>
                </div>
              </div>

              <ul className="mt-2 flex flex-col gap-2">
                {fixtures.map((f) => {
                  const started = Date.now() >= new Date(f.kickoff).getTime();
                  const isEditing = editing === f.id;
                  return (
                    <li key={f.id} className="rounded-lg bg-bg p-2 text-sm">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              className={input}
                              value={draft.home}
                              disabled={!canEditTeams}
                              onChange={(e) => setDraft({ ...draft, home: e.target.value })}
                              aria-label="Casa"
                            />
                            <input
                              className={input}
                              value={draft.away}
                              disabled={!canEditTeams}
                              onChange={(e) => setDraft({ ...draft, away: e.target.value })}
                              aria-label="Fora"
                            />
                          </div>
                          <input
                            className={input}
                            value={draft.kickoff}
                            onChange={(e) => setDraft({ ...draft, kickoff: e.target.value })}
                            placeholder="2026-10-17 15:00"
                            aria-label="Data e hora"
                          />
                          {!canEditTeams && (
                            <p className="text-[11px] text-ink/50">Já há palpites: só podes mudar a data e a hora.</p>
                          )}
                          <div className="flex gap-2">
                            <button className={btn} disabled={busy} onClick={() => saveEdit(f.id)}>Guardar</button>
                            <button className={btnGhost} onClick={() => setEditing(null)}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[11px] text-ink/50">{fmtKickoff(f.kickoff)}</p>
                              <p className="font-semibold">
                                {f.home} – {f.away}
                                {f.id === round.super_fixture_id && (
                                  <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-ink">SUPER 7</span>
                                )}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {ticketCount === 0 && !f.result && (
                                <button
                                  className={btnGhost}
                                  disabled={busy}
                                  onClick={() =>
                                    run(
                                      () =>
                                        sb().rpc("pal_set_super_fixture", {
                                          p_round: round.id,
                                          p_fixture: f.id === round.super_fixture_id ? null : f.id,
                                        }),
                                      f.id === round.super_fixture_id ? "Super 7 retirado." : "Jogo Super 7 escolhido."
                                    )
                                  }
                                >
                                  {f.id === round.super_fixture_id ? "Tirar Super 7" : "Super 7"}
                                </button>
                              )}
                              {!f.result && (
                                <button className={btnGhost} disabled={busy} onClick={() => startEdit(f)}>Editar</button>
                              )}
                            </div>
                          </div>
                          {isOpen && started && f.id === round.super_fixture_id && (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                inputMode="numeric"
                                maxLength={2}
                                placeholder={f.score_home?.toString() ?? "0"}
                                value={scores[f.id]?.h ?? ""}
                                onChange={(e) => setScores({ ...scores, [f.id]: { h: e.target.value.replace(/\D/g, ""), a: scores[f.id]?.a ?? "" } })}
                                aria-label="Golos casa"
                                className="w-14 rounded-xl border border-line px-2 py-2 text-center text-base font-semibold"
                              />
                              <span className="font-semibold">–</span>
                              <input
                                inputMode="numeric"
                                maxLength={2}
                                placeholder={f.score_away?.toString() ?? "0"}
                                value={scores[f.id]?.a ?? ""}
                                onChange={(e) => setScores({ ...scores, [f.id]: { h: scores[f.id]?.h ?? "", a: e.target.value.replace(/\D/g, "") } })}
                                aria-label="Golos fora"
                                className="w-14 rounded-xl border border-line px-2 py-2 text-center text-base font-semibold"
                              />
                              <button
                                className={btn}
                                disabled={busy || !scores[f.id]?.h || !scores[f.id]?.a}
                                onClick={() =>
                                  run(
                                    () => sb().rpc("pal_set_super_score", { p_fixture: f.id, p_home: Number(scores[f.id].h), p_away: Number(scores[f.id].a) }),
                                    "Resultado exato guardado."
                                  )
                                }
                              >
                                Guardar resultado
                              </button>
                              {f.score_home !== null && (
                                <span className="text-xs text-ink/60">Registado: {f.score_home}-{f.score_away}</span>
                              )}
                            </div>
                          )}
                          {isOpen && started && f.id !== round.super_fixture_id && (
                            <div className="mt-2 flex gap-2">
                              {(["1", "X", "2"] as const).map((o) => (
                                <button
                                  key={o}
                                  disabled={busy}
                                  aria-pressed={f.result === o}
                                  onClick={() => run(() => sb().rpc("pal_set_result", { p_fixture: f.id, p_result: o }), "Resultado guardado.")}
                                  className={`flex-1 rounded-lg py-2 text-sm font-semibold ${f.result === o ? "bg-blue text-white" : "border border-line bg-white"}`}
                                >
                                  {o}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>

              {isOpen && (
                <>
                  <button
                    className={`${btn} mt-3 w-full py-3`}
                    disabled={busy || !allResults}
                    onClick={() => {
                      if (confirm("Apurar a jornada? Os prémios são pagos em finos e isto não se desfaz.")) {
                        run(() => sb().rpc("pal_settle_round", { p_round: round.id }), "Jornada apurada e prémios atribuídos.");
                      }
                    }}
                  >
                    Apurar jornada
                  </button>
                  {!allResults && (
                    <p className="mt-2 text-[11px] text-ink/50">Os resultados registam-se depois de cada jogo começar. Com todos registados, podes apurar.</p>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      {open === undefined && rounds.length > 0 && (
        <p className="mt-2 text-[11px] text-ink/50">Não há jornada aberta: a primeira agendada abre quando a anterior for apurada.</p>
      )}
    </section>
  );
}
