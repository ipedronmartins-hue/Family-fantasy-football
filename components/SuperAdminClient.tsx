"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export interface TeamRow {
  teamId: string;
  teamName: string;
  clubName: string;
  status: "active" | "blocked";
  paid: boolean;
  amount: number | null;
}

export function SuperAdminClient({ month, teams }: { month: string; teams: TeamRow[] }) {
  const [rows, setRows] = useState(teams);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function markPaid(teamId: string) {
    setBusyId(teamId);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("register_platform_payment", {
      p_team_id: teamId,
      p_month: month,
      p_amount: 20,
      p_method: "dinheiro",
    });
    setBusyId(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.teamId === teamId ? { ...r, paid: true, amount: 20 } : r)));
  }

  async function toggleStatus(teamId: string, current: "active" | "blocked") {
    setBusyId(teamId);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const next = current === "active" ? "blocked" : "active";
    const { error } = await supabase.from("teams").update({ platform_status: next }).eq("id", teamId);
    setBusyId(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.teamId === teamId ? { ...r, status: next } : r)));
  }

  return (
    <div>
      <ul className="rounded-2xl border border-line bg-white px-4">
        {rows.map((row) => (
          <li key={row.teamId} className="border-b border-line py-3 last:border-b-0">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{row.teamName}</p>
                <p className="text-xs text-ink/50">{row.clubName}</p>
              </div>
              <span className={`text-xs font-semibold ${row.status === "active" ? "text-blue" : "text-red"}`}>
                {row.status === "active" ? "🟢 Ativa" : "🔴 Bloqueada"}
              </span>
            </div>
            <div className="flex gap-2">
              {row.paid ? (
                <span className="flex-1 rounded-lg bg-blue/10 py-1.5 text-center text-xs font-semibold text-blue">
                  ✅ 20€ pagos este mês
                </span>
              ) : (
                <button
                  onClick={() => markPaid(row.teamId)}
                  disabled={busyId === row.teamId}
                  className="flex-1 rounded-lg bg-gold py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
                >
                  Marcar 20€ pagos
                </button>
              )}
              <button
                onClick={() => toggleStatus(row.teamId, row.status)}
                disabled={busyId === row.teamId}
                className="flex-1 rounded-lg border border-line py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
              >
                {row.status === "active" ? "Bloquear" : "Desbloquear"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {message && <p className="mt-3 text-center text-xs text-red">{message}</p>}
    </div>
  );
}
