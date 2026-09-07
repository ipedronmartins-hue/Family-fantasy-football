import { Player, PositionGroup, POSITION_GROUP_ORDER } from "@/types/player";

export function groupRosterByPosition(players: Player[]): { group: PositionGroup; players: Player[] }[] {
  return POSITION_GROUP_ORDER.map((group) => ({
    group,
    players: players
      .filter((p) => p.positionGroup === group)
      .sort((a, b) => a.number - b.number),
  })).filter((section) => section.players.length > 0);
}
