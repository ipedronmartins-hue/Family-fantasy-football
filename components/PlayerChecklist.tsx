"use client";

import { Player } from "@/types/player";
import { groupRosterByPosition } from "@/lib/roster";
import { POSITION_GROUP_LABELS } from "@/types/player";

export function PlayerChecklist({
  players,
  selected,
  onToggle,
  max = 11,
}: {
  players: Player[];
  selected: Set<string>;
  onToggle: (playerId: string) => void;
  max?: number;
}) {
  const sections = groupRosterByPosition(players);

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-ink/60">
        {selected.size} / {max} selecionados
      </p>
      {sections.map(({ group, players: groupPlayers }) => (
        <div key={group} className="mb-3">
          <p className="mb-1 text-xs font-semibold text-ink/50">{POSITION_GROUP_LABELS[group]}</p>
          <div className="flex flex-wrap gap-1.5">
            {groupPlayers.map((p) => {
              const isSelected = selected.has(p.id);
              const disabled = !isSelected && selected.size >= max;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(p.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    isSelected
                      ? "border-blue bg-blue text-white"
                      : disabled
                      ? "border-line text-ink/30"
                      : "border-line text-ink/70"
                  }`}
                >
                  {p.number} {p.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
