"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export interface FamilyRow {
  fantasyTeamId: string;
  teamName: string;
  paid: boolean;
  amount: number | null;
}

export function PaymentsClient({
  month,
  families,
}: {
  month: string; // YYYY-MM-01
  families: FamilyRow[];
}) {
  const [rows, setRows] = useState(families);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function markPaid(fantasyTeamId: string) {
    setBusyId(fantasyTeamId);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("register_family_payment", {
      p_fantasy_team_id: fantasyTeamId,
      p_month: month,
      p_amount: 5,
      p_method: "mbway",
    });
    setBusyId(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.fantasyTeamId === fantasyTeamId ? { ...r, paid: true, amount: 5 } : r))
    );
  }

  const paidCount = rows.filter((r) => r.paid).length;

  return (
    <div>
      <p className="mb-3 text-center text-sm font-semibold text-ink">
        {paidCount} de {rows.length} famílias pagas este mês
      </p>
      <ul className="rounded-2xl border border-line bg-white px-4">
        {rows.map((row) => (
          <li
            key={row.fantasyTeamId}
            className="flex items-center justify-between border-b border-line py-3 text-sm last:border-b-0"
          >
            <span className="text-ink">{row.teamName}</span>
            {row.paid ? (
              <span className="text-xs font-semibold text-blue">✅ Pago · {row.amount} €</span>
            ) : (
              <button
                onClick={() => markPaid(row.fantasyTeamId)}
                disabled={busyId === row.fantasyTeamId}
                className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
              >
                {busyId === row.fantasyTeamId ? "…" : "Marcar pago (5€)"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {message && <p className="mt-3 text-center text-xs text-red">{message}</p>}
    </div>
  );
}
