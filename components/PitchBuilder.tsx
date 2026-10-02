"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import { FormationSlot } from "@/config/formations";

type Active = { kind: "pitch" | "bench"; index: number } | null;

export function PitchBuilder({
  slots,
  roster,
  assignments,
  onAssignmentsChange,
  bench,
  onBenchChange,
  captain,
  viceCaptain,
  onPickCaptain,
  onPickViceCaptain,
}: {
  slots: FormationSlot[];
  roster: Player[];
  assignments: (string | null)[];
  onAssignmentsChange: (next: (string | null)[]) => void;
  bench: (string | null)[];
  onBenchChange: (next: (string | null)[]) => void;
  captain: string | null;
  viceCaptain: string | null;
  onPickCaptain: (id: string) => void;
  onPickViceCaptain: (id: string) => void;
}) {
  const byId = new Map(roster.map((p) => [p.id, p]));
  const assignedIds = new Set([...assignments, ...bench].filter((id): id is string => !!id));
  const available = roster.filter((p) => !assignedIds.has(p.id)).sort((a, b) => a.number - b.number);

  const [active, setActive] = useState<Active>(null);

  function toggle(kind: "pitch" | "bench", index: number) {
    setActive(active?.kind === kind && active.index === index ? null : { kind, index });
  }

  function setAtActive(value: string | null) {
    if (!active) return;
    if (active.kind === "pitch") {
      const next = [...assignments];
      next[active.index] = value;
      onAssignmentsChange(next);
    } else {
      const next = [...bench];
      next[active.index] = value;
      onBenchChange(next);
    }
    setActive(null);
  }

  const activeHasPlayer = active
    ? !!(active.kind === "pitch" ? assignments[active.index] : bench[active.index])
    : false;

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
          const isActive = active?.kind === "pitch" && active.index === i;
          return (
            <button
              key={i}
              onClick={() => toggle("pitch", i)}
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

      {bench.length > 0 && (
        <div className="mt-3 rounded-2xl border border-line bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-ink/70">
            Banco <span className="font-normal text-ink/50">(opcional) — se um titular não jogar, entra o primeiro suplente que jogue, por esta ordem</span>
          </p>
          <div className="flex gap-3">
            {bench.map((id, i) => {
              const player = id ? byId.get(id) : undefined;
              const isActive = active?.kind === "bench" && active.index === i;
              return (
                <button key={i} onClick={() => toggle("bench", i)} className="flex flex-col items-center gap-1">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full border-2 font-display text-sm font-bold ${
                      isActive
                        ? "border-blue bg-blue/10 text-blue ring-4 ring-blue/20"
                        : player
                        ? "border-blue bg-white text-blue"
                        : "border-dashed border-line bg-white text-ink/40"
                    }`}
                  >
                    {player ? player.number : "+"}
                  </span>
                  <span className="text-[10px] font-semibold text-ink/50">{i + 1}º</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {active !== null && (
        <div className="mt-3 rounded-2xl border border-gold bg-gold/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-ink">
              {active.kind === "bench"
                ? `Toca no jogador para o ${active.index + 1}º suplente`
                : "Toca no jogador para esse lugar"}
            </p>
            {activeHasPlayer && (
              <button onClick={() => setAtActive(null)} className="text-xs font-semibold text-red">
                Remover
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {available.map((p) => (
              <button
                key={p.id}
                onClick={() => setAtActive(p.id)}
                className="flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-line text-[10px]">
                  {p.number}
                </span>
                {p.name}
              </button>
            ))}
            {available.length === 0 && (
              <p className="text-xs text-ink/40">Todos os jogadores já estão no onze ou no banco.</p>
            )}
          </div>
        </div>
      )}

      {active === null && (
        <p className="mt-3 text-center text-xs text-ink/50">
          Toca num lugar do campo (ou do banco) para escolher quem lá joga.
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
