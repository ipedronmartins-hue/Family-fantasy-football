"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import { PitchBuilder } from "@/components/PitchBuilder";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { FORMATIONS_BY_FORMAT, formationIdsFor, TeamFormat } from "@/config/formations";

export function EquipaClient({
  roster,
  fantasyTeamId,
  matchId,
  locked,
  format,
  initialFormation,
  initialSelected,
  initialCaptain,
  initialViceCaptain,
}: {
  roster: Player[];
  fantasyTeamId: string;
  matchId: string;
  locked: boolean;
  format: TeamFormat;
  initialFormation: string;
  initialSelected: string[];
  initialCaptain: string | null;
  initialViceCaptain: string | null;
}) {
  const formationIds = formationIdsFor(format);
  const [formation, setFormation] = useState<string>(
    formationIds.includes(initialFormation) ? initialFormation : formationIds[0]
  );
  const totalRequired = FORMATIONS_BY_FORMAT[format][formation].length;

  const [assignments, setAssignments] = useState<(string | null)[]>(() => {
    const arr = Array.from({ length: totalRequired }, (_, i) => initialSelected[i] ?? null);
    return arr;
  });
  const [captain, setCaptain] = useState<string | null>(initialCaptain);
  const [viceCaptain, setViceCaptain] = useState<string | null>(initialViceCaptain);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedCount = assignments.filter((id) => id).length;
  const complete = selectedCount === totalRequired && captain !== null && viceCaptain !== null;

  function pickCaptain(playerId: string) {
    setMessage(null);
    setCaptain(playerId);
    if (viceCaptain === playerId) setViceCaptain(null);
  }

  function pickViceCaptain(playerId: string) {
    setMessage(null);
    setViceCaptain(playerId);
    if (captain === playerId) setCaptain(null);
  }

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

  async function save() {
    setSaving(true);
    setMessage(null);
    const supabase = createBrowserSupabase();

    const { error: deleteError } = await supabase
      .from("fantasy_lineups")
      .delete()
      .eq("fantasy_team_id", fantasyTeamId)
      .eq("match_id", matchId);

    if (deleteError) {
      setMessage(deleteError.message);
      setSaving(false);
      return;
    }

    const rows = assignments
      .filter((id): id is string => !!id)
      .map((playerId) => ({
        fantasy_team_id: fantasyTeamId,
        match_id: matchId,
        player_id: playerId,
        is_captain: playerId === captain,
        is_vice_captain: playerId === viceCaptain,
      }));

    const { error: insertError } = await supabase.from("fantasy_lineups").insert(rows);
    if (insertError) {
      setMessage(insertError.message);
      setSaving(false);
      return;
    }

    const { error: teamError } = await supabase
      .from("fantasy_teams")
      .update({ formation })
      .eq("id", fantasyTeamId);

    setSaving(false);
    setMessage(teamError ? teamError.message : "Equipa guardada para esta jornada.");
  }

  if (locked) {
    return (
      <div className="rounded-2xl border border-line bg-white p-4 text-center text-sm text-ink/60">
        O prazo para esta jornada já fechou — a equipa ficou registada como estava.
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {formationIds.map((id) => (
          <button
            key={id}
            onClick={() => changeFormation(id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
              formation === id
                ? "border-blue bg-blue text-white"
                : "border-line bg-white text-ink/70"
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      <p className="mb-3 text-center text-sm font-semibold text-ink">
        {selectedCount} / {totalRequired} em campo
        {captain && ` · Capitão ✓`}
        {viceCaptain && ` · Vice ✓`}
      </p>

      <PitchBuilder
        slots={FORMATIONS_BY_FORMAT[format][formation]}
        roster={roster}
        assignments={assignments}
        onAssignmentsChange={handleAssignmentsChange}
        captain={captain}
        viceCaptain={viceCaptain}
        onPickCaptain={pickCaptain}
        onPickViceCaptain={pickViceCaptain}
      />

      <button
        onClick={save}
        disabled={!complete || saving}
        className="mt-5 w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        {saving ? "A guardar…" : "Guardar equipa desta jornada"}
      </button>
      {!complete && (
        <p className="mt-2 text-center text-xs text-ink/50">
          Coloca os {totalRequired} titulares em campo e marca um capitão (C) e um vice (VC)
          para poderes guardar. Se o capitão falhar o Homem do Jogo, o bónus passa para o vice.
        </p>
      )}
      {message && <p className="mt-3 text-center text-xs text-blue">{message}</p>}
    </>
  );
}
