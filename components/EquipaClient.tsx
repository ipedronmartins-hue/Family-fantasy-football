"use client";

import { useMemo, useState } from "react";
import { Player, PositionGroup, POSITION_GROUP_ORDER, POSITION_GROUP_LABELS } from "@/types/player";
import { groupRosterByPosition, assignPlayersToSlots } from "@/lib/roster";
import { Pitch } from "@/components/Pitch";
import { createBrowserSupabase } from "@/lib/supabase/client";
import {
  FORMATIONS,
  FORMATION_LABELS,
  FormationId,
} from "@/config/formations";

const FORMATION_IDS = Object.keys(FORMATIONS) as FormationId[];

function countsByGroup(formation: FormationId): Record<PositionGroup, number> {
  const counts = { GR: 0, DEF: 0, MED: 0, EXT: 0, AV: 0 } as Record<PositionGroup, number>;
  for (const slot of FORMATIONS[formation]) counts[slot.group]++;
  return counts;
}

export function EquipaClient({
  roster,
  fantasyTeamId,
  matchId,
  locked,
  initialFormation,
  initialSelected,
  initialCaptain,
  initialViceCaptain,
}: {
  roster: Player[];
  fantasyTeamId: string;
  matchId: string;
  locked: boolean;
  initialFormation: FormationId;
  initialSelected: string[];
  initialCaptain: string | null;
  initialViceCaptain: string | null;
}) {
  const [formation, setFormation] = useState<FormationId>(initialFormation);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [captain, setCaptain] = useState<string | null>(initialCaptain);
  const [viceCaptain, setViceCaptain] = useState<string | null>(initialViceCaptain);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const required = countsByGroup(formation);
  const sections = groupRosterByPosition(roster);

  const selectedByGroup = useMemo(() => {
    const counts = { GR: 0, DEF: 0, MED: 0, EXT: 0, AV: 0 } as Record<PositionGroup, number>;
    for (const p of roster) if (selected.has(p.id)) counts[p.positionGroup]++;
    return counts;
  }, [selected, roster]);

  const totalRequired = Object.values(required).reduce((a, b) => a + b, 0);
  const complete = selected.size === totalRequired && captain !== null && viceCaptain !== null;

  function toggle(player: Player) {
    setMessage(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(player.id)) {
        next.delete(player.id);
        if (captain === player.id) setCaptain(null);
        if (viceCaptain === player.id) setViceCaptain(null);
      } else {
        if (selectedByGroup[player.positionGroup] >= required[player.positionGroup]) return prev;
        next.add(player.id);
      }
      return next;
    });
  }

  function pickCaptain(playerId: string) {
    setCaptain(playerId);
    if (viceCaptain === playerId) setViceCaptain(null);
  }

  function pickViceCaptain(playerId: string) {
    setViceCaptain(playerId);
    if (captain === playerId) setCaptain(null);
  }

  function changeFormation(id: FormationId) {
    setFormation(id);
    setSelected(new Set());
    setCaptain(null);
    setViceCaptain(null);
    setMessage(null);
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

    const rows = Array.from(selected).map((playerId) => ({
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

  const slotGroups = FORMATIONS[formation].map((s) => s.group);
  const previewLineup = assignPlayersToSlots(slotGroups, Array.from(selected), roster);

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
        {FORMATION_IDS.map((id) => (
          <button
            key={id}
            onClick={() => changeFormation(id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
              formation === id
                ? "border-blue bg-blue text-white"
                : "border-line bg-white text-ink/70"
            }`}
          >
            {FORMATION_LABELS[id]}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <Pitch
          slots={FORMATIONS[formation]}
          lineupIds={previewLineup.map((id) => id ?? "")}
          players={roster}
        />
      )}

      <p className="my-3 text-center text-sm font-semibold text-ink">
        {selected.size} / {totalRequired} selecionados
        {captain && ` · Capitão ✓`}
        {viceCaptain && ` · Vice ✓`}
      </p>

      {POSITION_GROUP_ORDER.map((group) => {
        const section = sections.find((s) => s.group === group);
        if (!section || required[group] === 0) return null;
        return (
          <section key={group} className="mb-5">
            <h2 className="mb-2 border-l-4 border-blue pl-3 font-display text-base font-semibold text-ink">
              {POSITION_GROUP_LABELS[group]} · {selectedByGroup[group]}/{required[group]}
            </h2>
            <ul className="rounded-2xl border border-line bg-white px-4">
              {section.players.map((player) => {
                const isSelected = selected.has(player.id);
                const isCaptain = captain === player.id;
                const isVice = viceCaptain === player.id;
                const disabled =
                  !isSelected && selectedByGroup[group] >= required[group];
                return (
                  <li
                    key={player.id}
                    className="flex items-center gap-2 border-b border-line py-2.5 last:border-b-0"
                  >
                    <button
                      onClick={() => toggle(player)}
                      disabled={disabled}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-semibold ${
                        isSelected
                          ? "bg-blue text-white"
                          : disabled
                          ? "bg-line text-ink/30"
                          : "bg-line text-ink"
                      }`}
                    >
                      {player.number}
                    </button>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{player.name}</span>
                    {isSelected && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => pickCaptain(player.id)}
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            isCaptain ? "bg-gold text-ink" : "bg-line text-ink/50"
                          }`}
                        >
                          C
                        </button>
                        <button
                          onClick={() => pickViceCaptain(player.id)}
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            isVice ? "bg-blue/20 text-blue" : "bg-line text-ink/50"
                          }`}
                        >
                          VC
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <button
        onClick={save}
        disabled={!complete || saving}
        className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        {saving ? "A guardar…" : "Guardar equipa desta jornada"}
      </button>
      {!complete && (
        <p className="mt-2 text-center text-xs text-ink/50">
          Escolhe os {totalRequired} titulares e marca um capitão (C) e um vice (VC) para
          poderes guardar. Se o capitão falhar o Homem do Jogo, o bónus passa para o vice.
        </p>
      )}
      {message && <p className="mt-3 text-center text-xs text-blue">{message}</p>}
    </>
  );
}
