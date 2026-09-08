import { supabase, CURRENT_SEASON_ID } from "@/lib/supabaseClient";
import { Match } from "@/types/match";

interface MatchRow {
  matchday: number;
  opponent: string;
  competition: string | null;
  kickoff_at: string;
  home: boolean;
  featured: boolean;
}

function mapRow(row: MatchRow): Match {
  return {
    id: `J${row.matchday}`,
    matchday: row.matchday,
    opponent: row.opponent,
    date: row.kickoff_at.slice(0, 10),
    home: row.home,
    competition: row.competition ?? "",
    featured: row.featured,
  };
}

export async function getFixtures(): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("matchday, opponent, competition, kickoff_at, home, featured")
    .eq("season_id", CURRENT_SEASON_ID)
    .order("matchday");

  if (error) throw new Error(`Failed to load fixtures: ${error.message}`);
  return (data as MatchRow[]).map(mapRow);
}

export async function getNextFixture(referenceDate: Date = new Date()): Promise<Match> {
  const { data, error } = await supabase
    .from("matches")
    .select("matchday, opponent, competition, kickoff_at, home, featured")
    .eq("season_id", CURRENT_SEASON_ID)
    .gte("kickoff_at", referenceDate.toISOString())
    .order("kickoff_at")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to load next fixture: ${error.message}`);
  if (data) return mapRow(data as MatchRow);

  // Season is over — fall back to the last matchday.
  const all = await getFixtures();
  return all[all.length - 1];
}

export async function getFixtureById(id: string): Promise<Match | undefined> {
  const matchday = Number(id.replace("J", ""));
  const { data, error } = await supabase
    .from("matches")
    .select("matchday, opponent, competition, kickoff_at, home, featured")
    .eq("season_id", CURRENT_SEASON_ID)
    .eq("matchday", matchday)
    .maybeSingle();

  if (error) throw new Error(`Failed to load fixture ${id}: ${error.message}`);
  return data ? mapRow(data as MatchRow) : undefined;
}
