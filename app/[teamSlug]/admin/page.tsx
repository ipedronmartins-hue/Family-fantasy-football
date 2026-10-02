import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatMatchDate } from "@/lib/format";
import { FixedCostButton } from "@/components/FixedCostButton";
import { SITE_URL } from "@/lib/site";

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

  const [{ count: playerCount }, { count: parentCount }, { count: pendingCount }] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }).eq("season_id", team.seasonId),
    supabase.from("parents").select("id", { count: "exact", head: true }).eq("season_id", team.seasonId),
    supabase
      .from("parents")
      .select("id", { count: "exact", head: true })
      .eq("season_id", team.seasonId)
      .eq("status", "pending"),
  ]);

  const steps = [
    { done: (playerCount ?? 0) > 0, label: "Preencher o plantel", href: `${base}/admin/importar` },
    { done: (matches?.length ?? 0) > 0, label: "Publicar o calendário", href: `${base}/admin/importar` },
    { done: (parentCount ?? 0) > 1, label: "Convidar os pais", href: null },
  ];
  const setupDone = steps.every((s) => s.done);
  const inviteText = `Olá! Já está aberto o Family Fantasy Formação do ${homeTeamName} ⚽\n\nCria a tua conta aqui: ${SITE_URL}/${teamSlug}\n\nDepois de criares a tua equipa, eu aprovo o teu acesso.`;
  const inviteHref = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Admin · {team.teamName}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Jornadas</h1>
      </header>

      <main className="flex-1 px-5 pt-6">
        {!setupDone && (
          <div className="mb-4 rounded-2xl border border-gold bg-gold/10 p-4">
            <p className="text-sm font-semibold text-ink">🚀 Para arrancar a equipa</p>
            <ol className="mt-2 space-y-1.5">
              {steps.map((s, i) => (
                <li key={s.label} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      s.done ? "bg-blue text-white" : "bg-white text-ink/60"
                    }`}
                  >
                    {s.done ? "✓" : i + 1}
                  </span>
                  {s.href && !s.done ? (
                    <Link href={s.href} className="font-semibold text-blue underline">
                      {s.label}
                    </Link>
                  ) : (
                    <span className={s.done ? "text-ink/50 line-through" : "text-ink"}>{s.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        <a
          href={inviteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 block rounded-2xl bg-[#25D366] p-4 text-center text-sm font-semibold text-white"
        >
          💬 Convidar pais por WhatsApp
        </a>

        <Link
          href={`${base}/admin/pais`}
          className="mb-4 block rounded-2xl border border-blue bg-blue/5 p-4 text-center text-sm font-semibold text-blue"
        >
          👨‍👩‍👧 Pais — aprovar e gerir acessos{(pendingCount ?? 0) > 0 ? ` · ${pendingCount} por aprovar` : ""} →
        </Link>

        <Link
          href={`${base}/admin/importar`}
          className="mb-4 block rounded-2xl border border-blue bg-blue/5 p-4 text-center text-sm font-semibold text-blue"
        >
          📋 Importar plantel e calendário de uma vez →
        </Link>

        <Link
          href={`${base}/admin/patrocinio`}
          className="mb-4 block rounded-2xl border border-gold bg-gold/10 p-4 text-center text-sm font-semibold text-ink"
        >
          🤝 Patrocinador da equipa →
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
