import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatMatchDate } from "@/lib/format";
import { FixedCostButton } from "@/components/FixedCostButton";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const base = `/${teamSlug}`;
  const parent = await getCurrentParent();
  if (parent === null) redirect(`/login?team=${teamSlug}`);
  if (parent === "onboarding") redirect(`${base}/onboarding`);
  if (parent === "pending") redirect(`${base}/pendente`);
  if (parent === "suspended") redirect(`${base}/suspenso`);
  if (!parent.isAdmin) redirect(base);

  const team = await getTeamBySlug(teamSlug);
  const homeTeamName = `${team.clubName} ${team.teamName}`;

  const supabase = await createServerSupabase();
  const { data: matches } = await supabase
    .from("matches")
    .select("id, matchday, opponent, home, kickoff_at, home_goals, away_goals, locked_at")
    .eq("season_id", team.seasonId)
    .order("kickoff_at");

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Admin · {team.teamName}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Jornadas</h1>
      </header>

      <main className="flex-1 px-5 pt-6">
        <Link
          href={`${base}/admin/pais`}
          className="mb-4 block rounded-2xl border border-blue bg-blue/5 p-4 text-center text-sm font-semibold text-blue"
        >
          👨‍👩‍👧 Pais — aprovar e gerir acessos →
        </Link>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <Link
            href={`${base}/admin/pagamentos`}
            className="block rounded-2xl border border-gold bg-gold/10 p-4 text-center text-sm font-semibold text-ink"
          >
            💳 Contributos do mês →
          </Link>
          <FixedCostButton seasonId={team.seasonId} />
        </div>

        <Link
          href={`${base}/admin/pontuacao`}
          className="mb-4 block rounded-2xl border border-line bg-white p-4 text-center text-sm font-semibold text-blue"
        >
          🎯 Regras de pontuação →
        </Link>

        <Link
          href={`${base}/admin/novo-jogo`}
          className="mb-4 block rounded-2xl border border-blue bg-blue/5 p-4 text-center text-sm font-semibold text-blue"
        >
          ➕ Adicionar jogo amigável →
        </Link>

        <Link
          href={`${base}/admin/novo-jogador`}
          className="mb-4 block rounded-2xl border border-blue bg-blue/5 p-4 text-center text-sm font-semibold text-blue"
        >
          👤 Adicionar jogador →
        </Link>

        <ul className="rounded-2xl border border-line bg-white px-4">
          {(matches ?? []).map((m) => {
            const played = m.home_goals !== null && m.away_goals !== null;
            const locked = !!m.locked_at && new Date(m.locked_at) <= new Date();
            return (
              <li key={m.id} className="border-b border-line py-3 last:border-b-0">
                <Link href={`${base}/admin/J${m.matchday}`} className="flex items-center gap-3">
                  <span className="shrink-0 rounded-lg bg-gold/20 px-2.5 py-2 text-xs font-semibold text-ink">
                    {m.matchday}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {m.home ? homeTeamName : m.opponent} vs {m.home ? m.opponent : homeTeamName}
                    </p>
                    <p className="text-xs text-ink/50">
                      {formatMatchDate(m.kickoff_at.slice(0, 10))} · {locked ? "🔒 fechada" : "🔓 aberta"}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${played ? "text-blue" : "text-ink/30"}`}>
                    {played ? `${m.home_goals}-${m.away_goals}` : "por jogar"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
