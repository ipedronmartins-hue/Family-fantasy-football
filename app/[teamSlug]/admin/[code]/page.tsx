import { redirect, notFound } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { createServerSupabase } from "@/lib/supabase/server";
import { getRoster } from "@/db/queries/players";
import { isPredictionLocked } from "@/lib/deadline";
import { AdminMatchForm } from "@/components/AdminMatchForm";

export const dynamic = "force-dynamic";

export default async function AdminMatchPage({
  params,
}: {
  params: Promise<{ teamSlug: string; code: string }>;
}) {
  const { teamSlug, code } = await params;
  const base = `/${teamSlug}`;
  const matchday = Number(code.replace("J", ""));

  const [parent, team] = await Promise.all([getCurrentParent(), getTeamBySlug(teamSlug)]);
  if (parent === null) redirect(`/login?team=${teamSlug}`);
  if (parent === "onboarding") redirect(`${base}/onboarding`);
  if (!parent.isAdmin) redirect(base);

  const supabase = await createServerSupabase();
  const [{ data: match }, roster] = await Promise.all([
    supabase
      .from("matches")
      .select("id, matchday, opponent, home, kickoff_at, home_goals, away_goals, man_of_the_match_id, locked_at, status")
      .eq("season_id", team.seasonId)
      .eq("matchday", matchday)
      .maybeSingle(),
    getRoster(team.seasonId),
  ]);

  if (!match) notFound();

  const [{ data: goals }, { data: realLineup }, { count: totalTeams }, { count: submittedCount }] =
    await Promise.all([
      supabase.from("match_goals").select("id, scorer_id, assist_id").eq("match_id", match.id),
      supabase.from("match_lineups").select("player_id").eq("match_id", match.id),
      supabase
        .from("fantasy_teams")
        .select("id", { count: "exact", head: true })
        .eq("season_id", team.seasonId),
      supabase
        .from("predictions")
        .select("id", { count: "exact", head: true })
        .eq("match_id", match.id),
    ]);

  const locked = isPredictionLocked(match.kickoff_at, match.locked_at);
  const homeTeamName = `${team.clubName} ${team.teamName}`;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Admin · Jornada {match.matchday}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          {match.home ? homeTeamName : match.opponent} vs{" "}
          {match.home ? match.opponent : homeTeamName}
        </h1>
      </header>

      <main className="flex-1 px-5 pt-6">
        <AdminMatchForm
          matchId={match.id}
          players={roster}
          initialHomeGoals={match.home_goals}
          initialAwayGoals={match.away_goals}
          initialMvp={match.man_of_the_match_id}
          initialGoals={(goals ?? []).map((g) => ({
            id: g.id,
            scorerId: g.scorer_id,
            assistId: g.assist_id,
          }))}
          initialLocked={locked}
          kickoffAt={match.kickoff_at}
          initialRealLineup={(realLineup ?? []).map((l) => l.player_id)}
          initialStatus={match.status as "scheduled" | "live" | "finished"}
          submittedCount={submittedCount ?? 0}
          totalTeams={totalTeams ?? 0}
        />
      </main>
    </div>
  );
}
