"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { PlayerChecklist } from "@/components/PlayerChecklist";

export interface GoalRow {
  id: string;
  scorerId: string;
  assistId: string | null;
}

export function AdminMatchForm({
  matchId,
  players,
  initialHomeGoals,
  initialAwayGoals,
  initialMvp,
  initialGoals,
  initialLocked,
  initialRealLineup,
  submittedCount,
  totalTeams,
}: {
  matchId: string;
  players: Player[];
  initialHomeGoals: number | null;
  initialAwayGoals: number | null;
  initialMvp: string | null;
  initialGoals: GoalRow[];
  initialLocked: boolean;
  initialRealLineup: string[];
  submittedCount: number;
  totalTeams: number;
}) {
  const [homeGoals, setHomeGoals] = useState(initialHomeGoals?.toString() ?? "");
  const [awayGoals, setAwayGoals] = useState(initialAwayGoals?.toString() ?? "");
  const [mvp, setMvp] = useState(initialMvp ?? "");
  const [goals, setGoals] = useState<GoalRow[]>(initialGoals);
  const [newScorer, setNewScorer] = useState("");
  const [newAssist, setNewAssist] = useState("");
  const [locked, setLocked] = useState(initialLocked);
  const [realLineup, setRealLineup] = useState<Set<string>>(new Set(initialRealLineup));
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const byId = new Map(players.map((p) => [p.id, p]));

  async function toggleLock() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase
      .from("matches")
      .update({ locked_at: locked ? null : new Date().toISOString() })
      .eq("id", matchId);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setLocked(!locked);
    setMessage(locked ? "Previsões reabertas." : "Previsões fechadas — mais ninguém pode alterar.");
  }

  function toggleRealLineupPlayer(id: string) {
    setRealLineup((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function saveRealLineup() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    await supabase.from("match_lineups").delete().eq("match_id", matchId);
    if (realLineup.size > 0) {
      const rows = Array.from(realLineup).map((playerId) => ({
        match_id: matchId,
        player_id: playerId,
        started: true,
      }));
      const { error } = await supabase.from("match_lineups").insert(rows);
      if (error) {
        setBusy(false);
        setMessage(error.message);
        return;
      }
    }
    setBusy(false);
    setMessage("Onze real guardado.");
  }

  async function saveResult() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase
      .from("matches")
      .update({
        home_goals: homeGoals === "" ? null : Number(homeGoals),
        away_goals: awayGoals === "" ? null : Number(awayGoals),
        man_of_the_match_id: mvp || null,
      })
      .eq("id", matchId);
    setBusy(false);
    setMessage(error ? error.message : "Resultado guardado.");
  }

  async function addGoal() {
    if (!newScorer) return;
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("match_goals")
      .insert({ match_id: matchId, scorer_id: newScorer, assist_id: newAssist || null })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setGoals((prev) => [...prev, { id: data.id, scorerId: newScorer, assistId: newAssist || null }]);
    setNewScorer("");
    setNewAssist("");
  }

  async function removeGoal(id: string) {
    setBusy(true);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("match_goals").delete().eq("id", id);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  async function recalculate() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("recalculate_match_points", { p_match_id: matchId });
    setBusy(false);
    setMessage(error ? error.message : "Pontos recalculados para todos os pais.");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Previsões</h2>
          <span className={`text-xs font-semibold ${locked ? "text-red" : "text-blue"}`}>
            {locked ? "🔒 Fechadas" : "🔓 Abertas"}
          </span>
        </div>
        <p className="mb-3 text-xs text-ink/60">
          {submittedCount} de {totalTeams} equipas já submeteram previsão
        </p>
        <button
          onClick={toggleLock}
          disabled={busy}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 ${
            locked ? "border border-blue text-blue" : "bg-red text-white"
          }`}
        >
          {locked ? "Reabrir previsões" : "Fechar previsões desta jornada"}
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">Onze real (titulares)</h2>
        <PlayerChecklist players={players} selected={realLineup} onToggle={toggleRealLineupPlayer} />
        <button
          onClick={saveRealLineup}
          disabled={busy}
          className="mt-3 w-full rounded-xl border border-blue py-2.5 text-sm font-semibold text-blue disabled:opacity-50"
        >
          Guardar onze real
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">Resultado</h2>
        <div className="mb-3 flex items-center gap-2">
          <input
            value={homeGoals}
            onChange={(e) => setHomeGoals(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            className="w-16 rounded-xl border border-line px-3 py-2 text-center"
          />
          <span className="text-ink/50">—</span>
          <input
            value={awayGoals}
            onChange={(e) => setAwayGoals(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            className="w-16 rounded-xl border border-line px-3 py-2 text-center"
          />
        </div>
        <label className="mb-1.5 block text-xs font-semibold text-ink/70">Homem do Jogo</label>
        <select
          value={mvp}
          onChange={(e) => setMvp(e.target.value)}
          className="mb-3 w-full rounded-xl border border-line px-3 py-2"
        >
          <option value="">Escolher jogador</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={saveResult}
          disabled={busy}
          className="w-full rounded-xl bg-blue py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Guardar resultado
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">Golos</h2>
        <ul className="mb-3">
          {goals.map((g) => (
            <li key={g.id} className="flex items-center gap-2 border-b border-line py-2 text-sm last:border-b-0">
              <span className="flex-1">
                ⚽ {byId.get(g.scorerId)?.name ?? "?"}
                {g.assistId && <span className="text-ink/50"> · assist. {byId.get(g.assistId)?.name}</span>}
              </span>
              <button onClick={() => removeGoal(g.id)} className="text-xs font-semibold text-red">
                remover
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <select
            value={newScorer}
            onChange={(e) => setNewScorer(e.target.value)}
            className="flex-1 rounded-xl border border-line px-2 py-2 text-sm"
          >
            <option value="">Marcador</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={newAssist}
            onChange={(e) => setNewAssist(e.target.value)}
            className="flex-1 rounded-xl border border-line px-2 py-2 text-sm"
          >
            <option value="">Assistência</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={addGoal}
          disabled={busy || !newScorer}
          className="mt-3 w-full rounded-xl border border-blue py-2 text-sm font-semibold text-blue disabled:opacity-50"
        >
          Adicionar golo
        </button>
      </section>

      <button
        onClick={recalculate}
        disabled={busy}
        className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ink disabled:opacity-50"
      >
        Recalcular pontos desta jornada
      </button>
      {message && <p className="text-center text-xs text-blue">{message}</p>}
    </div>
  );
}
