import { getTeamBySlug } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function SuspensoPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const team = await getTeamBySlug(teamSlug);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 pb-20 text-center">
      <span className="text-4xl">🔒</span>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Acesso suspenso</h1>
      <p className="mt-2 text-sm text-ink/60">
        O administrador de {team.clubName} {team.teamName} suspendeu o teu acesso, normalmente
        por falta de contributo mensal. Fala com o administrador da equipa para resolver.
      </p>
    </div>
  );
}
