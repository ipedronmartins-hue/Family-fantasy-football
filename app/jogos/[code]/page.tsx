import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabase as publicSupabase, CURRENT_SEASON_ID } from "@/lib/supabaseClient";
import { getCurrentParent } from "@/lib/auth";
import { getRoster } from "@/db/queries/players";
import { formatMatchDate } from "@/lib/format";
import { MotmVote } from "@/components/MotmVote";

export const dynamic = "force-dynamic";

export default async function MatchSummaryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const matchday = Number(code.replace("J", ""));

  const [{ data: match }, parent, roster] = await Promise.all([
    publicSupabase
      .from("matches")
      .select("id, matchday, opponent, home, kickoff_at, home_goals, away_goals, man_of_the_match_id")
      .eq("season_id", CURRENT_SEASON_ID)
      .eq("matchday", matchday)
      .maybeSingle(),
    getCurrentParent(),
    getRoster(),
  ]);

  if (!match) notFound();

  const mvpQuery = match.man_of_the_match_id
    ? publicSupabase.from("players").select("name").eq("id", match.man_of_the_match_id).maybeSingle()
    : Promise.resolve({ data: null as { name: string } | null });

  const [{ data: goals }, { data: voteTally }, { data: matchdayTop }, { data: mvp }] = await Promise.all([
    publicSupabase
      .from("match_goals")
      .select("scorer_id, assist_id, players!match_goals_scorer_id_fkey(name)")
      .eq("match_id", match.id),
    publicSupabase
      .from("motm_vote_tally")
      .select("player_id, player_name, votes")
      .eq("match_id", match.id)
      .order("votes", { ascending: false }),
    publicSupabase
      .from("matchday_leaderboard")
      .select("team_name, points")
      .eq("match_id", match.id)
      .order("points", { ascending: false })
      .limit(1),
    mvpQuery,
  ]);

  const played = match.home_goals !== null && match.away_goals !== null;

  let myPrediction: {
    predicted_home_goals: number | null;
    predicted_away_goals: number | null;
  } | null = null;
  let myPoints: { points: number; breakdown: Record<string, number> } | null = null;
  let myVote: string | null = null;

  if (parent && parent !== "onboarding") {
    const supabase = await createServerSupabase();
    const [{ data: pred }, { data: vote }] = await Promise.all([
      supabase
        .from("predictions")
        .select("id, predicted_home_goals, predicted_away_goals")
        .eq("fantasy_team_id", parent.fantasyTeamId)
        .eq("match_id", match.id)
        .maybeSingle(),
      supabase
        .from("motm_votes")
        .select("player_id")
        .eq("match_id", match.id)
        .eq("parent_id", parent.userId)
        .maybeSingle(),
    ]);

    if (pred) {
      myPrediction = pred;
      const { data: points } = await supabase
        .from("fantasy_points")
        .select("points, breakdown")
        .eq("prediction_id", pred.id)
        .maybeSingle();
      if (points) myPoints = points as { points: number; breakdown: Record<string, number> };
    }
    myVote = vote?.player_id ?? null;
  }

  const homeLabel = match.home ? "Gondomar SC" : match.opponent;
  const awayLabel = match.home ? match.opponent : "Gondomar SC";
  const topTeam = matchdayTop?.[0];

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Jornada {match.matchday}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          {homeLabel} vs {awayLabel}
        </h1>
        <p className="mt-2 text-sm text-white/80">{formatMatchDate(match.kickoff_at.slice(0, 10))}</p>
      </header>

      <main className="flex-1 space-y-4 px-5 pt-6">
        {!played && (
          <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink/60">
            Ainda por jogar.
          </div>
        )}

        {played && (
          <>
            <div className="rounded-2xl border border-line bg-white p-4 text-center">
              <p className="font-display text-4xl font-bold text-ink">
                {match.home_goals} - {match.away_goals}
              </p>
              {mvp && <p className="mt-2 text-sm text-ink/60">⭐ Homem do Jogo (oficial): {mvp.name}</p>}
            </div>

            {goals && goals.length > 0 && (
              <div className="rounded-2xl border border-line bg-white p-4">
                <h2 className="mb-2 font-display text-sm font-semibold text-ink">Golos</h2>
                <ul className="text-sm text-ink/80">
                  {goals.map((g, i) => (
                    <li key={i}>
                      ⚽ {(g.players as unknown as { name: string } | null)?.name ?? "?"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {topTeam && (
              <div className="rounded-2xl border border-gold bg-gold/10 p-4 text-center">
                <p className="text-xs font-semibold text-ink/60">👑 MISTER DA BANCADA DA JORNADA</p>
                <p className="mt-1 font-display text-lg font-semibold text-ink">{topTeam.team_name}</p>
                <p className="text-xs text-ink/60">{topTeam.points} pts nesta jornada</p>
              </div>
            )}

            {myPrediction && (
              <div className="rounded-2xl border border-line bg-white p-4">
                <h2 className="mb-2 font-display text-sm font-semibold text-ink">A tua previsão</h2>
                <p className="text-sm text-ink/70">
                  Previste {myPrediction.predicted_home_goals} - {myPrediction.predicted_away_goals}
                </p>
                {myPoints ? (
                  <p className="mt-2 font-display text-2xl font-bold text-gold">
                    +{myPoints.points} pts
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-ink/50">Pontos ainda não calculados.</p>
                )}
              </div>
            )}

            {parent && parent !== "onboarding" && (
              <MotmVote matchId={match.id} players={roster} initialVote={myVote} />
            )}

            {voteTally && voteTally.length > 0 && (
              <div className="rounded-2xl border border-line bg-white p-4">
                <h2 className="mb-2 font-display text-sm font-semibold text-ink">
                  Voto dos pais
                </h2>
                <ul className="space-y-1 text-sm text-ink/80">
                  {voteTally.map((v) => (
                    <li key={v.player_id} className="flex justify-between">
                      <span>{v.player_name}</span>
                      <span className="font-semibold text-ink">{v.votes} votos</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
