import { redirect } from "next/navigation";
import Link from "next/link";
import { getRoster } from "@/db/queries/players";
import { getNextFixture, getFixtureByCode } from "@/db/queries/fixtures";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { createServerSupabase } from "@/lib/supabase/server";
import { isPredictionLocked } from "@/lib/deadline";
import { formatMatchDate } from "@/lib/format";
import { JornadaClient, InitialGuess } from "@/components/JornadaClient";
import { FORMAT_SQUAD_SIZE, defaultFormationFor } from "@/config/formations";

export const dynamic = "force-dynamic";

export default async function JornadaPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ jornada?: string }>;
}) {
  const [{ teamSlug }, parent, { jornada }] = await Promise.all([params, getCurrentParent(), searchParams]);
  const base = `/${teamSlug}`;
  if (parent === null) redirect(`/login?team=${teamSlug}`);
  if (parent === "onboarding") redirect(`${base}/onboarding`);
  if (parent === "pending") redirect(`${base}/pendente`);
  if (parent === "suspended") redirect(`${base}/suspenso`);

  const team = await getTeamBySlug(teamSlug);
  const squadSize = FORMAT_SQUAD_SIZE[team.format];
  const [match, roster] = await Promise.all([
    jornada ? ((await getFixtureByCode(team.seasonId, jornada)) ?? getNextFixture(team.seasonId)) : getNextFixture(team.seasonId),
    getRoster(team.seasonId),
  ]);

  const supabase = await createServerSupabase();
  const [{ data: matchRow }, { data: thisWeekLineup }, { data: existing }] = await Promise.all([
    supabase.from("matches").select("locked_at").eq("id", match.id).maybeSingle(),
    supabase
      .from("fantasy_lineups")
      .select("player_id, is_captain, is_vice_captain")
      .eq("fantasy_team_id", parent.fantasyTeamId)
      .eq("match_id", match.id),
    supabase
      .from("predictions")
      .select("predicted_home_goals, predicted_away_goals, predicted_scorer_id, predicted_assist_id, predicted_mvp_id")
      .eq("fantasy_team_id", parent.fantasyTeamId)
      .eq("match_id", match.id)
      .maybeSingle(),
  ]);

  const locked = isPredictionLocked(match.kickoffAt, matchRow?.locked_at ?? null);

  let lineup = thisWeekLineup ?? [];
  // Nada guardado nesta jornada: parte do último onze, como no Fantasy a sério.
  if (lineup.length === 0 && !locked) {
    const { data: lastLineup } = await supabase
      .from("fantasy_lineups")
      .select("player_id, is_captain, is_vice_captain, matches!inner(kickoff_at)")
      .eq("fantasy_team_id", parent.fantasyTeamId)
      .lt("matches.kickoff_at", match.kickoffAt)
      .order("kickoff_at", { referencedTable: "matches", ascending: false })
      .limit(squadSize);
    if (lastLineup && lastLineup.length > 0) lineup = lastLineup;
  }

  const initialGuess: InitialGuess | null = existing
    ? {
        goalsHome: existing.predicted_home_goals?.toString() ?? "",
        goalsAway: existing.predicted_away_goals?.toString() ?? "",
        scorer: existing.predicted_scorer_id ?? "",
        assist: existing.predicted_assist_id ?? "",
        mvp: existing.predicted_mvp_id ?? "",
      }
    : null;

  const teamLabel = `${team.clubName} ${team.teamName}`;
  const homeLabel = match.home ? teamLabel : match.opponent;
  const awayLabel = match.home ? match.opponent : teamLabel;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">
          {parent.fantasyTeamName} · {match.competition === "Amigável" ? "Amigável" : match.code.replace("J", "Jornada ")}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          {homeLabel} vs {awayLabel}
        </h1>
        <p className="mt-2 text-sm text-white/80">
          {formatMatchDate(match.date)} · {match.home ? "Casa" : "Fora"}
        </p>
        <p className="mt-2 text-xs text-white/60">
          Podes mexer na tua escolha até o administrador fechar a jornada.
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <Link href={`${base}/pontuacao`} className="mb-4 block text-center text-xs font-semibold text-blue">
          Como se ganham pontos? →
        </Link>
        <JornadaClient
          roster={roster}
          fantasyTeamId={parent.fantasyTeamId}
          matchId={match.id}
          homeLabel={homeLabel}
          awayLabel={awayLabel}
          locked={locked}
          format={team.format}
          initialFormation={parent.formation ?? defaultFormationFor(team.format)}
          initialSelected={lineup.map((l) => l.player_id)}
          initialCaptain={lineup.find((l) => l.is_captain)?.player_id ?? null}
          initialViceCaptain={lineup.find((l) => l.is_vice_captain)?.player_id ?? null}
          initialGuess={initialGuess}
        />
      </main>
    </div>
  );
}
