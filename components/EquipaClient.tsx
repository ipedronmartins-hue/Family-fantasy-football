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
  initialFormation,
  initialSelected,
  initialCaptain,
}: {
  roster: Player[];
  fantasyTeamId: string;
  initialFormation: FormationId;
  initialSelected: string[];
  initialCaptain: string | null;
}) {
  const [formation, setFormation] = useState<FormationId>(initialFormation);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [captain, setCaptain] = useState<string | null>(initialCaptain);
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
  const complete = selected.size === totalRequired && captain !== null;

  function toggle(player: Player) {
    setMessage(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(player.id)) {
        next.delete(player.id);
        if (captain === player.id) setCaptain(null);
      } else {
        if (selectedByGroup[player.positionGroup] >= required[player.positionGroup]) return prev;
        next.add(player.id);
      }
      return next;
    });
  }

  function changeFormation(id: FormationId) {
    setFormation(id);
    setSelected(new Set());
    setCaptain(null);
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const supabase = createBrowserSupabase();

    const { error: deleteError } = await supabase
      .from("fantasy_lineups")
      .delete()
      .eq("fantasy_team_id", fantasyTeamId);

    if (deleteError) {
      setMessage(deleteError.message);
      setSaving(false);
      return;
    }

    const rows = Array.from(selected).map((playerId) => ({
      fantasy_team_id: fantasyTeamId,
      player_id: playerId,
      is_captain: playerId === captain,
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
    setMessage(teamError ? teamError.message : "Equipa guardada.");
  }

  const slotGroups = FORMATIONS[formation].map((s) => s.group);
  const previewLineup = assignPlayersToSlots(slotGroups, Array.from(selected), roster);

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
        {captain && ` · Capitão escolhido`}
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
                const disabled =
                  !isSelected && selectedByGroup[group] >= required[group];
                return (
                  <li
                    key={player.id}
                    className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
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
                    <span className="text-sm text-ink">{player.name}</span>
                    {isSelected && (
                      <button
                        onClick={() => setCaptain(player.id)}
                        className={`ml-auto text-xs font-semibold ${
                          isCaptain ? "text-gold" : "text-ink/30"
                        }`}
                      >
                        {isCaptain ? "★ Capitão" : "☆ Capitão"}
                      </button>
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
        {saving ? "A guardar…" : "Guardar equipa"}
      </button>
      {!complete && (
        <p className="mt-2 text-center text-xs text-ink/50">
          Escolhe os {totalRequired} titulares e marca um capitão para poderes guardar.
        </p>
      )}
      {message && <p className="mt-3 text-center text-xs text-blue">{message}</p>}
    </>
  );
}
