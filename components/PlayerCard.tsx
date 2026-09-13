import { Player } from "@/types/player";

export function PlayerCard({ player }: { player: Player }) {
  return (
    <li className="flex items-start gap-3 border-b border-line py-3 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue font-display text-sm font-semibold text-white">
        {player.number}
      </span>
      <div className="min-w-0">
        <p className="font-display text-base font-semibold leading-tight text-ink">
          {player.name}
        </p>
        <p className="text-sm text-ink/60">{player.positionLabel}</p>
        {player.setPieces && (
          <p className="mt-0.5 text-xs font-semibold text-gold">⚽ {player.setPieces}</p>
        )}
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {player.traits.map((trait) => (
            <li
              key={trait}
              className="rounded-full border border-line px-2 py-0.5 text-xs text-ink/70"
            >
              {trait}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
