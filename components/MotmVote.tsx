"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Player } from "@/types/player";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function MotmVote({
  matchId,
  players,
  initialVote,
}: {
  matchId: string;
  players: Player[];
  initialVote: string | null;
}) {
  const router = useRouter();
  const [vote, setVote] = useState(initialVote);
  const [saving, setSaving] = useState(false);

  async function castVote(playerId: string) {
    setSaving(true);
    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("motm_votes")
      .upsert(
        { match_id: matchId, parent_id: user.id, player_id: playerId },
        { onConflict: "match_id,parent_id" }
      );

    setSaving(false);
    if (!error) {
      setVote(playerId);
      router.refresh();
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <h2 className="mb-1 font-display text-sm font-semibold text-ink">
        Vota no jogador da jornada
      </h2>
      <p className="mb-3 text-xs text-ink/50">O teu voto conta para decidir o Homem do Jogo.</p>
      <div className="flex flex-wrap gap-1.5">
        {players.map((p) => (
          <button
            key={p.id}
            disabled={saving}
            onClick={() => castVote(p.id)}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
              vote === p.id ? "border-gold bg-gold text-ink" : "border-line text-ink/70"
            }`}
          >
            {p.number} {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
