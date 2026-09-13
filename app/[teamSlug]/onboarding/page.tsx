import { getTeamBySlug } from "@/lib/team";
import { OnboardingForm } from "@/components/OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const team = await getTeamBySlug(teamSlug);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-20">
      <p className="text-sm text-blue">Quase lá</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Cria a tua equipa</h1>
      <p className="mt-2 text-sm text-ink/60">
        Isto cria o teu perfil e a tua equipa Fantasy para a época {team.seasonLabel}.
      </p>
      <OnboardingForm teamSlug={teamSlug} seasonId={team.seasonId} />
    </div>
  );
}
