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

/**
 * Fills formation slots with the selected players in shirt-number order.
 * Positions are no longer tied to a fixed tag per player -- a parent can
 * put anyone anywhere (a player might have played left-back for half a
 * match despite being "tagged" as a midfielder), so this is purely a
 * consistent visual fill, not a position match.
 */
export function assignPlayersToSlots(
  totalSlots: number,
  selectedIds: string[],
  players: Player[]
): (string | undefined)[] {
  const selected = players
    .filter((p) => selectedIds.includes(p.id))
    .sort((a, b) => a.number - b.number);
  const ids = selected.map((p) => p.id);
  return Array.from({ length: totalSlots }, (_, i) => ids[i]);
}
