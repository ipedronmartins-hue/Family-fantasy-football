import { supabase } from "@/lib/supabaseClient";
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
  set_pieces: string | null;
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
    setPieces: row.set_pieces ?? undefined,
  };
}

export async function getRoster(seasonId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("id, external_id, name, shirt_number, position_group, position_label, traits, rating, set_pieces")
    .eq("season_id", seasonId)
    .order("shirt_number");

  if (error) throw new Error(`Failed to load roster: ${error.message}`);
  return (data as PlayerRow[]).map(mapRow);
}
