"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function MatchSettingsForm({
  teamSlug,
  matchId,
  initial,
}: {
  teamSlug: string;
  matchId: string;
  initial: { opponent: string; competition: string; date: string; time: string; home: boolean };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [opponent, setOpponent] = useState(initial.opponent);
  const [competition, setCompetition] = useState(initial.competition);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [home, setHome] = useState(initial.home);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("update_match_details", {
      p_match_id: matchId,
      p_opponent: opponent,
      p_competition: competition,
      p_kickoff: new Date(`${date}T${time}:00`).toISOString(),
      p_home: home,
    });
    setBusy(false);
    if (error) {
      setMessage(
        error.message.includes("home flag locked")
          ? "Não dá para trocar Casa/Fora: este jogo já tem resultado, golos ou previsões."
          : "Não foi possível guardar. Confirma os campos e tenta outra vez."
      );
      return;
    }
    // A numeração pode ter mudado com a nova data: volta à lista para não ficar numa página desatualizada.
    router.push(`/${teamSlug}/admin`);
    router.refresh();
  }

  async function remove() {
    const ok = window.confirm(
      `Apagar o jogo com «${initial.opponent}»?\n\nSó é possível se ainda não tiver resultado, previsões ou onzes. Não se pode desfazer.`
    );
    if (!ok) return;
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("delete_match", { p_match_id: matchId });
    setBusy(false);
    if (error) {
      setMessage(
        error.message.includes("has data")
          ? "Este jogo já tem resultado, previsões, onzes ou votos, por isso não pode ser apagado."
          : "Não foi possível apagar. Tenta outra vez."
      );
      return;
    }
    router.push(`/${teamSlug}/admin`);
    router.refresh();
  }

  return (
    <div className="mt-8 rounded-2xl border border-line bg-white p-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left font-display text-base font-semibold text-ink"
      >
        ⚙️ Editar ou apagar este jogo
        <span className="text-xs text-ink/40">{open ? "fechar" : "abrir"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/70">Adversário</label>
            <input
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/70">Competição</label>
            <input
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-ink/70">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-xs font-semibold text-ink/70">Hora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/70">Local</label>
            <div className="flex gap-2">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  onClick={() => setHome(value)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold ${
                    home === value ? "border-blue bg-blue text-white" : "border-line bg-white text-ink/70"
                  }`}
                >
                  {value ? "Casa" : "Fora"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={save}
            disabled={busy || !opponent.trim() || !competition.trim() || !date || !time}
            className="w-full rounded-xl bg-blue py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Guardar alterações
          </button>
          <button
            onClick={remove}
            disabled={busy}
            className="w-full rounded-xl border border-red/40 py-2.5 text-sm font-semibold text-red disabled:opacity-40"
          >
            Apagar este jogo
          </button>
          {message && <p className="text-center text-xs text-red">{message}</p>}
        </div>
      )}
    </div>
  );
}
