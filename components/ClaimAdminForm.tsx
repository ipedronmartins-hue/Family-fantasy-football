"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function ClaimAdminForm({ teamSlug }: { teamSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function claim() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase.rpc("claim_team_admin", { p_code: code });
    setBusy(false);
    if (error || !data) {
      setMessage("Código inválido ou já usado. Confirma o código que recebeste.");
      return;
    }
    router.push(`/${teamSlug}/admin`);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-8 text-xs font-semibold text-blue underline">
        És o administrador desta equipa? Introduz o teu código
      </button>
    );
  }

  return (
    <div className="mt-8 w-full rounded-2xl border border-line bg-white p-4 text-left">
      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Código de administrador</label>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ex: A1B2C3"
        maxLength={6}
        className="mb-3 w-full rounded-xl border border-line px-3 py-2.5 text-center tracking-widest"
      />
      <button
        onClick={claim}
        disabled={busy || code.trim().length < 6}
        className="w-full rounded-xl bg-blue py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "A verificar…" : "Ativar como administrador"}
      </button>
      {message && <p className="mt-2 text-center text-xs text-red">{message}</p>}
    </div>
  );
}
