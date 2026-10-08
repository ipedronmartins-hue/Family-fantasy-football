"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { fmtFinos, fmtKickoff, palError, type PalFixture, type PalGroup, type PalRound } from "@/lib/palpites";

export interface AdminMember {
  user_id: string;
  display_name: string;
  status: "pending" | "active" | "suspended";
  is_admin: boolean;
  is_treasurer: boolean;
  email: string | null;
  balance: number;
}

interface Props {
  group: PalGroup;
  isAdmin: boolean;
  members: AdminMember[];
  round: PalRound | null;
  fixtures: PalFixture[];
  ticketCount: number;
  selfId: string;
}

const card = "rounded-2xl border border-line bg-white p-4";
const input = "w-full rounded-xl border border-line px-3 py-2 text-sm";
const btn = "rounded-xl bg-blue px-3 py-2 text-xs font-semibold text-white disabled:opacity-50";
const btnGhost = "rounded-xl border border-line bg-bg px-3 py-2 text-xs font-semibold text-ink disabled:opacity-50";

/** Linhas "2026-10-17 15:00 Casa - Fora" → jogos para a base de dados. */
function parseFixtures(text: string): { home: string; away: string; kickoff: string }[] | string {
  const out: { home: string; away: string; kickoff: string }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})\s+(.+?)\s+[-–—]\s+(.+)$/);
    if (!m) return `Não percebi a linha: "${line}". Usa: 2026-10-17 15:00 Casa - Fora`;
    out.push({ kickoff: `${m[1]} ${m[2].padStart(5, "0")}`, home: m[3].trim(), away: m[4].trim() });
  }
  return out;
}

