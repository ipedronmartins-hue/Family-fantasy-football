import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { createServerSupabase } from "@/lib/supabase/server";
import { BulkImportClient } from "@/components/BulkImportClient";

export const dynamic = "force-dynamic";

export default async function ImportarPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const base = `/${teamSlug}`;
  const parent = await getCurrentParent();
  if (parent === null) redirect(`/login?team=${teamSlug}`);
  if (parent === "onboarding") redirect(`${base}/onboarding`);
  if (parent === "pending") redirect(`${base}/pendente`);
  if (parent === "suspended") redirect(`${base}/suspenso`);
  if (!parent.isAdmin) redirect(base);

  const team = await getTeamBySlug(teamSlug);
  const supabase = await createServerSupabase();
  const [{ data: players }, { data: lastMatch }] = await Promise.all([
    supabase.from("players").select("shirt_number").eq("season_id", team.seasonId),
    supabase
      .from("matches")
      .select("matchday")
      .eq("season_id", team.seasonId)
      .order("matchday", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Admin · {team.teamName}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Importar</h1>
        <p className="mt-2 text-sm text-white/80">
          Cola o plantel e o calendário de uma só vez, em vez de um a um.
        </p>
      </header>
      <main className="flex-1 px-5 pt-6">
        <BulkImportClient
          teamSlug={teamSlug}
          seasonId={team.seasonId}
          existingNumbers={(players ?? []).map((p) => p.shirt_number)}
          nextMatchday={(lastMatch?.matchday ?? 0) + 1}
        />
      </main>
    </div>
  );
}
