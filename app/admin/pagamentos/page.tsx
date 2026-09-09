import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { CURRENT_SEASON_ID } from "@/lib/supabaseClient";
import { PaymentsClient, FamilyRow } from "@/components/PaymentsClient";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const parent = await getCurrentParent();
  if (parent === null) redirect("/login");
  if (parent === "onboarding") redirect("/onboarding");
  if (!parent.isAdmin) redirect("/");

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthKey = monthStart.toISOString().slice(0, 10);
  const monthLabel = monthStart.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  const supabase = await createServerSupabase();
  const [{ data: teams }, { data: payments }] = await Promise.all([
    supabase.from("fantasy_teams").select("id, name").eq("season_id", CURRENT_SEASON_ID).order("name"),
    supabase
      .from("family_payments")
      .select("fantasy_team_id, amount")
      .eq("season_id", CURRENT_SEASON_ID)
      .eq("month", monthKey),
  ]);

  const paidMap = new Map((payments ?? []).map((p) => [p.fantasy_team_id, p.amount]));
  const families: FamilyRow[] = (teams ?? []).map((t) => ({
    fantasyTeamId: t.id,
    teamName: t.name,
    paid: paidMap.has(t.id),
    amount: paidMap.get(t.id) ?? null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Admin</p>
        <h1 className="mt-1 font-display text-3xl font-semibold capitalize">Quotas · {monthLabel}</h1>
      </header>

      <main className="flex-1 px-5 pt-6">
        {families.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink/60">
            Ainda não há equipas Fantasy criadas.
          </div>
        ) : (
          <PaymentsClient month={monthKey} families={families} />
        )}
      </main>
    </div>
  );
}
