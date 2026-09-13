"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function NewMatchForm({
  teamSlug,
  seasonId,
  nextMatchday,
}: {
  teamSlug: string;
  seasonId: string;
  nextMatchday: number;
}) {
  const router = useRouter();
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("15:00");
  const [home, setHome] = useState(true);
  const [competition, setCompetition] = useState("Amigável");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("matches").insert({
      season_id: seasonId,
      matchday: nextMatchday,
      opponent,
      competition,
      kickoff_at: new Date(`${date}T${time}:00`).toISOString(),
      home,
    });

    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push(`/${teamSlug}/admin`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-white p-4">
      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Adversário</label>
      <input
        required
        value={opponent}
        onChange={(e) => setOpponent(e.target.value)}
        className="mb-4 w-full rounded-xl border border-line px-3 py-2"
      />

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Competição</label>
      <input
        required
        value={competition}
        onChange={(e) => setCompetition(e.target.value)}
        className="mb-4 w-full rounded-xl border border-line px-3 py-2"
      />

      <div className="mb-4 flex gap-2">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold text-ink/70">Data</label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold text-ink/70">Hora</label>
          <input
            required
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2"
          />
        </div>
      </div>

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Local</label>
      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={() => setHome(true)}
          className={`flex-1 rounded-full border px-2 py-2 text-xs font-semibold ${
            home ? "border-blue bg-blue text-white" : "border-line text-ink/70"
          }`}
        >
          Casa
        </button>
        <button
          type="button"
          onClick={() => setHome(false)}
          className={`flex-1 rounded-full border px-2 py-2 text-xs font-semibold ${
            !home ? "border-blue bg-blue text-white" : "border-line text-ink/70"
          }`}
        >
          Fora
        </button>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "A guardar…" : "Adicionar jogo"}
      </button>
      {message && <p className="mt-3 text-center text-xs text-red">{message}</p>}
    </form>
  );
}
