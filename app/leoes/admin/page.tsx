import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { PAL_SLUG, type PalFixture, type PalGroup } from "@/lib/palpites";
import LeoesAdmin, { type AdminMember } from "@/components/leoes/LeoesAdmin";
import type { AdminRound } from "@/components/leoes/RoundsAdmin";

export const dynamic = "force-dynamic";

export default async function LeoesAdminPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/leoes");

  const { data: groupRow } = await supabase.from("pal_groups").select("*").eq("slug", PAL_SLUG).maybeSingle();
  const group = groupRow as PalGroup | null;
  if (!group) redirect("/leoes");

  const { data: me } = await supabase
    .from("pal_members")
    .select("status, is_admin, is_treasurer")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!me || me.status !== "active" || !(me.is_admin || me.is_treasurer)) redirect("/leoes");

  const [{ data: members }, { data: roundRows }] = await Promise.all([
    supabase.rpc("pal_members_admin", { p_group: group.id }),
    supabase
      .from("pal_rounds")
      .select("id, number, status, carry_in")
      .eq("group_id", group.id)
      .in("status", ["open", "scheduled"])
      .order("number"),
  ]);

  const rounds: AdminRound[] = await Promise.all(
    (roundRows ?? []).map(async (r) => {
      const [{ data: fx }, { count }] = await Promise.all([
        supabase.from("pal_fixtures").select("id, position, home, away, kickoff, result").eq("round_id", r.id).order("position"),
        supabase.from("pal_tickets").select("id", { count: "exact", head: true }).eq("round_id", r.id),
      ]);
      return {
        round: r as AdminRound["round"],
        fixtures: (fx ?? []) as PalFixture[],
        ticketCount: count ?? 0,
      };
    })
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-12 pt-6">
      <Link href="/leoes" className="text-xs font-semibold text-blue">← Palpites dos Leões</Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-ink">{me.is_admin ? "Administração" : "Tesouraria"}</h1>
      <LeoesAdmin
        group={{
          ...group,
          fino_value: group.fino_value === null ? null : Number(group.fino_value),
          p1_pct: group.p1_pct === null ? null : Number(group.p1_pct),
          p2_pct: group.p2_pct === null ? null : Number(group.p2_pct),
          jackpot_cap: group.jackpot_cap === null ? null : Number(group.jackpot_cap),
        }}
        isAdmin={me.is_admin}
        members={((members ?? []) as AdminMember[]).map((m) => ({ ...m, balance: Number(m.balance) }))}
        rounds={rounds}
        selfId={user.id}
      />
    </div>
  );
}
