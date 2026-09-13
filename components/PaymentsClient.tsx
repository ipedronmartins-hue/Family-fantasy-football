"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export interface FamilyRow {
  fantasyTeamId: string;
  teamName: string;
  paid: boolean;
  amount: number | null;
  method: string | null;
}

const METHOD_LABELS: Record<string, string> = { mbway: "MB WAY", dinheiro: "Dinheiro" };

export function PaymentsClient({
  month,
  families,
}: {
  month: string; // YYYY-MM-01
  families: FamilyRow[];
}) {
  const [rows, setRows] = useState(families);
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries(families.map((f) => [f.fantasyTeamId, "5"]))
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function markPaid(fantasyTeamId: string, method: "mbway" | "dinheiro") {
    const amount = Number(amounts[fantasyTeamId] ?? "5");
    if (!amount || amount <= 0) {
      setMessage("Indica um valor válido.");
      return;
    }
    setBusyId(fantasyTeamId);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("register_family_payment", {
      p_fantasy_team_id: fantasyTeamId,
      p_month: month,
      p_amount: amount,
      p_method: method,
    });
    setBusyId(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.fantasyTeamId === fantasyTeamId ? { ...r, paid: true, amount, method } : r))
    );
  }

  const paidCount = rows.filter((r) => r.paid).length;

  return (
    <div>
      <p className="mb-3 text-center text-sm font-semibold text-ink">
        {paidCount} de {rows.length} famílias com contributo este mês
      </p>
      <ul className="rounded-2xl border border-line bg-white px-4">
        {rows.map((row) => (
          <li
            key={row.fantasyTeamId}
            className="flex items-center justify-between border-b border-line py-3 text-sm last:border-b-0"
          >
            <span className="text-ink">{row.teamName}</span>
            {row.paid ? (
              <span className="text-xs font-semibold text-blue">
                ✅ {row.amount} € · {METHOD_LABELS[row.method ?? ""] ?? row.method}
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  value={amounts[row.fantasyTeamId] ?? "5"}
                  onChange={(e) =>
                    setAmounts((prev) => ({ ...prev, [row.fantasyTeamId]: e.target.value }))
                  }
                  inputMode="decimal"
                  className="w-12 rounded-lg border border-line px-1.5 py-1.5 text-center text-xs"
                />
                <button
                  onClick={() => markPaid(row.fantasyTeamId, "mbway")}
                  disabled={busyId === row.fantasyTeamId}
                  className="rounded-lg bg-gold px-2.5 py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
                >
                  MB WAY
                </button>
                <button
                  onClick={() => markPaid(row.fantasyTeamId, "dinheiro")}
                  disabled={busyId === row.fantasyTeamId}
                  className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
                >
                  Dinheiro
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {message && <p className="mt-3 text-center text-xs text-red">{message}</p>}
    </div>
  );
}
