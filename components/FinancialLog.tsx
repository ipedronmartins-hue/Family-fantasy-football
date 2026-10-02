export interface LogRow {
  action: string;
  details: Record<string, unknown>;
  reason: string | null;
  done_at: string;
}

function describe(row: LogRow): string {
  const d = row.details;
  if (row.action === "contributo_anulado") {
    return `Contributo anulado: ${d.familia} · ${d.valor} € (${String(d.mes).slice(0, 7)})`;
  }
  if (row.action === "movimento_removido") {
    return `Movimento removido: ${d.tipo === "receita" ? "+" : "-"}${d.valor} € ${d.nota ?? d.categoria ?? ""}`;
  }
  if (row.action === "pagamento_plataforma_anulado") {
    return `Pagamento da plataforma anulado: ${d.equipa} · ${d.valor} €`;
  }
  return row.action;
}

export function FinancialLog({ rows }: { rows: LogRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <h2 className="mb-2 font-display text-base font-semibold text-ink">Histórico de anulações</h2>
      <ul>
        {rows.map((r, i) => (
          <li key={i} className="border-b border-line py-2 text-xs last:border-b-0">
            <p className="font-semibold text-ink">{describe(r)}</p>
            <p className="text-ink/50">
              {new Date(r.done_at).toLocaleString("pt-PT", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {r.reason ? ` · ${r.reason}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
