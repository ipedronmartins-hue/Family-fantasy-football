"use client";

import { useRef, useState } from "react";
import { Player } from "@/types/player";
import { FormationSlot } from "@/config/formations";

interface DragState {
  playerId: string;
  fromSlot: number | null; // null = came from the bench
  x: number;
  y: number;
}

export function DragPitchBuilder({
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

  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  function hitTestSlot(x: number, y: number): number | null {
    for (let i = 0; i < slotRefs.current.length; i++) {
      const el = slotRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return null;
  }

  function assign(playerId: string, toSlot: number, fromSlot: number | null) {
    const next = [...assignments];
    if (fromSlot !== null) next[fromSlot] = null;
    const displaced = next[toSlot];
    next[toSlot] = playerId;
    if (fromSlot !== null && displaced) next[fromSlot] = displaced;
    onAssignmentsChange(next);
  }

  function clearSlot(slot: number) {
    const next = [...assignments];
    next[slot] = null;
    onAssignmentsChange(next);
  }

  function startDrag(e: React.PointerEvent, playerId: string, fromSlot: number | null) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setActiveSlot(null);
    setDrag({ playerId, fromSlot, x: e.clientX, y: e.clientY });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    setDrag({ ...drag, x: e.clientX, y: e.clientY });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!drag) return;
    const target = hitTestSlot(e.clientX, e.clientY);
    if (target !== null) {
      assign(drag.playerId, target, drag.fromSlot);
    } else if (drag.fromSlot !== null) {
      clearSlot(drag.fromSlot);
    }
    setDrag(null);
  }

  function onSlotTap(i: number) {
    if (drag) return;
    if (assignments[i]) return;
    setActiveSlot(activeSlot === i ? null : i);
  }

  function onBenchTap(playerId: string) {
    if (drag) return;
    if (activeSlot === null) return;
    assign(playerId, activeSlot, null);
    setActiveSlot(null);
  }

  return (
    <div>
      <div
        className="relative h-[420px] touch-none overflow-hidden rounded-2xl border-4 border-white"
        style={{
          background:
            "repeating-linear-gradient(90deg, #2f5233 0, #2f5233 10%, #35592f 10%, #35592f 20%)",
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
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
            <div
              key={i}
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
              className="absolute w-16 -translate-x-1/2 translate-y-1/2 touch-none text-center"
              style={{ left: `${slot.left}%`, bottom: `${slot.bottom}%` }}
              onClick={() => onSlotTap(i)}
            >
              {player ? (
                <div
                  onPointerDown={(e) => startDrag(e, player.id, i)}
                  className="cursor-grab select-none active:cursor-grabbing"
                >
                  <span
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white font-display text-xs font-semibold text-blue ${
                      isCaptain
                        ? "border-gold ring-2 ring-gold"
                        : isVice
                        ? "border-blue ring-2 ring-blue"
                        : "border-gold"
                    }`}
                  >
                    {player.number}
                  </span>
                  <span className="mt-1 block truncate rounded bg-ink/80 px-1 py-0.5 text-[10px] font-medium text-white">
                    {isCaptain ? "© " : isVice ? "Ⓥ " : ""}
                    {player.name}
                  </span>
                </div>
              ) : (
                <span
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed text-xs ${
                    isActive ? "border-gold bg-gold/20" : "border-white/50"
                  }`}
                >
                  +
                </span>
              )}
            </div>
          );
        })}

        {drag && (
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
            style={{ left: drag.x, top: drag.y }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold bg-white font-display text-sm font-semibold text-blue shadow-lg">
              {byId.get(drag.playerId)?.number}
            </span>
          </div>
        )}
      </div>

      {activeSlot !== null && (
        <p className="mt-2 text-center text-xs font-semibold text-gold">
          Escolhe um jogador da lista abaixo para esse lugar ⬇️
        </p>
      )}

      <p className="mb-2 mt-4 text-xs font-semibold text-ink/60">
        Banco — arrasta para o campo, ou toca num lugar vazio e depois num jogador
      </p>
      <div className="flex flex-wrap gap-2">
        {bench.map((p) => (
          <button
            key={p.id}
            onPointerDown={(e) => startDrag(e, p.id, null)}
            onClick={() => onBenchTap(p.id)}
            className="flex touch-none items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink active:cursor-grabbing"
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
                    <span className="px-1.5 py-1 text-[11px] text-ink">{p.name}</span>
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
