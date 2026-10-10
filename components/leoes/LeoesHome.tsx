"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import {
  OPTIONS,
  fmtEuro,
  fmtFinos,
  fmtKickoff,
  palError,
  slipCost,
  type PalFixture,
  type PalGroup,
  type PalLeaderRow,
  type PalRound,
  type PalSummary,
  type PalTicket,
} from "@/lib/palpites";

interface RoundData {
  round: PalRound;
  fixtures: PalFixture[];
  tickets: PalTicket[];
  summary: PalSummary | null;
}

interface Props {
  group: PalGroup;
  member: { displayName: string; isAdmin: boolean; isTreasurer: boolean };
  balance: number;
  current: RoundData | null;
  previous: RoundData | null;
  leaderboard: PalLeaderRow[];
  userId: string;
}

function Money({ finos, value }: { finos: number; value: number | null }) {
  return (
    <>
      {fmtFinos(finos)} {finos === 1 ? "fino" : "finos"}
      {value ? <span className="text-ink/50"> ({fmtEuro(finos * value)})</span> : null}
    </>
  );
}

export default function LeoesHome({ group, member, balance, current, previous, leaderboard, userId }: Props) {
  const router = useRouter();
  const fixtures = current?.fixtures ?? [];
  const [picks, setPicks] = useState<string[][]>(() => fixtures.map(() => []));
  const [superHome, setSuperHome] = useState("");
  const [superAway, setSuperAway] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const cost = useMemo(() => slipCost(picks), [picks]);
  const superId = current?.round.super_fixture_id ?? null;
  const superFix = superId ? fixtures.find((f) => f.id === superId) ?? null : null;
  const superOk = !superId || (/^\d{1,2}$/.test(superHome) && /^\d{1,2}$/.test(superAway));
  const used = (current?.tickets ?? []).reduce((a, t) => a + t.cost, 0);
  const closed = !current || current.round.status === "settled" || current.round.bets_closed_at !== null;
  const limitLeft = group.member_limit === null ? null : group.member_limit - used;

  function toggle(i: number, opt: string) {
    setOkMsg(null);
    setPicks((prev) =>
      prev.map((p, idx) => (idx !== i ? p : p.includes(opt) ? p.filter((o) => o !== opt) : [...p, opt]))
    );
  }

  async function place() {
    if (!current) return;
    setBusy(true);
    setError(null);
    setOkMsg(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("pal_place_bet", {
      p_round: current.round.id,
      p_picks: picks,
      p_super_home: superId ? Number(superHome) : null,
      p_super_away: superId ? Number(superAway) : null,
    });
    setBusy(false);
    if (error) {
      setError(palError(error.message));
      return;
    }
    setPicks(fixtures.map(() => []));
    setSuperHome("");
    setSuperAway("");
    setOkMsg("Boletim registado. Boa sorte!");
    router.refresh();
  }

  const cantAfford = cost > balance;
  const overLimit = limitLeft !== null && cost > limitLeft;
  const s = current?.summary;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-12 pt-6">
      <div className="flex items-center justify-between">
        <Link href="/clubes" className="text-xs font-semibold text-blue">← Clubes</Link>
        {(member.isAdmin || member.isTreasurer) && (
          <Link href="/leoes/admin" className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-blue">
            {member.isAdmin ? "Administrar" : "Tesouraria"}
          </Link>
        )}
      </div>

      <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Palpites dos Leões</h1>
      <p className="text-sm text-ink/60">Olá, {member.displayName}</p>

      <div className="mt-4 rounded-2xl border border-line bg-white p-4">
        <p className="text-xs font-semibold text-ink/60">OS TEUS FINOS</p>
        <p className="font-display text-3xl font-semibold text-blue">{fmtFinos(balance)}</p>
        <p className="mt-1 text-xs text-ink/60">
          Os finos são dados pelo tesoureiro do clube quando pagas a tua parte. A app não recebe dinheiro.
          {group.fino_value ? ` Cada fino vale ${fmtEuro(group.fino_value)}.` : ""}
        </p>
      </div>

      {current ? (
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Jornada {current.round.number}</h2>
            <span className={`text-xs font-semibold ${closed ? "text-red" : "text-[#128C7E]"}`}>
              {closed ? "Fechada" : "Aberta · o capitão fecha os palpites"}
            </span>
          </div>

          {s && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-white p-3 border border-line">
                <p className="text-[11px] font-semibold text-ink/60">
                  PRÉMIO ({fixtures.length} certos{superId ? " + Super 7" : ""})
                </p>
                <p className="font-semibold"><Money finos={s.prize1} value={group.fino_value} /></p>
                {s.carry_in > 0 && <p className="text-[11px] text-ink/60">inclui {fmtFinos(s.carry_in)} acumulados</p>}
              </div>
              <div className="col-span-2 rounded-xl bg-white p-3 border border-line text-xs text-ink/70">
                {s.tickets} {s.tickets === 1 ? "boletim" : "boletins"} · {fmtFinos(s.pot)} finos em jogo · {fmtFinos(s.caixa)} para a caixa do clube
              </div>
            </div>
          )}

          {!closed && (
            <>
              <div className="mt-4 flex flex-col gap-2">
                {fixtures.map((f, i) => (
                  <div key={f.id} className="rounded-xl border border-line bg-white p-3">
                    <p className="text-[11px] text-ink/50">{fmtKickoff(f.kickoff)}</p>
                    <p className="text-sm font-semibold">
                      {f.home} – {f.away}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {OPTIONS.map((o) => {
                        const on = picks[i]?.includes(o);
                        return (
                          <button
                            key={o}
                            type="button"
                            onClick={() => toggle(i, o)}
                            aria-pressed={on}
                            className={`rounded-lg py-2.5 text-sm font-semibold ${
                              on ? "bg-blue text-white" : "border border-line bg-bg text-ink"
                            }`}
                          >
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {superFix && (
                <div className="mt-2 rounded-xl border-2 border-gold bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-ink">SUPER 7</span>
                    <span className="text-[11px] text-ink/50">resultado exato · {fmtKickoff(superFix.kickoff)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{superFix.home} – {superFix.away}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      maxLength={2}
                      value={superHome}
                      onChange={(e) => setSuperHome(e.target.value.replace(/\D/g, ""))}
                      aria-label={`Golos ${superFix.home}`}
                      className="w-16 rounded-xl border border-line px-2 py-2.5 text-center text-lg font-semibold"
                    />
                    <span className="font-semibold">–</span>
                    <input
                      inputMode="numeric"
                      maxLength={2}
                      value={superAway}
                      onChange={(e) => setSuperAway(e.target.value.replace(/\D/g, ""))}
                      aria-label={`Golos ${superFix.away}`}
                      className="w-16 rounded-xl border border-line px-2 py-2.5 text-center text-lg font-semibold"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-ink/50">Faz parte do boletim, sem custo extra: o prémio é de quem acertar em tudo, incluindo o Super 7.</p>
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-line bg-white p-4">
                <p className="text-sm">
                  Este boletim custa <span className="font-semibold">{cost > 0 ? `${fmtFinos(cost)} finos` : "—"}</span>
                  {cost > 1 && <span className="text-ink/60"> (apostas múltiplas multiplicam)</span>}
                </p>
                {limitLeft !== null && (
                  <p className="mt-1 text-xs text-ink/60">Limite por jornada: ainda podes usar {fmtFinos(Math.max(0, limitLeft))} finos.</p>
                )}
                <button
                  type="button"
                  onClick={place}
                  disabled={busy || cost === 0 || cantAfford || overLimit || !superOk}
                  className="mt-3 w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "A registar…" : "Registar boletim"}
                </button>
                {cost > 0 && cantAfford && <p className="mt-2 text-xs text-red">Não tens finos suficientes. Fala com o tesoureiro.</p>}
                {cost > 0 && !cantAfford && overLimit && <p className="mt-2 text-xs text-red">Passavas o limite por jornada.</p>}
                {cost === 0 && <p className="mt-2 text-xs text-ink/60">Marca pelo menos uma opção em cada jogo.</p>}
                {cost > 0 && !superOk && <p className="mt-2 text-xs text-ink/60">Falta o resultado do Super 7 (golos das duas equipas).</p>}
                {error && <p className="mt-2 text-xs text-red">{error}</p>}
                {okMsg && <p className="mt-2 text-xs text-[#128C7E]">{okMsg}</p>}
              </div>
            </>
          )}

          {closed && (
            <p className="mt-4 rounded-xl border border-line bg-white p-3 text-sm text-ink/70">
              Os palpites desta jornada já foram fechados. Os resultados e prémios aparecem quando o capitão apurar a jornada.
            </p>
          )}

          <TicketList tickets={current.tickets} fixtures={fixtures} title="Os teus boletins" superId={superId} />
        </section>
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-white p-4 text-sm text-ink/70">
          Ainda não há jornada aberta. O capitão publica a próxima em breve.
        </p>
      )}

      {previous && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Jornada {previous.round.number} · apurada</h2>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white text-sm">
            {previous.fixtures.map((f) => (
              <li key={f.id} className="flex items-center justify-between px-3 py-2">
                <span>{f.home} – {f.away}</span>
                <span className="font-display text-base font-semibold text-blue">
                  {f.id === previous.round.super_fixture_id && f.score_home !== null
                    ? `${f.score_home}-${f.score_away}`
                    : f.result}
                </span>
              </li>
            ))}
          </ul>
          {previous.summary && (
            <p className="mt-2 text-xs text-ink/60">
              {previous.summary.carry_out && previous.summary.carry_out > 0
                ? `Sem vencedor num prémio: ${fmtFinos(previous.summary.carry_out)} finos acumulam para a jornada seguinte.`
                : "Prémios entregues."}
            </p>
          )}
          <TicketList tickets={previous.tickets} fixtures={previous.fixtures} title="Os teus boletins" superId={previous.round.super_fixture_id} />
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink">Ranking da época</h2>
        {leaderboard.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">O ranking aparece depois da primeira jornada apurada.</p>
        ) : (
          <ol className="mt-2 divide-y divide-line rounded-xl border border-line bg-white text-sm">
            {leaderboard.map((r, i) => (
              <li key={r.user_id} className={`flex items-center justify-between px-3 py-2 ${r.user_id === userId ? "bg-gold/10" : ""}`}>
                <span>
                  <span className="mr-2 text-ink/40">{i + 1}.</span>
                  {r.display_name}
                </span>
                <span className="text-xs text-ink/70">
                  {r.total_hits} certos · melhor {r.best_hits}
                  {Number(r.total_prize) > 0 ? ` · ${fmtFinos(Number(r.total_prize))} finos` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="mt-8 text-center text-[11px] text-ink/40">
        Jogo de grupo fechado, para animar o balneário. Os finos acertam-se entre vocês e o tesoureiro do clube.
      </p>
    </div>
  );
}

function TicketList({ tickets, fixtures, title, superId }: { tickets: PalTicket[]; fixtures: PalFixture[]; title: string; superId: string | null }) {
  if (tickets.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold text-ink/60">{title.toUpperCase()}</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {tickets.map((t) => (
          <li key={t.id} className="rounded-xl border border-line bg-white p-3 text-xs">
            <div className="flex justify-between font-semibold">
              <span>{fmtFinos(t.cost)} {t.cost === 1 ? "fino" : "finos"}</span>
              {t.settled && (
                <span className={t.prize > 0 ? "text-[#128C7E]" : "text-ink/50"}>
                  {t.best_hits} certos{superId ? " (com Super 7)" : ""}{t.prize > 0 ? ` · ganhou ${fmtFinos(t.prize)}` : ""}
                </span>
              )}
            </div>
            <p className="mt-1 break-words text-ink/70">
              {t.picks.map((p, i) => `${fixtures[i]?.position ?? i + 1}:${p.join("")}`).join("  ")}
            </p>
            {t.super_home !== null && t.super_away !== null && (
              <p className="mt-1 text-ink/70">
                Super 7: {t.super_home}-{t.super_away}
                {t.settled && t.super_hit !== null ? (t.super_hit ? " ✓" : " ✗") : ""}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
