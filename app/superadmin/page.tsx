import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { SuperAdminClient, TeamRow } from "@/components/SuperAdminClient";
import { RegistrationRequestsClient, RequestRow } from "@/components/RegistrationRequestsClient";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const parent = await getCurrentParent();
  if (parent === null) redirect("/login");
  if (parent === "onboarding" || parent === "pending" || parent === "suspended") redirect("/");
  if (!parent.isPlatformOwner) redirect("/");

  const supabase = await createServerSupabase();

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthKey = monthStart.toISOString().slice(0, 10);
  const monthLabel = monthStart.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  const [{ data: teams }, { data: payments }, { data: requests }, { data: invites }] = await Promise.all([
    supabase.from("teams").select("id, name, slug, platform_status, format, club_id, clubs(name), seasons(id)"),
    supabase.from("platform_payments").select("team_id, amount").eq("month", monthKey),
    supabase
      .from("team_registration_requests")
      .select("id, club_name, team_name, format, contact_name, contact_email, contact_phone, created_at")
      .eq("status", "pending")
      .order("created_at"),
    supabase.rpc("list_admin_invites"),
  ]);

  const inviteBySeason = new Map(
    ((invites ?? []) as { season_id: string; email: string; code: string; used: boolean }[]).map((i) => [
      i.season_id,
      i,
    ])
  );

  const paidMap = new Map((payments ?? []).map((p) => [p.team_id, p.amount]));
  const teamRows: TeamRow[] = (teams ?? []).map((t) => ({
    teamId: t.id,
    teamName: t.name,
    clubName: (t.clubs as unknown as { name: string } | null)?.name ?? "",
    slug: t.slug,
    format: t.format,
    adminInvite: (() => {
      const seasonId = (t.seasons as unknown as { id: string }[] | null)?.[0]?.id;
      const inv = seasonId ? inviteBySeason.get(seasonId) : undefined;
      return inv ? { email: inv.email, code: inv.code, used: inv.used } : null;
    })(),
    status: t.platform_status as "active" | "blocked",
    paid: paidMap.has(t.id),
    amount: paidMap.get(t.id) ?? null,
  }));

  const requestRows: RequestRow[] = (requests ?? []).map((r) => ({
    id: r.id,
    clubName: r.club_name,
    teamName: r.team_name,
    format: r.format,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
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
          Pedidos de inscrição {requestRows.length > 0 ? `(${requestRows.length})` : ""}
        </h2>
        <RegistrationRequestsClient requests={requestRows} />
      </main>
    </div>
  );
}
