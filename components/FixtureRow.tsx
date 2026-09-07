import Link from "next/link";
import { Match } from "@/types/match";
import { formatMatchDate } from "@/lib/format";

export function FixtureRow({ match }: { match: Match }) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <span className="shrink-0 rounded-lg bg-amber/20 px-2.5 py-2 text-xs font-semibold text-ink">
        {match.matchday}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {match.home ? "Gondomar SC" : match.opponent} vs{" "}
          {match.home ? match.opponent : "Gondomar SC"}
          {match.featured ? " · 🔥" : ""}
        </p>
        <p className="text-xs text-ink/50">
          {formatMatchDate(match.date)} · {match.home ? "Casa" : "Fora"}
        </p>
      </div>
      <Link
        href={`/prever?jornada=${match.id}`}
        className="shrink-0 rounded-lg bg-pitch/10 px-3 py-2 text-xs font-semibold text-pitch"
      >
        Prever
      </Link>
    </div>
  );
}
