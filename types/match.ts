export interface Match {
  /** Matchday label as used by the club, e.g. "J1". */
  id: string;
  matchday: number;
  opponent: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  home: boolean;
  competition: string;
  /** Marks a fixture parents will want to circle on the calendar (e.g. vs a big club). */
  featured?: boolean;
}
