import { redirect } from "next/navigation";
import Link from "next/link";
import { getNextFixture, getFixtureByCode } from "@/db/queries/fixtures";
import { getRoster } from "@/db/queries/players";
import { getCurrentParent } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatMatchDate } from "@/lib/format";
import { PredictionForm } from "@/components/PredictionForm";

export const dynamic = "force-dynamic";

export default async function PreverPage({
  searchParams,
}: {
  searchParams: Promise<{ jornada?: string }>;
}) {
  const [parent, { jornada }] = await Promise.all([getCurrentParent(), searchParams]);
  if (parent === null) redirect("/login");
  if (parent === "onboarding") redirect("/onboarding");

  const [match, roster] = await Promise.all([
    jornada ? (await getFixtureByCode(jornada)) ?? getNextFixture() : getNextFixture(),
    getRoster(),
  ]);

  const supabase = await createServerSupabase();

  const [{ data: matchRow }, { data: existing }] = await Promise.all([
    supabase.from("matches").select("locked_at").eq("id", match.id).maybeSingle(),
    supabase
      .from("predictions")
      .select("id, predicted_home_goals, predicted_away_goals, predicted_scorer_id, predicted_assist_id, predicted_mvp_id")
      .eq("fantasy_team_id", parent.fantasyTeamId)
      .eq("match_id", match.id)
      .maybeSingle(),
  ]);
  const locked = !!matchRow?.locked_at && new Date(matchRow.locked_at) <= new Date();

  let initialLineup: string[] = [];
  if (existing) {
    const { data: lineupRows } = await supabase
      .from("predicted_lineups")
      .select("player_id")
      .eq("prediction_id", existing.id);
    initialLineup = (lineupRows ?? []).map((r) => r.player_id);
  }

  const initial = existing
    ? {
        goalsHome: existing.predicted_home_goals?.toString() ?? "",
        goalsAway: existing.predicted_away_goals?.toString() ?? "",
        scorer: existing.predicted_scorer_id ?? "",
        assist: existing.predicted_assist_id ?? "",
        mvp: existing.predicted_mvp_id ?? "",
      }
    : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Previsão · {match.code.replace("J", "Jornada ")}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          {match.home ? "Gondomar SC" : match.opponent} vs{" "}
          {match.home ? match.opponent : "Gondomar SC"}
        </h1>
        <p className="mt-2 text-sm text-white/80">
          {formatMatchDate(match.date)} · {match.home ? "Casa" : "Fora"}
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <Link href="/pontuacao" className="mb-4 block text-center text-xs font-semibold text-blue">
          Como se ganham pontos? →
        </Link>

        <PredictionForm
          match={match}
          players={roster}
          fantasyTeamId={parent.fantasyTeamId}
          initial={initial}
          initialLineup={initialLineup}
          locked={locked}
        />
      </main>
    </div>
  );
}
