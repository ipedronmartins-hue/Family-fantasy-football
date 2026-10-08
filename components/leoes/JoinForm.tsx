"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { PAL_SLUG, palError } from "@/lib/palpites";

export default function JoinForm({ email }: { email: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("pal_join_group", { p_slug: PAL_SLUG, p_name: name });
    if (error) {
      setBusy(false);
      setError(palError(error.message));
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6">
      <p className="text-xs text-ink/60">Conta: {email}</p>
      <label className="mb-1.5 mt-3 block text-xs font-semibold text-ink/70">O teu nome (como aparece no ranking)</label>
      <input
        required
        minLength={2}
        maxLength={60}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ex: Vítor Ferreira"
        className="mb-4 w-full rounded-xl border border-line px-3 py-2.5"
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Um momento…" : "Pedir para entrar"}
      </button>
      {error && <p className="mt-3 text-center text-xs text-red">{error}</p>}
    </form>
  );
}
