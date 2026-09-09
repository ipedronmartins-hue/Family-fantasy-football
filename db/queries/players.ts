import { supabase, CURRENT_SEASON_ID } from "@/lib/supabaseClient";
import { Player, PositionGroup } from "@/types/player";

interface PlayerRow {
  id: string;
  external_id: string;
  name: string;
  shirt_number: number;
  position_group: PositionGroup;
  position_label: string;
  traits: string[];
  rating: number | null;
}

function mapRow(row: PlayerRow): Player {
  return {
    id: row.id,
    number: row.shirt_number,
    name: row.name,
    positionGroup: row.position_group,
    positionLabel: row.position_label,
    traits: row.traits ?? [],
    rating: row.rating ?? undefined,
  };
}

export async function getRoster(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("id, external_id, name, shirt_number, position_group, position_label, traits, rating")
    .eq("season_id", CURRENT_SEASON_ID)
    .order("shirt_number");

  if (error) throw new Error(`Failed to load roster: ${error.message}`);
  return (data as PlayerRow[]).map(mapRow);
}
