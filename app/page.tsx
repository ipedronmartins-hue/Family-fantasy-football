import Link from "next/link";
import { getNextFixture, getFixtures } from "@/db/queries/fixtures";
import { getRoster } from "@/db/queries/players";
import { getCurrentParent } from "@/lib/auth";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const [nextMatch, fixtures, roster, parent] = await Promise.all([
    getNextFixture(),
    getFixtures(),
    getRoster(),
    getCurrentParent(),
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
            PRÓXIMO JOGO · {nextMatch.code.replace("J", "JORNADA ")}
          </p>
          <MatchCard match={nextMatch} />
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          {parent && parent !== "onboarding" ? (
            <>
              <p className="text-xs font-semibold text-ink/60">A TUA FANTASY</p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">
                {parent.fantasyTeamName}
              </p>
              <Link href="/equipa" className="mt-2 inline-block text-sm font-semibold text-blue">
                Gerir a minha equipa →
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-ink/60">A TUA FANTASY</p>
              <p className="mt-2 text-sm text-ink/60">
                Ainda sem conta — entra para criares a tua equipa Fantasy.
              </p>
              <Link href="/login" className="mt-2 inline-block text-sm font-semibold text-blue">
                Entrar →
              </Link>
            </>
          )}
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

        <Link
          href="/fundo"
          className="block rounded-2xl border border-line bg-white p-4 text-center text-sm font-semibold text-blue"
        >
          💰 Fundo da Equipa →
        </Link>

        {parent && parent !== "onboarding" && parent.isAdmin && (
          <Link
            href="/admin"
            className="block rounded-2xl border border-gold bg-gold/10 p-4 text-center text-sm font-semibold text-ink"
          >
            ⚙️ Administração →
          </Link>
        )}
      </main>
    </div>
  );
}
