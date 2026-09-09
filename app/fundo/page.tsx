import { supabase, CURRENT_SEASON_ID } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  transporte: "Transporte",
  equipamento: "Equipamento",
  torneios: "Torneios",
  inscricoes: "Inscrições",
  material: "Material",
  outros: "Outros",
};

export default async function FundoPage() {
  const { data } = await supabase
    .from("team_fund_entries")
    .select("category, amount, entry_type, description, created_at")
    .eq("season_id", CURRENT_SEASON_ID)
    .order("created_at", { ascending: false });

  const entries = data ?? [];
  const receitas = entries.filter((e) => e.entry_type === "receita").reduce((s, e) => s + e.amount, 0);
  const despesas = entries.filter((e) => e.entry_type === "despesa").reduce((s, e) => s + e.amount, 0);
  const saldo = receitas - despesas;

  const byCategory = entries
    .filter((e) => e.entry_type === "despesa")
    .reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {});

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Family Fantasy · 2026/27</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Fundo da Equipa</h1>
      </header>

      <main className="flex-1 px-5 pt-6">
        <div className="mb-4 rounded-2xl border border-line bg-white p-4 text-center">
          <p className="text-xs font-semibold text-ink/60">SALDO</p>
          <p className="mt-1 font-display text-4xl font-bold text-blue">{saldo.toFixed(2)} €</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-white p-4 text-center">
            <p className="font-display text-xl font-bold text-ink">{receitas.toFixed(2)} €</p>
            <p className="text-xs text-ink/60">receitas</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 text-center">
            <p className="font-display text-xl font-bold text-ink">{despesas.toFixed(2)} €</p>
            <p className="text-xs text-ink/60">despesas</p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink/60">
            Ainda não há movimentos registados no fundo da equipa.
          </div>
        ) : (
          <ul className="rounded-2xl border border-line bg-white px-4">
            {Object.entries(byCategory).map(([category, amount]) => (
              <li
                key={category}
                className="flex items-center justify-between border-b border-line py-2.5 text-sm last:border-b-0"
              >
                <span className="text-ink">{CATEGORY_LABELS[category] ?? category}</span>
                <span className="font-semibold text-ink">-{amount.toFixed(2)} €</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