export default function LeoesAdmin({ group, isAdmin, members, round, fixtures, ticketCount, selfId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [fixtureText, setFixtureText] = useState("");
  const [settings, setSettings] = useState({
    fino_value: group.fino_value?.toString() ?? "",
    p1: group.p1_pct?.toString() ?? "",
    p2: group.p2_pct?.toString() ?? "",
    limit: group.member_limit?.toString() ?? "",
    cap: group.jackpot_cap?.toString() ?? "",
  });

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>, okText: string) {
    setBusy(true);
    setMsg(null);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      setMsg({ kind: "err", text: palError(error.message) });
      return false;
    }
    setMsg({ kind: "ok", text: okText });
    router.refresh();
    return true;
  }

  const sb = () => createBrowserSupabase();

  const grant = (m: AdminMember, amount: number) =>
    run(() => sb().rpc("pal_grant_finos", { p_group: group.id, p_user: m.user_id, p_amount: amount }), `${amount > 0 ? "+" : ""}${amount} para ${m.display_name}.`);

  const setStatus = (m: AdminMember, status: string) =>
    run(() => sb().rpc("pal_set_member_status", { p_group: group.id, p_user: m.user_id, p_status: status }), "Atualizado.");

  const setTreasurer = (m: AdminMember, flag: boolean) =>
    run(() => sb().rpc("pal_set_treasurer", { p_group: group.id, p_user: m.user_id, p_flag: flag }), flag ? "Nomeado tesoureiro." : "Tesoureiro removido.");

  async function createRound() {
    const parsed = parseFixtures(fixtureText);
    if (typeof parsed === "string") return setMsg({ kind: "err", text: parsed });
    const ok = await run(() => sb().rpc("pal_create_round", { p_group: group.id, p_number: null, p_fixtures: parsed }), "Jornada criada e aberta aos palpites.");
    if (ok) setFixtureText("");
  }

  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));

  const saveSettings = () =>
    run(
      () =>
        sb().rpc("pal_update_settings", {
          p_group: group.id,
          p_fino_value: numOrNull(settings.fino_value),
          p_p1: numOrNull(settings.p1),
          p_p2: numOrNull(settings.p2),
          p_limit: numOrNull(settings.limit),
          p_cap: numOrNull(settings.cap),
        }),
      "Regras guardadas."
    );

  const pending = members.filter((m) => m.status === "pending");
  const others = members.filter((m) => m.status !== "pending");
  const allResults = fixtures.length > 0 && fixtures.every((f) => f.result);

  return (
    <div className="mt-4 flex flex-col gap-6">
      {msg && (
        <p className={`rounded-xl px-3 py-2 text-sm ${msg.kind === "ok" ? "bg-[#128C7E]/10 text-[#0b6258]" : "bg-red/10 text-red"}`}>{msg.text}</p>
      )}

      {pending.length > 0 && isAdmin && (
        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Pedidos para entrar</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {pending.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {m.display_name}
                  {m.email && <span className="block text-[11px] text-ink/50">{m.email}</span>}
                </span>
                <span className="flex gap-2">
                  <button className={btn} disabled={busy} onClick={() => setStatus(m, "active")}>Aprovar</button>
                  <button className={btnGhost} disabled={busy} onClick={() => setStatus(m, "suspended")}>Recusar</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={card}>
        <h2 className="font-display text-lg font-semibold">Finos dos jogadores</h2>
        <p className="mt-1 text-xs text-ink/60">
          Regista os finos quando o jogador paga a sua parte ao clube (MB WAY, dinheiro…). O dinheiro nunca passa pela app.
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {others.length === 0 && <li className="text-sm text-ink/60">Ainda não há jogadores aprovados.</li>}
          {others.map((m) => (
            <li key={m.user_id} className="border-t border-line pt-3 first:border-0 first:pt-0">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold">
                  {m.display_name}
                  {m.is_admin && <span className="ml-1 text-[10px] text-blue">capitão</span>}
                  {m.is_treasurer && <span className="ml-1 text-[10px] text-blue">tesoureiro</span>}
                  {m.status === "suspended" && <span className="ml-1 text-[10px] text-red">suspenso</span>}
                </span>
                <span className="text-xs text-ink/70">{fmtFinos(m.balance)} finos</span>
              </div>
              {m.status === "active" && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {[1, 2, 5, 10].map((n) => (
                    <button key={n} className={btnGhost} disabled={busy} onClick={() => grant(m, n)}>+{n}</button>
                  ))}
                  <input
                    inputMode="numeric"
                    placeholder="outro"
                    value={amounts[m.user_id] ?? ""}
                    onChange={(e) => setAmounts({ ...amounts, [m.user_id]: e.target.value })}
                    className="w-20 rounded-xl border border-line px-2 py-2 text-xs"
                  />
                  <button
                    className={btn}
                    disabled={busy || !Number.isInteger(Number(amounts[m.user_id])) || Number(amounts[m.user_id]) === 0}
                    onClick={async () => {
                      if (await grant(m, Number(amounts[m.user_id]))) setAmounts({ ...amounts, [m.user_id]: "" });
                    }}
                  >
                    Registar
                  </button>
                </div>
              )}
              {isAdmin && !m.is_admin && m.user_id !== selfId && (
                <div className="mt-2 flex gap-2">
                  <button className={btnGhost} disabled={busy} onClick={() => setTreasurer(m, !m.is_treasurer)}>
                    {m.is_treasurer ? "Tirar tesoureiro" : "Nomear tesoureiro"}
                  </button>
                  <button className={btnGhost} disabled={busy} onClick={() => setStatus(m, m.status === "active" ? "suspended" : "active")}>
                    {m.status === "active" ? "Suspender" : "Reativar"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {isAdmin && <p className="mt-3 text-[11px] text-ink/50">Para corrigir um engano, usa um valor negativo (ex: -2) no campo «outro».</p>}
      </section>

      {isAdmin && (
        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Jornada</h2>
          {!round ? (
            <>
              <p className="mt-1 text-xs text-ink/60">
                Cola os jogos, um por linha: data, hora e equipas. Ex.: <code>2026-10-17 15:00 Leões Valboenses - Rebordosa</code>
              </p>
              <textarea
                value={fixtureText}
                onChange={(e) => setFixtureText(e.target.value)}
                rows={7}
                className={`${input} mt-2 font-mono text-xs`}
                placeholder={"2026-10-17 15:00 Casa - Fora\n2026-10-17 15:00 Casa - Fora"}
              />
              <button className={`${btn} mt-2`} disabled={busy || !fixtureText.trim()} onClick={createRound}>Abrir jornada</button>
              <p className="mt-2 text-[11px] text-ink/50">Os palpites fecham sozinhos à hora do primeiro jogo. Entre 2 e 13 jogos.</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm">
                Jornada {round.number} · {ticketCount} {ticketCount === 1 ? "boletim" : "boletins"}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {fixtures.map((f) => {
                  const started = Date.now() >= new Date(f.kickoff).getTime();
                  return (
                    <li key={f.id} className="rounded-xl border border-line p-3 text-sm">
                      <p className="text-[11px] text-ink/50">{fmtKickoff(f.kickoff)}</p>
                      <p className="font-semibold">{f.home} – {f.away}</p>
                      {started ? (
                        <div className="mt-2 flex gap-2">
                          {(["1", "X", "2"] as const).map((o) => (
                            <button
                              key={o}
                              disabled={busy}
                              aria-pressed={f.result === o}
                              onClick={() => run(() => sb().rpc("pal_set_result", { p_fixture: f.id, p_result: o }), "Resultado guardado.")}
                              className={`flex-1 rounded-lg py-2 text-sm font-semibold ${f.result === o ? "bg-blue text-white" : "border border-line bg-bg"}`}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-[11px] text-ink/50">Ainda não começou: o resultado só se regista depois.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
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
              {!allResults && <p className="mt-2 text-[11px] text-ink/50">Registar todos os resultados para poder apurar.</p>}
            </>
          )}
        </section>
      )}

      {isAdmin && (
        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Regras do grupo</h2>
          <p className="mt-1 text-xs text-ink/60">Tudo definido por vocês. Só mudam entre jornadas, quando não há palpites feitos.</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            {[
              ["fino_value", "Valor de 1 fino (€, opcional)"],
              ["limit", "Limite de finos por jogador e jornada"],
              ["p1", "% do bolo para o 1.º prémio"],
              ["p2", "% do bolo para o 2.º prémio"],
              ["cap", "Teto do acumulado (finos, opcional)"],
            ].map(([key, label]) => (
              <label key={key} className="flex flex-col gap-1 font-semibold text-ink/70">
                {label}
                <input
                  inputMode="decimal"
                  value={settings[key as keyof typeof settings]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className={input}
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink/50">O que sobra do bolo vai para a caixa do clube. Se ninguém acertar, o prémio acumula para a jornada seguinte.</p>
          <button className={`${btn} mt-3`} disabled={busy} onClick={saveSettings}>Guardar regras</button>
        </section>
      )}
    </div>
  );
}
