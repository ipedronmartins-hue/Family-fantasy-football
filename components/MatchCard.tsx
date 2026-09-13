import Link from "next/link";
import { Match } from "@/types/match";
import { formatMatchDate } from "@/lib/format";

export function MatchCard({
  match,
  teamSlug,
  homeTeamName,
  showPredictLink = true,
}: {
  match: Match;
  teamSlug: string;
  homeTeamName: string;
  showPredictLink?: boolean;
}) {
  const homeTeam = match.home ? homeTeamName : match.opponent;
  const awayTeam = match.home ? match.opponent : homeTeamName;

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-medium text-blue">
        {match.status === "live" ? (
          <span className="text-red">🔴 AO VIVO</span>
        ) : match.competition === "Amigável" ? (
          "Jogo Amigável"
        ) : (
          match.code.replace("J", "Jornada ")
        )}{" "}
        {match.featured ? "· 🔥" : ""}
      </p>
      <h3 className="mt-1 font-display text-lg font-semibold text-ink">
        {homeTeam} vs {awayTeam}
      </h3>
      {match.status === "live" || match.status === "finished" ? (
        <p className="mt-1 font-display text-2xl font-bold text-ink">
          {match.homeGoals ?? 0} - {match.awayGoals ?? 0}
        </p>
      ) : (
        <p className="mt-1 text-sm text-ink/60">
          {formatMatchDate(match.date)} · {match.home ? "Casa" : "Fora"}
        </p>
      )}
      {showPredictLink && (
        <Link
          href={
            match.status === "scheduled"
              ? `/${teamSlug}/prever?jornada=${match.code}`
              : `/${teamSlug}/jogos/${match.code}`
          }
          className={`mt-3 block rounded-xl py-2.5 text-center text-sm font-semibold ${
            match.status === "live" ? "bg-red text-white" : "bg-blue text-white"
          }`}
        >
          {match.status === "scheduled" ? "Fazer previsão" : match.status === "live" ? "Ver ao vivo" : "Ver jogo"}
        </Link>
      )}
    </div>
  );
}
