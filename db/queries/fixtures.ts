import { supabase } from "@/lib/supabaseClient";
import { Match } from "@/types/match";

interface MatchRow {
  id: string;
  matchday: number;
  opponent: string;
  competition: string | null;
  kickoff_at: string;
  home: boolean;
  featured: boolean;
  home_goals: number | null;
  away_goals: number | null;
  status: "scheduled" | "live" | "finished";
}

const SELECT = "id, matchday, opponent, competition, kickoff_at, home, featured, home_goals, away_goals, status";

function mapRow(row: MatchRow): Match {
  return {
    id: row.id,
    code: `J${row.matchday}`,
    matchday: row.matchday,
    opponent: row.opponent,
    date: row.kickoff_at.slice(0, 10),
    home: row.home,
    competition: row.competition ?? "",
    featured: row.featured,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    status: row.status,
  };
}

export async function getFixtures(seasonId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(SELECT)
    .eq("season_id", seasonId)
    .order("kickoff_at");

  if (error) throw new Error(`Failed to load fixtures: ${error.message}`);
  return (data as MatchRow[]).map(mapRow);
}

export async function getNextFixture(seasonId: string, referenceDate: Date = new Date()): Promise<Match> {
  // A match already underway takes priority over "next scheduled", even
  // though its kickoff time is technically in the past by now.
  const { data: liveMatch } = await supabase
    .from("matches")
    .select(SELECT)
    .eq("season_id", seasonId)
    .eq("status", "live")
    .order("kickoff_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (liveMatch) return mapRow(liveMatch as MatchRow);

  const { data, error } = await supabase
    .from("matches")
    .select(SELECT)
    .eq("season_id", seasonId)
    .gte("kickoff_at", referenceDate.toISOString())
    .order("kickoff_at")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to load next fixture: ${error.message}`);
  if (data) return mapRow(data as MatchRow);

  const all = await getFixtures(seasonId);
  return all[all.length - 1];
}

/** `code` is the "J9"-style label used in URLs, not the database id. */
export async function getFixtureByCode(seasonId: string, code: string): Promise<Match | undefined> {
  const matchday = Number(code.replace("J", ""));
  const { data, error } = await supabase
    .from("matches")
    .select(SELECT)
    .eq("season_id", seasonId)
    .eq("matchday", matchday)
    .maybeSingle();

  if (error) throw new Error(`Failed to load fixture ${code}: ${error.message}`);
  return data ? mapRow(data as MatchRow) : undefined;
}
