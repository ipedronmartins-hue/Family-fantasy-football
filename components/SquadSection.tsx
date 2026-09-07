import { Player, PositionGroup, POSITION_GROUP_LABELS } from "@/types/player";
import { PlayerCard } from "./PlayerCard";

export function SquadSection({
  group,
  players,
}: {
  group: PositionGroup;
  players: Player[];
}) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 border-l-4 border-pitch pl-3 font-display text-lg font-semibold text-ink">
        {POSITION_GROUP_LABELS[group]}
      </h2>
      <ul className="rounded-2xl border border-line bg-white px-4">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </ul>
    </section>
  );
}
