"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export interface ParentRow {
  id: string;
  displayName: string;
  email: string | null;
  status: "pending" | "active" | "suspended";
  teamName: string | null;
}

export function ParentsAdminClient({ parents }: { parents: ParentRow[] }) {
  const [rows, setRows] = useState(parents);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  async function resetPassword(parentId: string) {
    setBusyId(parentId);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("admin_reset_parent_password", {
      p_parent_id: parentId,
      p_password: newPassword,
    });
    setBusyId(null);
    if (error) {
      setMessage(
        error.message.includes("too short")
          ? "A palavra-passe precisa de pelo menos 6 caracteres."
          : "Não foi possível repor a palavra-passe."
      );
      return;
    }
    setMessage(`Palavra-passe reposta. Envia-a ao pai: ${newPassword}`);
    setResetFor(null);
    setNewPassword("");
  }

  async function setStatus(parentId: string, status: "active" | "suspended" | "pending") {
    setBusyId(parentId);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("set_parent_status", {
      p_parent_id: parentId,
      p_status: status,
    });
    setBusyId(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === parentId ? { ...r, status } : r)));
  }

  const pending = rows.filter((r) => r.status === "pending");
  const active = rows.filter((r) => r.status === "active");
  const suspended = rows.filter((r) => r.status === "suspended");

  function Row({ row, actions }: { row: ParentRow; actions: React.ReactNode }) {
    return (
      <li className="border-b border-line py-3 last:border-b-0">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{row.displayName}</p>
            <p className="truncate text-xs text-ink/50">
              {row.teamName ?? "sem equipa"} {row.email ? `· ${row.email}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {actions}
            <button
              onClick={() => {
                setResetFor(resetFor === row.id ? null : row.id);
                setNewPassword("");
              }}
              title="Repor palavra-passe"
              className="rounded-lg border border-line px-2 py-1.5 text-xs"
            >
              🔑
            </button>
          </div>
        </div>
        {resetFor === row.id && (
          <div className="mt-2 flex gap-2">
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova palavra-passe (mín. 6)"
              className="min-w-0 flex-1 rounded-lg border border-line px-2 py-1.5 text-xs"
            />
            <button
              onClick={() => resetPassword(row.id)}
              disabled={busyId === row.id || newPassword.length < 6}
              className="rounded-lg bg-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Repor
            </button>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-6">
      {message && <p className="rounded-xl bg-blue/5 p-2 text-center text-xs text-blue">{message}</p>}

      <section>
        <h2 className="mb-2 font-display text-base font-semibold text-ink">
          Por aprovar {pending.length > 0 ? `(${pending.length})` : ""}
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-4 text-center text-xs text-ink/50">
            Ninguém à espera.
          </p>
        ) : (
          <ul className="rounded-2xl border border-gold bg-gold/10 px-4">
            {pending.map((row) => (
              <Row
                key={row.id}
                row={row}
                actions={
                  <button
                    onClick={() => setStatus(row.id, "active")}
                    disabled={busyId === row.id}
                    className="rounded-lg bg-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Aprovar
                  </button>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-display text-base font-semibold text-ink">
          Ativos ({active.length})
        </h2>
        <ul className="rounded-2xl border border-line bg-white px-4">
          {active.map((row) => (
            <Row
              key={row.id}
              row={row}
              actions={
                <button
                  onClick={() => setStatus(row.id, "suspended")}
                  disabled={busyId === row.id}
                  className="rounded-lg border border-red px-3 py-1.5 text-xs font-semibold text-red disabled:opacity-50"
                >
                  Suspender
                </button>
              }
            />
          ))}
          {active.length === 0 && (
            <p className="py-4 text-center text-xs text-ink/50">Ninguém ativo ainda.</p>
          )}
        </ul>
      </section>

      {suspended.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">
            Suspensos ({suspended.length})
          </h2>
          <ul className="rounded-2xl border border-red/40 bg-red/5 px-4">
            {suspended.map((row) => (
              <Row
                key={row.id}
                row={row}
                actions={
                  <button
                    onClick={() => setStatus(row.id, "active")}
                    disabled={busyId === row.id}
                    className="rounded-lg bg-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Reativar
                  </button>
                }
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
