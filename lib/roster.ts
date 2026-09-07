import { Player, PositionGroup, POSITION_GROUP_ORDER } from "@/types/player";

export function groupRosterByPosition(players: Player[]): { group: PositionGroup; players: Player[] }[] {
  return POSITION_GROUP_ORDER.map((group) => ({
    group,
    players: players
      .filter((p) => p.positionGroup === group)
      .sort((a, b) => a.number - b.number),
  })).filter((section) => section.players.length > 0);
}

export function findPlayer(players: Player[], id: string): Player | undefined {
  return players.find((p) => p.id === id);
}

export function playersNotIn(players: Player[], ids: string[]): Player[] {
  const idSet = new Set(ids);
  return players.filter((p) => !idSet.has(p.id)).sort((a, b) => a.number - b.number);
}
