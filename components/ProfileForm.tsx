"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function ProfileForm({
  teamSlug,
  initialName,
  initialTeam,
}: {
  teamSlug: string;
  initialName: string;
  initialTeam: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialName);
  const [teamName, setTeamName] = useState(initialTeam);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("update_my_profile", {
      p_display_name: displayName,
      p_team_name: teamName,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <label className="mb-1.5 block text-xs font-semibold text-ink/70">O teu nome</label>
      <input
        required
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="mb-1 w-full rounded-xl border border-line px-3 py-2.5"
      />
      <p className="mb-4 text-[11px] text-ink/50">
        Se houver pais com o mesmo nome, acrescenta o apelido ou o filho (ex: Ana – mãe do Vasco).
      </p>

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Nome da tua equipa Fantasy</label>
      <input
        required
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        className="mb-5 w-full rounded-xl border border-line px-3 py-2.5"
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "A guardar…" : "Guardar"}
      </button>
      {ok && <p className="mt-3 text-center text-xs text-green-700">Guardado ✅</p>}
      {error && <p className="mt-3 text-center text-xs text-red">{error}</p>}
      <a href={`/${teamSlug}`} className="mt-4 block text-center text-xs font-semibold text-blue">
        ← Voltar ao início
      </a>
    </form>
  );
}
