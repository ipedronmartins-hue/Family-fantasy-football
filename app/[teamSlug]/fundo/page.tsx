import { supabase } from "@/lib/supabaseClient";
import { getTeamBySlug } from "@/lib/team";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  transporte: "Transporte",
  equipamento: "Equipamento",
  torneios: "Torneios",
  inscricoes: "Inscrições",
  material: "Material",
  servidor: "Servidor (alojamento da plataforma)",
  outros: "Outros",
};

export default async function FundoPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const team = await getTeamBySlug(teamSlug);

  const [{ data }, { data: payments }] = await Promise.all([
    supabase
      .from("team_fund_entries")
      .select("category, amount, entry_type, description, created_at")
      .eq("season_id", team.seasonId)
      .order("created_at", { ascending: false }),
    supabase.from("family_payments").select("amount").eq("season_id", team.seasonId),
  ]);

  const entries = data ?? [];
  const receitas = entries.filter((e) => e.entry_type === "receita").reduce((s, e) => s + e.amount, 0);
  const despesas = entries.filter((e) => e.entry_type === "despesa").reduce((s, e) => s + e.amount, 0);
  const saldo = receitas - despesas;

  const quotaCount = payments?.length ?? 0;
  const quotaTotal = (payments ?? []).reduce((s, p) => s + p.amount, 0);
  const outrasEntradas = receitas - quotaTotal;

  const byCategory = entries
    .filter((e) => e.entry_type === "despesa")
    .reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {});

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">{team.clubName} · {team.teamName} · {team.seasonLabel}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Fundo da Equipa</h1>
      </header>

      <main className="flex-1 px-5 pt-6">
        <div className="mb-4 rounded-2xl border border-line bg-white p-4 text-center">
          <p className="text-xs font-semibold text-ink/60">SALDO</p>
          <p className="mt-1 font-display text-4xl font-bold text-blue">{saldo.toFixed(2)} €</p>
        </div>

        <div className="mb-4 rounded-2xl border border-line bg-white p-4">
          <p className="mb-2 text-xs font-semibold text-ink/60">ENTRADAS</p>
          {quotaCount > 0 ? (
            <p className="text-sm text-ink">
              {quotaCount} {quotaCount === 1 ? "contributo" : "contributos"} × 5 € ={" "}
              <span className="font-semibold">{quotaTotal.toFixed(2)} €</span>
            </p>
          ) : (
            <p className="text-sm text-ink/50">Ainda sem contributos registados.</p>
          )}
          {outrasEntradas > 0 && (
            <p className="mt-1 text-sm text-ink/70">
              + outras entradas: <span className="font-semibold">{outrasEntradas.toFixed(2)} €</span>
            </p>
          )}
        </div>

        <div className="mb-4 rounded-2xl border border-line bg-white p-4">
          <p className="mb-2 text-xs font-semibold text-ink/60">DESPESAS</p>
          {Object.keys(byCategory).length === 0 ? (
            <p className="text-sm text-ink/50">Ainda sem despesas registadas.</p>
          ) : (
            <ul>
              {Object.entries(byCategory).map(([category, amount]) => (
                <li
                  key={category}
                  className="flex items-center justify-between border-b border-line py-2 text-sm last:border-b-0"
                >
                  <span className="text-ink">{CATEGORY_LABELS[category] ?? category}</span>
                  <span className="font-semibold text-ink">-{amount.toFixed(2)} €</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-ink/40">
          Os valores apresentados correspondem às contribuições e despesas registadas pela
          organização da equipa.
        </p>
      </main>
    </div>
  );
}
