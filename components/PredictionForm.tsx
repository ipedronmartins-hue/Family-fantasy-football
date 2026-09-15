"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import { Match } from "@/types/match";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { PlayerChecklist } from "@/components/PlayerChecklist";

interface InitialPrediction {
  goalsHome: string;
  goalsAway: string;
  scorer: string;
  assist: string;
  mvp: string;
}

function deriveOutcome(goalsHome: string, goalsAway: string): "home" | "draw" | "away" | null {
  if (goalsHome === "" || goalsAway === "") return null;
  const h = Number(goalsHome);
  const a = Number(goalsAway);
  if (Number.isNaN(h) || Number.isNaN(a)) return null;
  if (h > a) return "home";
  if (h < a) return "away";
  return "draw";
}

export function PredictionForm({
  match,
  players,
  fantasyTeamId,
  homeTeamName,
  squadSize,
  initial,
  initialLineup,
  locked,
}: {
  match: Match;
  players: Player[];
  fantasyTeamId: string;
  homeTeamName: string;
  squadSize: number;
  initial: InitialPrediction | null;
  initialLineup: string[];
  locked: boolean;
}) {
  const [goalsHome, setGoalsHome] = useState(initial?.goalsHome ?? "");
  const [goalsAway, setGoalsAway] = useState(initial?.goalsAway ?? "");
  const [scorer, setScorer] = useState(initial?.scorer ?? "");
  const [assist, setAssist] = useState(initial?.assist ?? "");
  const [mvp, setMvp] = useState(initial?.mvp ?? "");
  const [lineup, setLineup] = useState<Set<string>>(new Set(initialLineup));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const homeLabel = match.home ? homeTeamName : match.opponent;
  const awayLabel = match.home ? match.opponent : homeTeamName;
  const outcome = deriveOutcome(goalsHome, goalsAway);
  const outcomeLabel =
    outcome === "home" ? `${homeLabel} vence` : outcome === "away" ? `${awayLabel} vence` : outcome === "draw" ? "Empate" : null;

  function toggleLineup(id: string) {
    setLineup((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const supabase = createBrowserSupabase();

    const { data: pred, error } = await supabase
      .from("predictions")
      .upsert(
        {
          fantasy_team_id: fantasyTeamId,
          match_id: match.id,
          predicted_home_goals: goalsHome === "" ? null : Number(goalsHome),
          predicted_away_goals: goalsAway === "" ? null : Number(goalsAway),
          predicted_outcome: outcome,
          predicted_scorer_id: scorer || null,
          predicted_assist_id: assist || null,
          predicted_mvp_id: mvp || null,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "fantasy_team_id,match_id" }
      )
      .select("id")
      .single();

    if (error || !pred) {
      setSaving(false);
      setMessage(error?.message ?? "Não foi possível guardar.");
      return;
    }

    await supabase.from("predicted_lineups").delete().eq("prediction_id", pred.id);
    if (lineup.size > 0) {
      const rows = Array.from(lineup).map((playerId) => ({
        prediction_id: pred.id,
        player_id: playerId,
      }));
      const { error: lineupError } = await supabase.from("predicted_lineups").insert(rows);
      if (lineupError) {
        setSaving(false);
        setMessage(lineupError.message);
        return;
      }
    }

    setSaving(false);
    setMessage("Previsão guardada.");
  }

  if (locked) {
    return (
      <div className="rounded-2xl border border-line bg-white p-4 text-center text-sm text-ink/60">
        As previsões para esta jornada já estão fechadas.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="mb-4 text-xs text-ink/50">
        Isto é o <strong>{squadSize} provável</strong> — quem achas que o treinador vai pôr a
        titular neste jogo. É diferente da tua Fantasy Team (a equipa que montaste em "A Minha
        Equipa").
      </p>

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">{squadSize} provável</label>
      <div className="mb-5">
        <PlayerChecklist players={players} selected={lineup} onToggle={toggleLineup} max={squadSize} />
      </div>

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Resultado exato</label>
      <div className="mb-2 flex items-center gap-2">
        <input
          value={goalsHome}
          onChange={(e) => setGoalsHome(e.target.value)}
          inputMode="numeric"
          placeholder="0"
          className="w-16 rounded-xl border border-line px-3 py-2 text-center"
        />
        <span className="text-ink/50">—</span>
        <input
          value={goalsAway}
          onChange={(e) => setGoalsAway(e.target.value)}
          inputMode="numeric"
          placeholder="0"
          className="w-16 rounded-xl border border-line px-3 py-2 text-center"
        />
      </div>
      <p className="mb-4 text-xs text-ink/50">
        {outcomeLabel ? `Resultado previsto: ${outcomeLabel}` : "Preenche os golos para veres o resultado previsto."}
      </p>

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Marcador</label>
      <select
        value={scorer}
        onChange={(e) => setScorer(e.target.value)}
        className="mb-4 w-full rounded-xl border border-line px-3 py-2"
      >
        <option value="">Escolher jogador</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.setPieces ? ` ⚽ (${p.setPieces})` : ""}
          </option>
        ))}
      </select>

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Assistência</label>
      <select
        value={assist}
        onChange={(e) => setAssist(e.target.value)}
        className="mb-4 w-full rounded-xl border border-line px-3 py-2"
      >
        <option value="">Escolher jogador</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Homem do Jogo</label>
      <select
        value={mvp}
        onChange={(e) => setMvp(e.target.value)}
        className="mb-5 w-full rounded-xl border border-line px-3 py-2"
      >
        <option value="">Escolher jogador</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "A guardar…" : "Confirmar previsão"}
      </button>
      {message && <p className="mt-3 text-center text-xs text-blue">{message}</p>}
    </div>
  );
}
