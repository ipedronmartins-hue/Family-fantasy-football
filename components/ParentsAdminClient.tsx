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
      <li className="flex items-center gap-2 border-b border-line py-3 last:border-b-0">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{row.displayName}</p>
          <p className="truncate text-xs text-ink/50">
            {row.teamName ?? "sem equipa"} {row.email ? `· ${row.email}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">{actions}</div>
      </li>
    );
  }

  return (
    <div className="space-y-6">
      {message && <p className="text-center text-xs text-red">{message}</p>}

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
