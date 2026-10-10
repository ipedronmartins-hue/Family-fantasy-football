import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { PAL_SLUG, type PalFixture, type PalGroup, type PalLeaderRow, type PalRound, type PalSummary, type PalTicket } from "@/lib/palpites";
import JoinForm from "@/components/leoes/JoinForm";
import LeoesHome from "@/components/leoes/LeoesHome";

export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-12 pt-8">{children}</div>;
}

export default async function LeoesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Shell>
        <Link href="/clubes" className="text-xs font-semibold text-blue">← Clubes</Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Palpites dos Leões</h1>
        <p className="mt-2 text-sm text-ink/70">
          Os palpites 1X2 da jornada para os Leões Valboenses, só entre os do clube. Entra ou cria
          conta para continuares.
        </p>
        <Link
          href="/login?next=/leoes"
          className="mt-6 block rounded-xl bg-blue py-3 text-center text-sm font-semibold text-white"
        >
          Entrar ou criar conta
        </Link>
      </Shell>
    );
  }

  // O grupo só é visível a quem já é membro (regras de acesso da base de dados).
  const { data: groupRow } = await supabase.from("pal_groups").select("*").eq("slug", PAL_SLUG).maybeSingle();
  const group = groupRow as PalGroup | null;

  if (!group) {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-semibold text-ink">Palpites dos Leões</h1>
        <p className="mt-2 text-sm text-ink/70">Ainda não pediste para entrar neste grupo.</p>
        <JoinForm email={user.email ?? ""} />
      </Shell>
    );
  }

  const { data: member } = await supabase
    .from("pal_members")
    .select("display_name, status, is_admin, is_treasurer")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member || member.status === "pending") {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-semibold text-ink">Palpites dos Leões</h1>
        <div className="mt-4 rounded-2xl border border-gold bg-gold/10 p-4 text-sm text-ink">
          ⏳ O teu pedido está a aguardar aprovação do capitão. Quando for aprovado, esta página
          mostra a jornada.
        </div>
      </Shell>
    );
  }
  if (member.status === "suspended") {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-semibold text-ink">Palpites dos Leões</h1>
        <div className="mt-4 rounded-2xl border border-red bg-red/10 p-4 text-sm text-ink">
          🔒 O teu acesso foi suspenso. Fala com o capitão.
        </div>
      </Shell>
    );
  }

  const [{ data: ledger }, { data: openRound }, { data: lastSettled }, { data: board }] = await Promise.all([
    supabase.from("pal_ledger").select("delta").eq("group_id", group.id).eq("user_id", user.id),
    supabase.from("pal_rounds").select("id, number, status, bets_closed_at, super_fixture_id").eq("group_id", group.id).eq("status", "open").maybeSingle(),
    supabase
      .from("pal_rounds")
      .select("id, number, status, bets_closed_at, super_fixture_id")
      .eq("group_id", group.id)
      .eq("status", "settled")
      .order("settled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.rpc("pal_leaderboard", { p_group: group.id }),
  ]);

  const balance = (ledger ?? []).reduce((a, r) => a + Number(r.delta), 0);
  const round = (openRound ?? null) as PalRound | null;
  const settled = (lastSettled ?? null) as PalRound | null;

  async function loadRound(r: PalRound | null) {
    if (!r) return null;
    const [{ data: fixtures }, { data: tickets }, { data: summary }] = await Promise.all([
      supabase.from("pal_fixtures").select("id, position, home, away, kickoff, result, score_home, score_away").eq("round_id", r.id).order("position"),
      supabase
        .from("pal_tickets")
        .select("id, picks, cost, best_hits, prize, settled, created_at, super_home, super_away, super_hit")
        .eq("round_id", r.id)
        .eq("user_id", user!.id)
        .order("created_at"),
      supabase.rpc("pal_round_summary", { p_round: r.id }),
    ]);
    const s = Array.isArray(summary) ? summary[0] : summary;
    return {
      round: r,
      fixtures: (fixtures ?? []) as PalFixture[],
      tickets: ((tickets ?? []) as PalTicket[]).map((t) => ({ ...t, cost: Number(t.cost), prize: Number(t.prize) })),
      summary: s
        ? ({ ...s, pot: Number(s.pot), prize1: Number(s.prize1), prize2: Number(s.prize2), caixa: s.caixa === null ? null : Number(s.caixa) } as PalSummary)
        : null,
    };
  }

  const [current, previous] = await Promise.all([loadRound(round), loadRound(settled)]);

  return (
    <LeoesHome
      group={{
        ...group,
        fino_value: group.fino_value === null ? null : Number(group.fino_value),
        p1_pct: group.p1_pct === null ? null : Number(group.p1_pct),
        p2_pct: group.p2_pct === null ? null : Number(group.p2_pct),
        jackpot_cap: group.jackpot_cap === null ? null : Number(group.jackpot_cap),
      }}
      member={{ displayName: member.display_name, isAdmin: member.is_admin, isTreasurer: member.is_treasurer }}
      balance={balance}
      current={current}
      previous={previous}
      leaderboard={((board ?? []) as PalLeaderRow[]).map((r) => ({ ...r, total_prize: Number(r.total_prize) }))}
      userId={user.id}
    />
  );
}
