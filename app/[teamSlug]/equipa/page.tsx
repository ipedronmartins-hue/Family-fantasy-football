import { redirect } from "next/navigation";
import { getRoster } from "@/db/queries/players";
import { getNextFixture, getFixtureByCode } from "@/db/queries/fixtures";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { createServerSupabase } from "@/lib/supabase/server";
import { isPredictionLocked } from "@/lib/deadline";
import { formatMatchDate } from "@/lib/format";
import { EquipaClient } from "@/components/EquipaClient";
import { FormationId } from "@/config/formations";

export const dynamic = "force-dynamic";

export default async function EquipaPage({
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

  const team = await getTeamBySlug(teamSlug);
  const [match, roster] = await Promise.all([
    jornada ? (await getFixtureByCode(team.seasonId, jornada)) ?? getNextFixture(team.seasonId) : getNextFixture(team.seasonId),
    getRoster(team.seasonId),
  ]);

  const supabase = await createServerSupabase();

  const [{ data: matchRow }, { data: thisWeekLineup }] = await Promise.all([
    supabase.from("matches").select("locked_at").eq("id", match.id).maybeSingle(),
    supabase
      .from("fantasy_lineups")
      .select("player_id, is_captain, is_vice_captain")
      .eq("fantasy_team_id", parent.fantasyTeamId)
      .eq("match_id", match.id),
  ]);

  const locked = isPredictionLocked(match.kickoffAt, matchRow?.locked_at ?? null);

  let lineup = thisWeekLineup ?? [];

  // Nothing saved yet for this gameweek — carry over the most recent past
  // selection as a starting point, same as real Fantasy Premier League
  // keeps your team from week to week until you change it.
  if (lineup.length === 0 && !locked) {
    const { data: lastLineup } = await supabase
      .from("fantasy_lineups")
      .select("player_id, is_captain, is_vice_captain, matches!inner(kickoff_at)")
      .eq("fantasy_team_id", parent.fantasyTeamId)
      .lt("matches.kickoff_at", match.kickoffAt)
      .order("kickoff_at", { referencedTable: "matches", ascending: false })
      .limit(11);
    if (lastLineup && lastLineup.length > 0) lineup = lastLineup;
  }

  const initialSelected = lineup.map((l) => l.player_id);
  const initialCaptain = lineup.find((l) => l.is_captain)?.player_id ?? null;
  const initialViceCaptain = lineup.find((l) => l.is_vice_captain)?.player_id ?? null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">
          {parent.fantasyTeamName} · {match.competition === "Amigável" ? "Amigável" : match.code.replace("J", "Jornada ")}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">A Minha Equipa</h1>
        <p className="mt-2 text-sm text-white/80">
          Escolhe o teu XI para{" "}
          {match.home ? `${team.clubName} ${team.teamName}` : match.opponent} vs{" "}
          {match.home ? match.opponent : `${team.clubName} ${team.teamName}`}, marca o
          capitão e o vice, e guarda.
        </p>
        <p className="mt-2 text-xs text-white/60">
          Prazo: {formatMatchDate(match.date)} (90 min antes do pontapé de saída). Isto é a
          tua Fantasy Team desta jornada — diferente do "11 provável" que preenches em cada
          Previsão (o que achas que vai ser a titularidade real do treinador).
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <EquipaClient
          roster={roster}
          fantasyTeamId={parent.fantasyTeamId}
          matchId={match.id}
          locked={locked}
          initialFormation={parent.formation as FormationId}
          initialSelected={initialSelected}
          initialCaptain={initialCaptain}
          initialViceCaptain={initialViceCaptain}
        />
      </main>
    </div>
  );
}
