"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { PlayerChecklist } from "@/components/PlayerChecklist";

export interface GoalRow {
  id: string;
  scorerId: string;
  assistId: string | null;
  isOwnGoal: boolean;
}

type MatchStatus = "scheduled" | "live" | "finished";

export function AdminMatchForm({
  matchId,
  players,
  initialHomeGoals,
  initialAwayGoals,
  initialGoals,
  initialLocked,
  kickoffAt,
  initialRealLineup,
  initialStatus,
  squadSize,
  submittedCount,
  totalTeams,
}: {
  matchId: string;
  players: Player[];
  initialHomeGoals: number | null;
  initialAwayGoals: number | null;
  initialGoals: GoalRow[];
  initialLocked: boolean;
  kickoffAt: string;
  initialRealLineup: string[];
  initialStatus: MatchStatus;
  squadSize: number;
  submittedCount: number;
  totalTeams: number;
}) {
  const [status, setStatus] = useState<MatchStatus>(initialStatus);
  const [liveHome, setLiveHome] = useState(initialHomeGoals ?? 0);
  const [liveAway, setLiveAway] = useState(initialAwayGoals ?? 0);
  const [homeGoals, setHomeGoals] = useState(initialHomeGoals?.toString() ?? "");
  const [awayGoals, setAwayGoals] = useState(initialAwayGoals?.toString() ?? "");
  const [goals, setGoals] = useState<GoalRow[]>(initialGoals);
  const [newScorer, setNewScorer] = useState("");
  const [newAssist, setNewAssist] = useState("");
  const [newOwnGoal, setNewOwnGoal] = useState(false);
  const [locked, setLocked] = useState(initialLocked);
  const [realLineup, setRealLineup] = useState<Set<string>>(new Set(initialRealLineup));
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const byId = new Map(players.map((p) => [p.id, p]));

  async function startLive() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase
      .from("matches")
      .update({ status: "live", home_goals: liveHome, away_goals: liveAway })
      .eq("id", matchId);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setStatus("live");
    setHomeGoals(String(liveHome));
    setAwayGoals(String(liveAway));
  }

  async function endLive() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("matches").update({ status: "finished" }).eq("id", matchId);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setStatus("finished");
  }

  async function adjustLiveGoal(side: "home" | "away", delta: number) {
    const nextHome = side === "home" ? Math.max(0, liveHome + delta) : liveHome;
    const nextAway = side === "away" ? Math.max(0, liveAway + delta) : liveAway;
    setLiveHome(nextHome);
    setLiveAway(nextAway);
    setHomeGoals(String(nextHome));
    setAwayGoals(String(nextAway));
    const supabase = createBrowserSupabase();
    await supabase.from("matches").update({ home_goals: nextHome, away_goals: nextAway }).eq("id", matchId);
  }

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
    // Never delete rows here: they also hold each player's minutes played.
    const selectedIds = Array.from(realLineup);
    if (selectedIds.length > 0) {
      const { error } = await supabase.from("match_lineups").upsert(
        selectedIds.map((playerId) => ({ match_id: matchId, player_id: playerId, started: true })),
        { onConflict: "match_id,player_id" }
      );
      if (error) {
        setBusy(false);
        setMessage(error.message);
        return;
      }
    }
    let clear = supabase.from("match_lineups").update({ started: false }).eq("match_id", matchId);
    if (selectedIds.length > 0) clear = clear.not("player_id", "in", `(${selectedIds.join(",")})`);
    const { error: clearError } = await clear;
    setBusy(false);
    setMessage(clearError ? clearError.message : "Onze real guardado.");
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
      .insert({ match_id: matchId, scorer_id: newScorer, assist_id: newOwnGoal ? null : newAssist || null, is_own_goal: newOwnGoal })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setGoals((prev) => [...prev, { id: data.id, scorerId: newScorer, assistId: newOwnGoal ? null : newAssist || null, isOwnGoal: newOwnGoal }]);
    setNewScorer("");
    setNewAssist("");
    setNewOwnGoal(false);
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
    const [predResult, ownResult] = await Promise.all([
      supabase.rpc("recalculate_match_points", { p_match_id: matchId }),
      supabase.rpc("recalculate_ownership_points", { p_match_id: matchId }),
    ]);
    setBusy(false);
    const error = predResult.error || ownResult.error;
    setMessage(error ? error.message : "Pontos recalculados (Previsão + Equipa) para todos os pais.");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Jogo ao vivo</h2>
          <span
            className={`text-xs font-semibold ${
              status === "live" ? "text-red" : status === "finished" ? "text-ink/40" : "text-blue"
            }`}
          >
            {status === "live" ? "🔴 AO VIVO" : status === "finished" ? "Terminado" : "Por começar"}
          </span>
        </div>

        {status !== "live" ? (
          <button
            onClick={startLive}
            disabled={busy || status === "finished"}
            className="w-full rounded-xl bg-red py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            🔴 Iniciar jogo (ao vivo)
          </button>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="mb-1 text-xs text-ink/50">Casa</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustLiveGoal("home", -1)}
                    className="h-9 w-9 rounded-full border border-line text-lg font-semibold text-ink"
                  >
                    −
                  </button>
                  <span className="w-8 font-display text-3xl font-bold text-ink">{liveHome}</span>
                  <button
                    onClick={() => adjustLiveGoal("home", 1)}
                    className="h-9 w-9 rounded-full bg-blue text-lg font-semibold text-white"
                  >
                    +
                  </button>
                </div>
              </div>
              <span className="text-ink/30">—</span>
              <div className="text-center">
                <p className="mb-1 text-xs text-ink/50">Fora</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustLiveGoal("away", -1)}
                    className="h-9 w-9 rounded-full border border-line text-lg font-semibold text-ink"
                  >
                    −
                  </button>
                  <span className="w-8 font-display text-3xl font-bold text-ink">{liveAway}</span>
                  <button
                    onClick={() => adjustLiveGoal("away", 1)}
                    className="h-9 w-9 rounded-full bg-blue text-lg font-semibold text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={endLive}
              disabled={busy}
              className="w-full rounded-xl border border-line py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
            >
              Terminar jogo
            </button>
          </>
        )}
      </section>

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
        <p className="mb-3 text-xs text-ink/40">
          Só fecham quando tu fechares — não há prazo automático.
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
        <h2 className="mb-3 font-display text-base font-semibold text-ink">{squadSize} titulares (onze real)</h2>
        <PlayerChecklist players={players} selected={realLineup} onToggle={toggleRealLineupPlayer} max={squadSize} />
        <button
          onClick={saveRealLineup}
          disabled={busy}
          className="mt-3 w-full rounded-xl border border-blue py-2.5 text-sm font-semibold text-blue disabled:opacity-50"
        >
          Guardar onze real
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">Resultado final</h2>
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
        <p className="mb-3 text-xs text-ink/40">
          O Homem do Jogo é sempre quem tiver mais votos dos pais — não se escolhe aqui.
        </p>
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
                {g.isOwnGoal ? "⚽ (próprio) " : "⚽ "}
                {byId.get(g.scorerId)?.name ?? "?"}
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
          {!newOwnGoal && (
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
          )}
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-ink/70">
          <input type="checkbox" checked={newOwnGoal} onChange={(e) => setNewOwnGoal(e.target.checked)} />
          Foi um golo na própria baliza
        </label>
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
        Recalcular pontos (Previsão + Equipa)
      </button>
      {message && <p className="text-center text-xs text-blue">{message}</p>}
    </div>
  );
}
