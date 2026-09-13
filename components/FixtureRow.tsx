import Link from "next/link";
import { Match } from "@/types/match";
import { formatMatchDate } from "@/lib/format";

export function FixtureRow({
  match,
  teamSlug,
  homeTeamName,
}: {
  match: Match;
  teamSlug: string;
  homeTeamName: string;
}) {
  const played = match.homeGoals != null && match.awayGoals != null;
  const friendly = match.competition === "Amigável";

  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <span
        className={`shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold ${
          match.featured ? "bg-red/10 text-red" : friendly ? "bg-blue/10 text-blue" : "bg-gold/20 text-ink"
        }`}
      >
        {friendly ? "Ami." : match.matchday}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {match.home ? homeTeamName : match.opponent} vs{" "}
          {match.home ? match.opponent : homeTeamName}
          {match.featured ? " · 🔥" : ""}
        </p>
        <p className="text-xs text-ink/50">
          {played
            ? `${match.homeGoals}-${match.awayGoals}`
            : `${formatMatchDate(match.date)} · ${match.home ? "Casa" : "Fora"}`}
        </p>
      </div>
      <Link
        href={played ? `/${teamSlug}/jogos/${match.code}` : `/${teamSlug}/prever?jornada=${match.code}`}
        className="shrink-0 rounded-lg bg-blue/10 px-3 py-2 text-xs font-semibold text-blue"
      >
        {played ? "Ver jogo" : "Prever"}
      </Link>
    </div>
  );
}
