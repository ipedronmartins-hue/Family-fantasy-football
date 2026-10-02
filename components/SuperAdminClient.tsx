"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/site";

export interface TeamRow {
  teamId: string;
  teamName: string;
  clubName: string;
  slug: string;
  format: string;
  adminInvite: { email: string; code: string; used: boolean } | null;
  status: "active" | "blocked";
  paid: boolean;
  amount: number | null;
  paymentId: string | null;
}

export function SuperAdminClient({ month, teams }: { month: string; teams: TeamRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(teams);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function revokePaid(row: TeamRow) {
    if (!row.paymentId) return;
    const ok = window.confirm(`Anular o pagamento de 20 € de ${row.clubName} ${row.teamName}?\n\nFica registado no histórico.`);
    if (!ok) return;
    setBusyId(row.teamId);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("revoke_platform_payment", { p_payment_id: row.paymentId, p_reason: null });
    setBusyId(null);
    if (error) {
      setMessage("Não foi possível anular. Tenta outra vez.");
      return;
    }
    router.refresh();
  }

  async function markPaid(teamId: string) {
    const row = rows.find((r) => r.teamId === teamId);
    const ok = window.confirm(`Marcar 20 € como pagos por ${row?.clubName} ${row?.teamName}?`);
    if (!ok) return;
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
    router.refresh();
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
                <p className="text-xs text-ink/50">
                  {row.clubName} · /{row.slug} · {row.format.replace("fut", "Fut")}
                </p>
                {row.adminInvite && (
                  <p className="text-xs text-ink/50">
                    Admin: {row.adminInvite.email} ·{" "}
                    {row.adminInvite.used ? (
                      <span className="text-blue">ativado ✓</span>
                    ) : (
                      <>
                        código <span className="font-mono font-semibold text-ink">{row.adminInvite.code}</span>
                      </>
                    )}
                  </p>
                )}
                {row.adminInvite && !row.adminInvite.used && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      [
                        `Boas! A equipa ${row.clubName} ${row.teamName} foi aprovada no Family Fantasy Formação ⚽`,
                        "",
                        `1. Abre: ${SITE_URL}/${row.slug}`,
                        `2. Cria conta com este email: ${row.adminInvite.email}`,
                        "3. Cria a tua equipa",
                        "4. No ecrã «a aguardar aprovação», escreve este código de administrador:",
                        row.adminInvite.code,
                        "",
                        "Depois vais a Admin → Importar para colar o plantel e o calendário.",
                      ].join("\n")
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-semibold text-[#128C7E]"
                  >
                    📲 Enviar instruções ao responsável
                  </a>
                )}
              </div>
              <span className={`text-xs font-semibold ${row.status === "active" ? "text-blue" : "text-red"}`}>
                {row.status === "active" ? "🟢 Ativa" : "🔴 Bloqueada"}
              </span>
            </div>
            <div className="flex gap-2">
              {row.paid ? (
                <>
                  <span className="flex-1 rounded-lg bg-blue/10 py-1.5 text-center text-xs font-semibold text-blue">
                    ✅ 20€ pagos este mês
                  </span>
                  <button
                    onClick={() => revokePaid(row)}
                    disabled={busyId === row.teamId}
                    className="rounded-lg border border-red/40 px-3 py-1.5 text-xs font-semibold text-red disabled:opacity-50"
                  >
                    Anular
                  </button>
                </>
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
