import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { createServerSupabase } from "@/lib/supabase/server";
import { ScoringRulesForm, ScoringRules } from "@/components/ScoringRulesForm";

export const dynamic = "force-dynamic";

export default async function AdminScoringPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const base = `/${teamSlug}`;
  const parent = await getCurrentParent();
  if (parent === null) redirect(`/login?team=${teamSlug}`);
  if (parent === "onboarding") redirect(`${base}/onboarding`);
  if (!parent.isAdmin) redirect(base);

  const team = await getTeamBySlug(teamSlug);
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("scoring_rules")
    .select("rules")
    .eq("season_id", team.seasonId)
    .maybeSingle();

  const rules = data?.rules as ScoringRules;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Admin</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Regras de Pontuação</h1>
        <p className="mt-2 text-sm text-white/80">
          Estas são exatamente as regras que o motor de pontuação usa — nada escondido.
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <ScoringRulesForm seasonId={team.seasonId} initial={rules} />
      </main>
    </div>
  );
}
