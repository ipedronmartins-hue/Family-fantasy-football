import { redirect, notFound } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getRoster } from "@/db/queries/players";
import { CURRENT_SEASON_ID } from "@/lib/supabaseClient";
import { AdminMatchForm } from "@/components/AdminMatchForm";

export const dynamic = "force-dynamic";

export default async function AdminMatchPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const parent = await getCurrentParent();
  if (parent === null) redirect("/login");
  if (parent === "onboarding") redirect("/onboarding");
  if (!parent.isAdmin) redirect("/");

  const { code } = await params;
  const matchday = Number(code.replace("J", ""));

  const supabase = await createServerSupabase();
  const { data: match } = await supabase
    .from("matches")
    .select("id, matchday, opponent, home, home_goals, away_goals, man_of_the_match_id")
    .eq("season_id", CURRENT_SEASON_ID)
    .eq("matchday", matchday)
    .maybeSingle();

  if (!match) notFound();

  const { data: goals } = await supabase
    .from("match_goals")
    .select("id, scorer_id, assist_id")
    .eq("match_id", match.id);

  const roster = await getRoster();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Admin · Jornada {match.matchday}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          {match.home ? "Gondomar SC" : match.opponent} vs{" "}
          {match.home ? match.opponent : "Gondomar SC"}
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
        />
      </main>
    </div>
  );
}
