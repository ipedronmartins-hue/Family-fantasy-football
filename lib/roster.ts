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
 * Assigns a set of selected player ids to formation slots, grouped by
 * position and ordered by shirt number. The formation only encodes how many
 * players of each group are needed and where they sit visually — which
 * specific player lands on which exact slot within a group is not something
 * the parent chooses, so this fills them consistently.
 */
export function assignPlayersToSlots(
  slotGroups: PositionGroup[],
  selectedIds: string[],
  players: Player[]
): (string | undefined)[] {
  const selected = players
    .filter((p) => selectedIds.includes(p.id))
    .sort((a, b) => a.number - b.number);

  const queues = new Map<PositionGroup, string[]>();
  for (const p of selected) {
    const list = queues.get(p.positionGroup) ?? [];
    list.push(p.id);
    queues.set(p.positionGroup, list);
  }

  return slotGroups.map((group) => queues.get(group)?.shift());
}
