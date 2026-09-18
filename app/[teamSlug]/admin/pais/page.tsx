import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { createServerSupabase } from "@/lib/supabase/server";
import { ParentsAdminClient, ParentRow } from "@/components/ParentsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminParentsPage({ params }: { params: Promise<{ teamSlug: string }> }) {
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

  const { data } = await supabase
    .from("parents")
    .select("id, display_name, status, fantasy_teams(name)")
    .eq("season_id", team.seasonId)
    .order("display_name");

  const rows: ParentRow[] = (data ?? []).map((p) => ({
    id: p.id,
    displayName: p.display_name,
    email: null,
    status: p.status as "pending" | "active" | "suspended",
    teamName: (p.fantasy_teams as unknown as { name: string }[] | null)?.[0]?.name ?? null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Admin · {team.teamName}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Pais</h1>
        <p className="mt-2 text-sm text-white/80">
          Aprova quem se acabou de registar, e suspende quem não tiver o contributo em dia.
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <ParentsAdminClient parents={rows} />
      </main>
    </div>
  );
}
