"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import { FormationSlot } from "@/config/formations";

export function PitchBuilder({
  slots,
  roster,
  assignments,
  onAssignmentsChange,
  captain,
  viceCaptain,
  onPickCaptain,
  onPickViceCaptain,
}: {
  slots: FormationSlot[];
  roster: Player[];
  assignments: (string | null)[];
  onAssignmentsChange: (next: (string | null)[]) => void;
  captain: string | null;
  viceCaptain: string | null;
  onPickCaptain: (id: string) => void;
  onPickViceCaptain: (id: string) => void;
}) {
  const byId = new Map(roster.map((p) => [p.id, p]));
  const assignedIds = new Set(assignments.filter((id): id is string => !!id));
  const bench = roster.filter((p) => !assignedIds.has(p.id)).sort((a, b) => a.number - b.number);

  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  function toggleSlot(i: number) {
    setActiveSlot(activeSlot === i ? null : i);
  }

  function placePlayer(playerId: string) {
    if (activeSlot === null) return;
    const next = [...assignments];
    next[activeSlot] = playerId;
    onAssignmentsChange(next);
    setActiveSlot(null);
  }

  function clearActiveSlot() {
    if (activeSlot === null) return;
    const next = [...assignments];
    next[activeSlot] = null;
    onAssignmentsChange(next);
    setActiveSlot(null);
  }

  return (
    <div>
      <div
        className="relative h-[420px] overflow-hidden rounded-2xl border-4 border-white"
        style={{
          background:
            "repeating-linear-gradient(90deg, #2f5233 0, #2f5233 10%, #35592f 10%, #35592f 20%)",
        }}
      >
        <div className="absolute inset-x-0 top-1/2 border-t border-white/40" />
        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />

        {slots.map((slot, i) => {
          const playerId = assignments[i];
          const player = playerId ? byId.get(playerId) : undefined;
          const isCaptain = playerId === captain;
          const isVice = playerId === viceCaptain;
          const isActive = activeSlot === i;
          return (
            <button
              key={i}
              onClick={() => toggleSlot(i)}
              className="absolute -translate-x-1/2 translate-y-1/2"
              style={{ left: `${slot.left}%`, bottom: `${slot.bottom}%` }}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 font-display text-sm font-bold ${
                  isActive
                    ? "border-white bg-white text-blue ring-4 ring-white/50"
                    : player
                    ? isCaptain
                      ? "border-gold bg-gold text-ink"
                      : isVice
                      ? "border-blue bg-blue text-white"
                      : "border-gold bg-white text-blue"
                    : "border-dashed border-white/60 bg-white/10 text-white/60"
                }`}
              >
                {player ? player.number : "+"}
              </span>
            </button>
          );
        })}
      </div>

      {activeSlot !== null && (
        <div className="mt-3 rounded-2xl border border-gold bg-gold/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-ink">Toca no jogador para esse lugar</p>
            {assignments[activeSlot] && (
              <button onClick={clearActiveSlot} className="text-xs font-semibold text-red">
                Remover
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bench.map((p) => (
              <button
                key={p.id}
                onClick={() => placePlayer(p.id)}
                className="flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-line text-[10px]">
                  {p.number}
                </span>
                {p.name}
              </button>
            ))}
            {bench.length === 0 && (
              <p className="text-xs text-ink/40">Todos os jogadores já estão em campo.</p>
            )}
          </div>
        </div>
      )}

      {activeSlot === null && (
        <p className="mt-3 text-center text-xs text-ink/50">
          Toca num lugar do campo para escolher quem lá joga.
        </p>
      )}

      {assignments.some((id) => id) && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-ink/60">
            Toca num jogador em campo para o marcar capitão ou vice
          </p>
          <div className="flex flex-wrap gap-1.5">
            {assignments
              .filter((id): id is string => !!id)
              .map((id) => {
                const p = byId.get(id);
                if (!p) return null;
                return (
                  <div key={id} className="flex overflow-hidden rounded-full border border-line">
                    <button
                      onClick={() => onPickCaptain(id)}
                      className={`px-2 py-1 text-[11px] font-semibold ${
                        captain === id ? "bg-gold text-ink" : "bg-white text-ink/50"
                      }`}
                    >
                      C
                    </button>
                    <span className="px-1.5 py-1 text-[11px] text-ink">
                      {p.number} {p.name}
                    </span>
                    <button
                      onClick={() => onPickViceCaptain(id)}
                      className={`px-2 py-1 text-[11px] font-semibold ${
                        viceCaptain === id ? "bg-blue text-white" : "bg-white text-ink/50"
                      }`}
                    >
                      VC
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
