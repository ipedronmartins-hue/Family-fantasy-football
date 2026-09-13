export interface Match {
  /** Real database id — use this for any write (predictions, etc). */
  id: string;
  /** Matchday label as used by the club, e.g. "J1" — for URLs and display. */
  code: string;
  matchday: number;
  opponent: string;
  /** ISO date (YYYY-MM-DD), for display. */
  date: string;
  /** Full ISO timestamp, for deadline calculations. */
  kickoffAt: string;
  home: boolean;
  competition: string;
  /** Marks a fixture parents will want to circle on the calendar (e.g. vs a big club). */
  featured?: boolean;
  homeGoals?: number | null;
  awayGoals?: number | null;
  status?: "scheduled" | "live" | "finished";
}
