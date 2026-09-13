import { getFixtures } from "@/db/queries/fixtures";
import { getTeamBySlug } from "@/lib/team";
import { JogosClient } from "@/components/JogosClient";

export const dynamic = "force-dynamic";

export default async function JogosPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const team = await getTeamBySlug(teamSlug);
  const fixtures = await getFixtures(team.seasonId);
  const homeTeamName = `${team.clubName} ${team.teamName}`;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">{team.clubName} · {team.teamName} · {team.seasonLabel}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Calendário</h1>
        <p className="mt-2 text-sm text-white/80">
          {fixtures[0]?.competition} · {fixtures.length} jornadas
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <JogosClient fixtures={fixtures} teamSlug={teamSlug} homeTeamName={homeTeamName} />
      </main>
    </div>
  );
}
