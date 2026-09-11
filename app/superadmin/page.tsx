import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { SuperAdminClient, TeamRow } from "@/components/SuperAdminClient";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const parent = await getCurrentParent();
  if (parent === null) redirect("/login");
  if (parent === "onboarding") redirect("/onboarding");
  if (!parent.isPlatformOwner) redirect("/");

  const supabase = await createServerSupabase();

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthKey = monthStart.toISOString().slice(0, 10);
  const monthLabel = monthStart.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  const [{ data: teams }, { data: payments }, { data: requests }] = await Promise.all([
    supabase.from("teams").select("id, name, platform_status, club_id, clubs(name)"),
    supabase.from("platform_payments").select("team_id, amount").eq("month", monthKey),
    supabase
      .from("team_registration_requests")
      .select("id, club_name, team_name, contact_name, contact_email, contact_phone, created_at")
      .eq("status", "pending")
      .order("created_at"),
  ]);

  const paidMap = new Map((payments ?? []).map((p) => [p.team_id, p.amount]));
  const teamRows: TeamRow[] = (teams ?? []).map((t) => ({
    teamId: t.id,
    teamName: t.name,
    clubName: (t.clubs as unknown as { name: string } | null)?.name ?? "",
    status: t.platform_status as "active" | "blocked",
    paid: paidMap.has(t.id),
    amount: paidMap.get(t.id) ?? null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Super-Admin</p>
        <h1 className="mt-1 font-display text-3xl font-semibold capitalize">Plataforma · {monthLabel}</h1>
        <p className="mt-2 text-sm text-white/80">20 €/mês por equipa · pagamento em dinheiro/MB WAY diretamente a ti.</p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <h2 className="mb-2 font-display text-lg font-semibold text-ink">Equipas</h2>
        <div className="mb-6">
          <SuperAdminClient month={monthKey} teams={teamRows} />
        </div>

        <h2 className="mb-2 font-display text-lg font-semibold text-ink">
          Pedidos de inscrição {requests && requests.length > 0 ? `(${requests.length})` : ""}
        </h2>
        {!requests || requests.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink/60">
            Sem pedidos pendentes.
          </div>
        ) : (
          <ul className="rounded-2xl border border-line bg-white px-4">
            {requests.map((r) => (
              <li key={r.id} className="border-b border-line py-3 text-sm last:border-b-0">
                <p className="font-semibold text-ink">
                  {r.team_name} · {r.club_name}
                </p>
                <p className="text-xs text-ink/60">
                  {r.contact_name} · {r.contact_email}
                  {r.contact_phone ? ` · ${r.contact_phone}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
