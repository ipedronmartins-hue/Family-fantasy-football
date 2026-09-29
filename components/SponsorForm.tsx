"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function SponsorForm({ teamSlug, initialName }: { teamSlug: string; initialName: string | null }) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(value: string) {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("set_team_sponsor", { p_name: value });
    setBusy(false);
    if (error) {
      setMessage("Não foi possível guardar.");
      return;
    }
    setName(value.trim());
    setMessage(value.trim() ? "Patrocinador guardado." : "Patrocinador removido.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-4">
        <label className="mb-1.5 block text-xs font-semibold text-ink/70">Nome do patrocinador</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="ex: Ótica d'Ouro"
          className="mb-3 w-full rounded-xl border border-line px-3 py-2.5"
        />
        <button
          onClick={() => save(name)}
          disabled={busy || name.trim() === (initialName ?? "")}
          className="w-full rounded-xl bg-blue py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Guardar
        </button>
        {initialName && (
          <button
            onClick={() => save("")}
            disabled={busy}
            className="mt-2 w-full text-center text-xs font-semibold text-red"
          >
            Remover patrocinador
          </button>
        )}
        {message && <p className="mt-2 text-center text-xs text-blue">{message}</p>}
      </div>

      <div className="rounded-2xl border border-gold bg-gold/10 p-4 text-center">
        <p className="text-xs font-semibold text-ink/60">⭐ HOMEM DO JOGO</p>
        <p className="mt-1 font-display text-lg font-semibold text-ink">Nome do jogador</p>
        <p className="mt-0.5 text-[11px] font-semibold text-gold">
          {name.trim() ? `Oferecido por ${name.trim()}` : "(sem patrocinador)"}
        </p>
        <p className="mt-2 text-[10px] text-ink/40">Assim aparece aos pais</p>
      </div>

      <a href={`/${teamSlug}/admin`} className="block text-center text-xs font-semibold text-blue">
        ← Voltar ao Admin
      </a>
    </div>
  );
}
