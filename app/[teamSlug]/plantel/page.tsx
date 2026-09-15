import { redirect } from "next/navigation";
import { getRoster } from "@/db/queries/players";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { groupRosterByPosition } from "@/lib/roster";
import { SquadSection } from "@/components/SquadSection";

export const dynamic = "force-dynamic";

export default async function PlantelPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const parent = await getCurrentParent();
  if (parent === null) redirect(`/login?team=${teamSlug}`);
  if (parent === "onboarding") redirect(`/${teamSlug}/onboarding`);

  const team = await getTeamBySlug(teamSlug);
  const roster = await getRoster(team.seasonId);
  const sections = groupRosterByPosition(roster);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">
          {team.clubName} · {team.teamName} · {team.seasonLabel}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Plantel</h1>
        <p className="mt-2 text-sm text-white/80">
          {roster.length} atletas convocáveis para o Family Fantasy Formação.
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        {sections.map(({ group, players }) => (
          <SquadSection key={group} group={group} players={players} />
        ))}
      </main>
    </div>
  );
}
