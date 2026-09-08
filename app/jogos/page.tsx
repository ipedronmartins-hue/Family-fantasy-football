import { getFixtures } from "@/db/queries/fixtures";
import { JogosClient } from "@/components/JogosClient";

export const dynamic = "force-dynamic";

export default async function JogosPage() {
  const fixtures = await getFixtures();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Gondomar SC · Sub-13 · 2026/27</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Calendário</h1>
        <p className="mt-2 text-sm text-white/80">
          {fixtures[0]?.competition} · {fixtures.length} jornadas
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <JogosClient fixtures={fixtures} />
      </main>
    </div>
  );
}
