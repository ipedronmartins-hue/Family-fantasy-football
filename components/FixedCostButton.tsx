"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function FixedCostButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function register() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const month = new Date().toLocaleDateString("pt-PT", { month: "2-digit", year: "numeric" }).replace("/", "/");
    const { error } = await supabase.rpc("register_fixed_cost", {
      p_category: "servidor",
      p_description: `Alojamento da plataforma (Vercel + Supabase) · ${month}`,
      p_amount: 20,
    });
    setBusy(false);
    setMessage(error ? (error.message.includes("already registered") ? "Já registado este mês." : error.message) : "Registado.");
  }

  return (
    <div>
      <button
        onClick={register}
        disabled={busy}
        className="block w-full rounded-2xl border border-line bg-white p-4 text-center text-sm font-semibold text-ink disabled:opacity-50"
      >
        🖥️ Servidor (20€/mês)
      </button>
      {message && <p className="mt-1 text-center text-xs text-ink/50">{message}</p>}
    </div>
  );
}
