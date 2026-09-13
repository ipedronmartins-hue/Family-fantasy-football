import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { createServerSupabase } from "@/lib/supabase/server";
import { PaymentsClient, FamilyRow } from "@/components/PaymentsClient";
import { FundEntryForm, FundEntryRow } from "@/components/FundEntryForm";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const base = `/${teamSlug}`;
  const parent = await getCurrentParent();
  if (parent === null) redirect(`/login?team=${teamSlug}`);
  if (parent === "onboarding") redirect(`${base}/onboarding`);
  if (!parent.isAdmin) redirect(base);

  const team = await getTeamBySlug(teamSlug);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthKey = monthStart.toISOString().slice(0, 10);
  const monthLabel = monthStart.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  const supabase = await createServerSupabase();
  const [{ data: teams }, { data: payments }, { data: fundEntries }] = await Promise.all([
    supabase.from("fantasy_teams").select("id, name").eq("season_id", team.seasonId).order("name"),
    supabase.from("family_payments").select("fantasy_team_id, amount, method").eq("season_id", team.seasonId).eq("month", monthKey),
    supabase
      .from("team_fund_entries")
      .select("id, entry_type, amount, description, category")
      .eq("season_id", team.seasonId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const paidMap = new Map((payments ?? []).map((p) => [p.fantasy_team_id, p]));
  const families: FamilyRow[] = (teams ?? []).map((t) => ({
    fantasyTeamId: t.id,
    teamName: t.name,
    paid: paidMap.has(t.id),
    amount: paidMap.get(t.id)?.amount ?? null,
    method: paidMap.get(t.id)?.method ?? null,
  }));

  const entries: FundEntryRow[] = (fundEntries ?? []).map((e) => ({
    id: e.id,
    entryType: e.entry_type as "receita" | "despesa",
    amount: e.amount,
    description: e.description,
    category: e.category,
  }));

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Admin</p>
        <h1 className="mt-1 font-display text-3xl font-semibold capitalize">Contributos · {monthLabel}</h1>
      </header>

      <main className="flex-1 space-y-5 px-5 pt-6">
        {families.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink/60">
            Ainda não há equipas Fantasy criadas.
          </div>
        ) : (
          <PaymentsClient month={monthKey} families={families} />
        )}

        <FundEntryForm seasonId={team.seasonId} entries={entries} />
      </main>
    </div>
  );
}
