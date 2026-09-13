"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function OnboardingForm({ teamSlug, seasonId }: { teamSlug: string; seasonId: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sessão expirada — tenta entrar outra vez.");
      setSaving(false);
      return;
    }

    const { error: parentError } = await supabase.from("parents").insert({
      id: user.id,
      season_id: seasonId,
      display_name: displayName,
    });
    if (parentError) {
      setError(parentError.message);
      setSaving(false);
      return;
    }

    const { error: teamError } = await supabase.from("fantasy_teams").insert({
      parent_id: user.id,
      season_id: seasonId,
      name: teamName,
      formation: "4-3-3",
    });
    if (teamError) {
      setError(teamError.message);
      setSaving(false);
      return;
    }

    router.push(`/${teamSlug}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <label className="mb-1.5 block text-xs font-semibold text-ink/70">O teu nome</label>
      <input
        required
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Ex: Ana Noronha"
        className="mb-4 w-full rounded-xl border border-line px-3 py-2.5"
      />

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">
        Nome da tua equipa Fantasy
      </label>
      <input
        required
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        placeholder="Ex: Família Noronha"
        className="mb-5 w-full rounded-xl border border-line px-3 py-2.5"
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "A criar…" : "Criar equipa"}
      </button>
      {error && <p className="mt-3 text-center text-xs text-red">{error}</p>}
    </form>
  );
}
