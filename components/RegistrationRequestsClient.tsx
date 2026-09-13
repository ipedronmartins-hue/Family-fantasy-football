"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export interface RequestRow {
  id: string;
  clubName: string;
  teamName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
}

export function RegistrationRequestsClient({ requests }: { requests: RequestRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; slug: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function approve(id: string) {
    setBusyId(id);
    setMessage(null);
    setResult(null);
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase.rpc("approve_team_registration", { p_request_id: id });
    setBusyId(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setResult({ id, slug: data as string });
    router.refresh();
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink/60">
        Sem pedidos pendentes.
      </div>
    );
  }

  return (
    <div>
      <ul className="rounded-2xl border border-line bg-white px-4">
        {requests.map((r) => (
          <li key={r.id} className="border-b border-line py-3 text-sm last:border-b-0">
            <p className="font-semibold text-ink">
              {r.teamName} · {r.clubName}
            </p>
            <p className="mb-2 text-xs text-ink/60">
              {r.contactName} · {r.contactEmail}
              {r.contactPhone ? ` · ${r.contactPhone}` : ""}
            </p>
            {result?.id === r.id ? (
              <p className="text-xs font-semibold text-blue">
                ✅ Aprovado — endereço: /{result.slug}
              </p>
            ) : (
              <button
                onClick={() => approve(r.id)}
                disabled={busyId === r.id}
                className="rounded-lg bg-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {busyId === r.id ? "A aprovar…" : "Aprovar"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {message && <p className="mt-3 text-center text-xs text-red">{message}</p>}
    </div>
  );
}
