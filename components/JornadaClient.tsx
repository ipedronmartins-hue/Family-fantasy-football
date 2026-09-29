"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import { PitchBuilder } from "@/components/PitchBuilder";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { FORMATIONS_BY_FORMAT, formationIdsFor, TeamFormat } from "@/config/formations";

export interface InitialGuess {
  goalsHome: string;
  goalsAway: string;
  scorer: string;
  assist: string;
  mvp: string;
}

function deriveOutcome(h: string, a: string): "home" | "draw" | "away" | null {
  if (h === "" || a === "") return null;
  const hn = Number(h);
  const an = Number(a);
  if (Number.isNaN(hn) || Number.isNaN(an)) return null;
  return hn > an ? "home" : hn < an ? "away" : "draw";
}

export function JornadaClient({
  roster,
  fantasyTeamId,
  matchId,
  homeLabel,
  awayLabel,
  locked,
  format,
  initialFormation,
  initialSelected,
  initialCaptain,
  initialViceCaptain,
  initialGuess,
}: {
  roster: Player[];
  fantasyTeamId: string;
  matchId: string;
  homeLabel: string;
  awayLabel: string;
  locked: boolean;
  format: TeamFormat;
  initialFormation: string;
  initialSelected: string[];
  initialCaptain: string | null;
  initialViceCaptain: string | null;
  initialGuess: InitialGuess | null;
}) {
  const formationIds = formationIdsFor(format);
  const [formation, setFormation] = useState<string>(
    formationIds.includes(initialFormation) ? initialFormation : formationIds[0]
  );
  const totalRequired = FORMATIONS_BY_FORMAT[format][formation].length;

  const [assignments, setAssignments] = useState<(string | null)[]>(() =>
    Array.from({ length: totalRequired }, (_, i) => initialSelected[i] ?? null)
  );
  const [captain, setCaptain] = useState<string | null>(initialCaptain);
  const [viceCaptain, setViceCaptain] = useState<string | null>(initialViceCaptain);

  const [goalsHome, setGoalsHome] = useState(initialGuess?.goalsHome ?? "");
  const [goalsAway, setGoalsAway] = useState(initialGuess?.goalsAway ?? "");
  const [scorer, setScorer] = useState(initialGuess?.scorer ?? "");
  const [assist, setAssist] = useState(initialGuess?.assist ?? "");
  const [mvp, setMvp] = useState(initialGuess?.mvp ?? "");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const selectedCount = assignments.filter((id) => id).length;
  const lineupDone = selectedCount === totalRequired && captain !== null && viceCaptain !== null;
  const outcome = deriveOutcome(goalsHome, goalsAway);
  const outcomeLabel =
    outcome === "home" ? `${homeLabel} vence` : outcome === "away" ? `${awayLabel} vence` : outcome === "draw" ? "Empate" : null;
  const guessesDone = [goalsHome !== "" && goalsAway !== "", scorer, assist, mvp].filter(Boolean).length;
  const sortedRoster = [...roster].sort((a, b) => a.number - b.number);

  function changeFormation(id: string) {
    setFormation(id);
    setAssignments(Array.from({ length: FORMATIONS_BY_FORMAT[format][id].length }, () => null));
    setCaptain(null);
    setViceCaptain(null);
    setMessage(null);
  }

  function handleAssignmentsChange(next: (string | null)[]) {
    setMessage(null);
    setAssignments(next);
    const stillIn = new Set(next.filter((id) => id));
    if (captain && !stillIn.has(captain)) setCaptain(null);
    if (viceCaptain && !stillIn.has(viceCaptain)) setViceCaptain(null);
  }

  function pickCaptain(id: string) {
    setCaptain(id);
    if (viceCaptain === id) setViceCaptain(null);
  }
  function pickVice(id: string) {
    setViceCaptain(id);
    if (captain === id) setCaptain(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const playerIds = assignments.filter((id): id is string => !!id);

    // 1. O onze (pontos pelo que os jogadores fazem)
    const { error: delErr } = await supabase
      .from("fantasy_lineups")
      .delete()
      .eq("fantasy_team_id", fantasyTeamId)
      .eq("match_id", matchId);
    if (delErr) return fail(delErr.message);

    const { error: insErr } = await supabase.from("fantasy_lineups").insert(
      playerIds.map((playerId) => ({
        fantasy_team_id: fantasyTeamId,
        match_id: matchId,
        player_id: playerId,
        is_captain: playerId === captain,
        is_vice_captain: playerId === viceCaptain,
      }))
    );
    if (insErr) return fail(insErr.message);

    const { error: teamErr } = await supabase.from("fantasy_teams").update({ formation }).eq("id", fantasyTeamId);
    if (teamErr) return fail(teamErr.message);

    // 2. Os palpites
    const { data: pred, error: predErr } = await supabase
      .from("predictions")
      .upsert(
        {
          fantasy_team_id: fantasyTeamId,
          match_id: matchId,
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
    if (predErr || !pred) return fail(predErr?.message ?? "Não foi possível guardar os palpites.");

    // 3. O mesmo onze conta como "titulares acertados"
    await supabase.from("predicted_lineups").delete().eq("prediction_id", pred.id);
    const { error: plErr } = await supabase
      .from("predicted_lineups")
      .insert(playerIds.map((playerId) => ({ prediction_id: pred.id, player_id: playerId })));
    if (plErr) return fail(plErr.message);

    setSaving(false);
    setMessage({ ok: true, text: "Jornada guardada! Podes alterar até o admin fechar." });

    function fail(text: string) {
      setSaving(false);
      setMessage({ ok: false, text: `${text} Tenta outra vez.` });
    }
  }

  if (locked) {
    return (
      <div className="rounded-2xl border border-line bg-white p-4 text-center text-sm text-ink/60">
        Esta jornada já está fechada — a tua escolha ficou registada como estava.
      </div>
    );
  }

  const stepBadge = (done: boolean, n: number) => (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
        done ? "bg-blue text-white" : "bg-line text-ink/60"
      }`}
    >
      {done ? "✓" : n}
    </span>
  );

  const playerOptions = sortedRoster.map((p) => (
    <option key={p.id} value={p.id}>
      {p.number} · {p.name}
    </option>
  ));

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex items-center gap-2">
          {stepBadge(lineupDone, 1)}
          <h2 className="font-display text-lg font-semibold text-ink">O teu onze</h2>
        </div>
        <p className="mb-3 text-xs text-ink/50">
          Ganhas pontos pelo que estes jogadores fazem, e mais pontos por cada um que seja mesmo
          titular. O capitão dobra os pontos.
        </p>

        <div className="mb-3 flex gap-2 overflow-x-auto">
          {formationIds.map((id) => (
            <button
              key={id}
              onClick={() => changeFormation(id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                formation === id ? "border-blue bg-blue text-white" : "border-line bg-white text-ink/70"
              }`}
            >
              {id}
            </button>
          ))}
        </div>

        <p className="mb-3 text-center text-sm font-semibold text-ink">
          {selectedCount} / {totalRequired} em campo
          {captain && " · Capitão ✓"}
          {viceCaptain && " · Vice ✓"}
        </p>

        <PitchBuilder
          slots={FORMATIONS_BY_FORMAT[format][formation]}
          roster={roster}
          assignments={assignments}
          onAssignmentsChange={handleAssignmentsChange}
          captain={captain}
          viceCaptain={viceCaptain}
          onPickCaptain={pickCaptain}
          onPickViceCaptain={pickVice}
        />
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          {stepBadge(guessesDone === 4, 2)}
          <h2 className="font-display text-lg font-semibold text-ink">Os teus palpites</h2>
        </div>

        <label className="mb-1.5 block text-xs font-semibold text-ink/70">Resultado</label>
        <div className="mb-1 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-right text-xs text-ink/60">{homeLabel}</span>
          <input
            value={goalsHome}
            onChange={(e) => setGoalsHome(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            className="w-14 rounded-xl border border-line px-2 py-2 text-center"
          />
          <span className="text-ink/40">—</span>
          <input
            value={goalsAway}
            onChange={(e) => setGoalsAway(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            className="w-14 rounded-xl border border-line px-2 py-2 text-center"
          />
          <span className="min-w-0 flex-1 truncate text-xs text-ink/60">{awayLabel}</span>
        </div>
        <p className="mb-4 text-center text-xs text-ink/50">
          {outcomeLabel ? `Previsto: ${outcomeLabel}` : "Preenche os golos para veres o resultado previsto."}
        </p>

        <label className="mb-1.5 block text-xs font-semibold text-ink/70">Marcador</label>
        <select
          value={scorer}
          onChange={(e) => setScorer(e.target.value)}
          className="mb-4 w-full rounded-xl border border-line px-3 py-2"
        >
          <option value="">Escolher jogador</option>
          {playerOptions}
        </select>

        <label className="mb-1.5 block text-xs font-semibold text-ink/70">Assistência</label>
        <select
          value={assist}
          onChange={(e) => setAssist(e.target.value)}
          className="mb-4 w-full rounded-xl border border-line px-3 py-2"
        >
          <option value="">Escolher jogador</option>
          {playerOptions}
        </select>

        <label className="mb-1.5 block text-xs font-semibold text-ink/70">
          Homem do Jogo (o jogador mais votado pelos pais)
        </label>
        <select
          value={mvp}
          onChange={(e) => setMvp(e.target.value)}
          className="w-full rounded-xl border border-line px-3 py-2"
        >
          <option value="">Escolher jogador</option>
          {playerOptions}
        </select>
      </section>

      <div>
        <button
          onClick={save}
          disabled={!lineupDone || saving}
          className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {saving ? "A guardar…" : "Guardar jornada"}
        </button>
        {!lineupDone && (
          <p className="mt-2 text-center text-xs text-ink/50">
            Falta o onze completo com capitão (C) e vice (VC) para poderes guardar.
          </p>
        )}
        {lineupDone && guessesDone < 4 && (
          <p className="mt-2 text-center text-xs text-ink/50">
            Podes guardar já, mas cada palpite em falta são pontos que ficam por ganhar.
          </p>
        )}
        {message && (
          <p className={`mt-3 text-center text-xs ${message.ok ? "text-blue" : "text-red"}`}>{message.text}</p>
        )}
      </div>
    </div>
  );
}
