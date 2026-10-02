"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export interface FamilyRow {
  fantasyTeamId: string;
  teamName: string;
  paid: boolean;
  amount: number | null;
  method: string | null;
  paymentId: string | null;
}

const METHOD_LABELS: Record<string, string> = { mbway: "MB WAY", dinheiro: "Dinheiro" };

export function PaymentsClient({
  month,
  families,
}: {
  month: string; // YYYY-MM-01
  families: FamilyRow[];
}) {
  const router = useRouter();
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
    const row = rows.find((r) => r.fantasyTeamId === fantasyTeamId);
    const ok = window.confirm(
      `Registar ${amount} € de «${row?.teamName}» (${METHOD_LABELS[method]})?\n\nIsto só regista quem pagou — não mexe no fundo. Lança a receita à parte, em «Registar movimento».`
    );
    if (!ok) return;
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
    router.refresh();
  }

  async function revoke(row: FamilyRow) {
    if (!row.paymentId) return;
    const ok = window.confirm(
      `Anular o contributo de «${row.teamName}» (${row.amount} €)?\n\nIsto não mexe no fundo: se já lançaste a receita, remove-a à parte. Fica registado no histórico.`
    );
    if (!ok) return;
    setBusyId(row.fantasyTeamId);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("revoke_family_payment", {
      p_payment_id: row.paymentId,
      p_reason: null,
    });
    setBusyId(null);
    if (error) {
      setMessage("Não foi possível anular. Tenta outra vez.");
      return;
    }
    router.refresh();
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue">
                  ✅ {row.amount} € · {METHOD_LABELS[row.method ?? ""] ?? row.method}
                </span>
                <button
                  onClick={() => revoke(row)}
                  disabled={busyId === row.fantasyTeamId}
                  className="rounded-lg border border-red/40 px-2 py-1 text-[11px] font-semibold text-red disabled:opacity-50"
                >
                  Anular
                </button>
              </div>
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
