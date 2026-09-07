export interface LeaderboardEntry {
  position: number;
  team: string;
  points: number;
}

/**
 * Example standings — there are no parent accounts yet, so this is
 * illustrative data for the screen, not a real leaderboard.
 */
export const exampleLeaderboard: LeaderboardEntry[] = [
  { position: 1, team: "Família Noronha", points: 231 },
  { position: 2, team: "Os 3-2-1", points: 219 },
  { position: 3, team: "Família Barbosa", points: 205 },
  { position: 4, team: "Pais FC", points: 201 },
  { position: 5, team: "Os Craques", points: 196 },
  { position: 6, team: "Os Pais do Craque", points: 187 },
];
