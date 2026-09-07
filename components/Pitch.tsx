import { Player } from "@/types/player";
import { FormationSlot } from "@/config/formations";

export function Pitch({
  slots,
  lineupIds,
  players,
}: {
  slots: FormationSlot[];
  lineupIds: string[];
  players: Player[];
}) {
  const byId = new Map(players.map((p) => [p.id, p]));

  return (
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
        const player = byId.get(lineupIds[i]);
        if (!player) return null;
        return (
          <div
            key={i}
            className="absolute w-16 -translate-x-1/2 translate-y-1/2 text-center"
            style={{ left: `${slot.left}%`, bottom: `${slot.bottom}%` }}
          >
            <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 border-gold bg-white font-display text-xs font-semibold text-blue">
              {player.number}
            </span>
            <span className="mt-1 block truncate rounded bg-ink/80 px-1 py-0.5 text-[10px] font-medium text-white">
              {player.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
