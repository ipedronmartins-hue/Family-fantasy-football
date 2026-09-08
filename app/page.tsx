import Link from "next/link";
import { getNextFixture, getFixtures } from "@/db/queries/fixtures";
import { getRoster } from "@/db/queries/players";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const [nextMatch, fixtures, roster] = await Promise.all([
    getNextFixture(),
    getFixtures(),
    getRoster(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Gondomar SC · Sub-13 · Futebol de 11</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Época 2026/27</h1>
        <p className="mt-2 text-sm text-white/80">{fixtures[0]?.competition}</p>
      </header>

      <main className="flex-1 space-y-4 px-5 pt-6">
        <div>
          <p className="mb-2 text-xs font-semibold text-ink/60">
            PRÓXIMO JOGO · {nextMatch.id.replace("J", "JORNADA ")}
          </p>
          <MatchCard match={nextMatch} />
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-semibold text-ink/60">A TUA FANTASY</p>
          <p className="mt-2 text-sm text-ink/60">
            Ainda sem conta ligada — a tua equipa Fantasy aparece aqui assim que os pais
            puderem entrar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-white p-4 text-center">
            <p className="font-display text-2xl font-bold text-ink">{fixtures.length}</p>
            <p className="text-xs text-ink/60">jornadas</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 text-center">
            <p className="font-display text-2xl font-bold text-ink">{roster.length}</p>
            <p className="text-xs text-ink/60">atletas no plantel</p>
          </div>
        </div>

        <Link
          href="/plantel"
          className="block rounded-2xl border border-line bg-white p-4 text-center text-sm font-semibold text-blue"
        >
          Ver plantel completo →
        </Link>
      </main>
    </div>
  );
}
