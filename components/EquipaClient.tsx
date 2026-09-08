"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import { playersNotIn } from "@/lib/roster";
import { Pitch } from "@/components/Pitch";
import {
  FORMATIONS,
  FORMATION_LABELS,
  DEFAULT_LINEUPS,
  FormationId,
} from "@/config/formations";

const FORMATION_IDS = Object.keys(FORMATIONS) as FormationId[];

export function EquipaClient({ roster }: { roster: Player[] }) {
  const [formation, setFormation] = useState<FormationId>("4-3-3");
  const lineupIds = DEFAULT_LINEUPS[formation];
  const bench = playersNotIn(roster, lineupIds);

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {FORMATION_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setFormation(id)}
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

      <Pitch slots={FORMATIONS[formation]} lineupIds={lineupIds} players={roster} />

      <section className="mt-6">
        <h2 className="mb-2 border-l-4 border-blue pl-3 font-display text-lg font-semibold text-ink">
          Banco · {bench.length} atletas
        </h2>
        <ul className="rounded-2xl border border-line bg-white px-4">
          {bench.map((player) => (
            <li
              key={player.id}
              className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-line font-display text-xs font-semibold text-ink">
                {player.number}
              </span>
              <span className="text-sm text-ink">{player.name}</span>
              <span className="ml-auto text-xs text-ink/50">{player.positionLabel}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
