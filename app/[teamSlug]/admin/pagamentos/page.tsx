import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { createServerSupabase } from "@/lib/supabase/server";
import { PaymentsClient, FamilyRow } from "@/components/PaymentsClient";
import { FinancialLog, LogRow } from "@/components/FinancialLog";
import { FundEntryForm, FundEntryRow } from "@/components/FundEntryForm";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const base = `/${teamSlug}`;
  const parent = await getCurrentParent();
  if (parent === null) redirect(`/login?team=${teamSlug}`);
  if (parent === "onboarding") redirect(`${base}/onboarding`);
  if (parent === "pending") redirect(`${base}/pendente`);
  if (parent === "suspended") redirect(`${base}/suspenso`);
  if (!parent.isAdmin) redirect(base);

  const team = await getTeamBySlug(teamSlug);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthKey = monthStart.toISOString().slice(0, 10);
  const monthLabel = monthStart.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  const supabase = await createServerSupabase();
  const [{ data: teams }, { data: payments }, { data: fundEntries }, { data: allPayments }, { data: allEntries }, { data: logRows }] = await Promise.all([
    supabase.from("fantasy_teams").select("id, name").eq("season_id", team.seasonId).order("name"),
    supabase.from("family_payments").select("id, fantasy_team_id, amount, method").eq("season_id", team.seasonId).eq("month", monthKey),
    supabase
      .from("team_fund_entries")
      .select("id, entry_type, amount, description, category")
      .eq("season_id", team.seasonId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("family_payments").select("amount").eq("season_id", team.seasonId),
    supabase.from("team_fund_entries").select("entry_type, amount").eq("season_id", team.seasonId),
    supabase
      .from("financial_audit_log")
      .select("action, details, reason, done_at")
      .eq("season_id", team.seasonId)
      .order("done_at", { ascending: false })
      .limit(8),
  ]);
  const paymentsTotal = (allPayments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const receitasTotal = (allEntries ?? [])
    .filter((e) => e.entry_type === "receita")
    .reduce((s, e) => s + Number(e.amount), 0);
  const missing = paymentsTotal - receitasTotal;

  const paidMap = new Map((payments ?? []).map((p) => [p.fantasy_team_id, p]));
  const families: FamilyRow[] = (teams ?? []).map((t) => ({
    fantasyTeamId: t.id,
    teamName: t.name,
    paid: paidMap.has(t.id),
    amount: paidMap.get(t.id)?.amount ?? null,
    method: paidMap.get(t.id)?.method ?? null,
    paymentId: paidMap.get(t.id)?.id ?? null,
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
          <PaymentsClient
            key={families.map((f) => `${f.fantasyTeamId}${f.paymentId ?? ""}`).join("|")}
            month={monthKey}
            families={families}
          />
        )}

        {missing > 0.005 && (
          <div className="rounded-2xl border border-gold bg-gold/10 p-4 text-sm text-ink">
            ⚠️ Registaste <strong>{paymentsTotal.toFixed(2)} €</strong> em contributos, mas só lançaste{" "}
            <strong>{receitasTotal.toFixed(2)} €</strong> de receitas no fundo. Falta lançar{" "}
            <strong>{missing.toFixed(2)} €</strong>?
          </div>
        )}

        <FundEntryForm key={entries.map((e) => e.id).join("|")} seasonId={team.seasonId} entries={entries} />

        <FinancialLog rows={(logRows ?? []) as LogRow[]} />
      </main>
    </div>
  );
}
