import { getRoster } from "@/db/queries/players";
import { groupRosterByPosition } from "@/lib/roster";
import { SquadSection } from "@/components/SquadSection";

export const dynamic = "force-dynamic";

export default async function PlantelPage() {
  const roster = await getRoster();
  const sections = groupRosterByPosition(roster);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Gondomar SC · Sub-13 · 2026/27</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Plantel</h1>
        <p className="mt-2 text-sm text-white/80">
          {roster.length} atletas convocáveis para o Family Fantasy Soccer.
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
