"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import { Match } from "@/types/match";
import { createBrowserSupabase } from "@/lib/supabase/client";

interface InitialPrediction {
  outcome: "home" | "draw" | "away";
  goalsHome: string;
  goalsAway: string;
  scorer: string;
  assist: string;
  mvp: string;
}

export function PredictionForm({
  match,
  players,
  fantasyTeamId,
  initial,
}: {
  match: Match;
  players: Player[];
  fantasyTeamId: string;
  initial: InitialPrediction | null;
}) {
  const [outcome, setOutcome] = useState<"home" | "draw" | "away">(initial?.outcome ?? "home");
  const [goalsHome, setGoalsHome] = useState(initial?.goalsHome ?? "");
  const [goalsAway, setGoalsAway] = useState(initial?.goalsAway ?? "");
  const [scorer, setScorer] = useState(initial?.scorer ?? "");
  const [assist, setAssist] = useState(initial?.assist ?? "");
  const [mvp, setMvp] = useState(initial?.mvp ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const attackers = players.filter((p) => p.positionGroup === "EXT" || p.positionGroup === "AV");
  const homeLabel = match.home ? "Gondomar SC" : match.opponent;
  const awayLabel = match.home ? match.opponent : "Gondomar SC";

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const supabase = createBrowserSupabase();

    const { error } = await supabase.from("predictions").upsert(
      {
        fantasy_team_id: fantasyTeamId,
        match_id: match.id,
        predicted_home_goals: goalsHome === "" ? null : Number(goalsHome),
        predicted_away_goals: goalsAway === "" ? null : Number(goalsAway),
        predicted_scorer_id: scorer || null,
        predicted_assist_id: assist || null,
        predicted_mvp_id: mvp || null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "fantasy_team_id,match_id" }
    );

    setSaving(false);
    setMessage(error ? error.message : "Previsão guardada.");
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Resultado</label>
      <div className="mb-4 flex gap-2">
        {(["home", "draw", "away"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setOutcome(key)}
            className={`flex-1 rounded-full border px-2 py-2 text-xs font-semibold ${
              outcome === key ? "border-blue bg-blue text-white" : "border-line text-ink/70"
            }`}
          >
            {key === "home" ? homeLabel : key === "draw" ? "Empate" : awayLabel}
          </button>
        ))}
      </div>

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Resultado exato</label>
      <div className="mb-4 flex items-center gap-2">
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

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Marcador</label>
      <select
        value={scorer}
        onChange={(e) => setScorer(e.target.value)}
        className="mb-4 w-full rounded-xl border border-line px-3 py-2"
      >
        <option value="">Escolher jogador</option>
        {attackers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
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
