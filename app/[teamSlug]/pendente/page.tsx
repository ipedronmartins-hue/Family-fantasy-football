import { getTeamBySlug } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function PendentePage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const team = await getTeamBySlug(teamSlug);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 pb-20 text-center">
      <span className="text-4xl">⏳</span>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">A aguardar aprovação</h1>
      <p className="mt-2 text-sm text-ink/60">
        A tua conta foi criada com sucesso. O administrador de {team.clubName} {team.teamName}{" "}
        precisa de aprovar o teu acesso antes de continuares — normalmente depois de
        confirmado o contributo mensal.
      </p>
      <p className="mt-4 text-xs text-ink/50">
        Já falaste com o administrador da equipa? Se sim, é só questão de tempo.
      </p>
    </div>
  );
}
