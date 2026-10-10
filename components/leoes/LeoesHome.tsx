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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const cost = useMemo(() => slipCost(picks), [picks]);
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
    const { error } = await supabase.rpc("pal_place_ticket", { p_round: current.round.id, p_picks: picks });
    setBusy(false);
    if (error) {
      setError(palError(error.message));
      return;
    }
    setPicks(fixtures.map(() => []));
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
                <p className="text-[11px] font-semibold text-ink/60">1.º PRÉMIO (6 certos)</p>
                <p className="font-semibold"><Money finos={s.prize1} value={group.fino_value} /></p>
                {s.carry_in > 0 && <p className="text-[11px] text-ink/60">inclui {fmtFinos(s.carry_in)} acumulados</p>}
              </div>
              <div className="rounded-xl bg-white p-3 border border-line">
                <p className="text-[11px] font-semibold text-ink/60">2.º PRÉMIO (1 errado)</p>
                <p className="font-semibold"><Money finos={s.prize2} value={group.fino_value} /></p>
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
                    <p className="text-sm font-semibold">{f.home} – {f.away}</p>
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
                  disabled={busy || cost === 0 || cantAfford || overLimit}
                  className="mt-3 w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "A registar…" : "Registar boletim"}
                </button>
                {cost > 0 && cantAfford && <p className="mt-2 text-xs text-red">Não tens finos suficientes. Fala com o tesoureiro.</p>}
                {cost > 0 && !cantAfford && overLimit && <p className="mt-2 text-xs text-red">Passavas o limite por jornada.</p>}
                {cost === 0 && <p className="mt-2 text-xs text-ink/60">Marca pelo menos uma opção em cada jogo.</p>}
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

          <TicketList tickets={current.tickets} fixtures={fixtures} title="Os teus boletins" />
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
                <span className="font-display text-base font-semibold text-blue">{f.result}</span>
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
          <TicketList tickets={previous.tickets} fixtures={previous.fixtures} title="Os teus boletins" />
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

function TicketList({ tickets, fixtures, title }: { tickets: PalTicket[]; fixtures: PalFixture[]; title: string }) {
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
                  {t.best_hits} certos{t.prize > 0 ? ` · ganhou ${fmtFinos(t.prize)}` : ""}
                </span>
              )}
            </div>
            <p className="mt-1 break-words text-ink/70">
              {t.picks.map((p, i) => `${fixtures[i]?.position ?? i + 1}:${p.join("")}`).join("  ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
