"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import { Match } from "@/types/match";

export function PredictionForm({ match, players }: { match: Match; players: Player[] }) {
  const [outcome, setOutcome] = useState<"home" | "draw" | "away">("home");
  const [goalsHome, setGoalsHome] = useState("");
  const [goalsAway, setGoalsAway] = useState("");
  const [scorer, setScorer] = useState("");
  const [assist, setAssist] = useState("");
  const [mvp, setMvp] = useState("");
  const [saved, setSaved] = useState(false);

  const attackers = players.filter((p) => p.positionGroup === "EXT" || p.positionGroup === "AV");
  const homeLabel = match.home ? "Gondomar SC" : match.opponent;
  const awayLabel = match.home ? match.opponent : "Gondomar SC";

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
        onClick={() => setSaved(true)}
        className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white"
      >
        Confirmar previsão
      </button>
      {saved && (
        <p className="mt-3 text-center text-xs text-blue">
          Previsão registada nesta sessão — a gravação definitiva chega com as contas dos pais.
        </p>
      )}
    </div>
  );
}
