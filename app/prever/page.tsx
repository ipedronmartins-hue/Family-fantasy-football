import { getNextFixture, getFixtureById } from "@/db/seed/fixtures";
import { roster } from "@/db/seed/roster";
import { formatMatchDate } from "@/lib/format";
import { PredictionForm } from "@/components/PredictionForm";

export default async function PreverPage({
  searchParams,
}: {
  searchParams: Promise<{ jornada?: string }>;
}) {
  const { jornada } = await searchParams;
  const match = (jornada && getFixtureById(jornada)) || getNextFixture();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Previsão · {match.id.replace("J", "Jornada ")}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          {match.home ? "Gondomar SC" : match.opponent} vs{" "}
          {match.home ? match.opponent : "Gondomar SC"}
        </h1>
        <p className="mt-2 text-sm text-white/80">
          {formatMatchDate(match.date)} · {match.home ? "Casa" : "Fora"}
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <PredictionForm match={match} players={roster} />
      </main>
    </div>
  );
}
