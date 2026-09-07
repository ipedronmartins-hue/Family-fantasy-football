import { Match } from "@/types/match";

const COMPETITION = "Campeonato Distrital Sub-13 · I Divisão";

export const fixtures: Match[] = [
  { id: "J1", matchday: 1, opponent: "Atl. Alfenense FC", date: "2026-09-19", home: false, competition: COMPETITION },
  { id: "J2", matchday: 2, opponent: "AVS SAD", date: "2026-09-26", home: true, competition: COMPETITION },
  { id: "J3", matchday: 3, opponent: "SC Freamunde", date: "2026-10-03", home: false, competition: COMPETITION },
  { id: "J4", matchday: 4, opponent: "FC Felgueiras 1932", date: "2026-10-10", home: true, competition: COMPETITION },
  { id: "J5", matchday: 5, opponent: "Solar Norte – SCP", date: "2026-10-17", home: false, competition: COMPETITION },
  { id: "J6", matchday: 6, opponent: "FC Penafiel", date: "2026-10-24", home: true, competition: COMPETITION },
  { id: "J7", matchday: 7, opponent: "FC Lagares", date: "2026-10-31", home: true, competition: COMPETITION },
  { id: "J8", matchday: 8, opponent: "FC Paços de Ferreira", date: "2026-11-07", home: false, competition: COMPETITION },
  { id: "J9", matchday: 9, opponent: "FC Porto SAD", date: "2026-11-14", home: true, competition: COMPETITION, featured: true },
  { id: "J10", matchday: 10, opponent: "USC Baltar", date: "2026-11-21", home: false, competition: COMPETITION },
  { id: "J11", matchday: 11, opponent: "Amarante FC", date: "2026-11-28", home: true, competition: COMPETITION },
  { id: "J12", matchday: 12, opponent: "U. Nogueirense FC", date: "2026-12-05", home: false, competition: COMPETITION },
  { id: "J13", matchday: 13, opponent: "AD Lousada", date: "2026-12-12", home: true, competition: COMPETITION },
  { id: "J14", matchday: 14, opponent: "GRD Rans", date: "2026-12-19", home: false, competition: COMPETITION },
  { id: "J15", matchday: 15, opponent: "UD Sousense", date: "2027-01-09", home: true, competition: COMPETITION },
  { id: "J16", matchday: 16, opponent: "Atl. Alfenense FC", date: "2027-01-16", home: true, competition: COMPETITION },
  { id: "J17", matchday: 17, opponent: "AVS SAD", date: "2027-01-23", home: false, competition: COMPETITION },
  { id: "J18", matchday: 18, opponent: "SC Freamunde", date: "2027-01-30", home: true, competition: COMPETITION },
  { id: "J19", matchday: 19, opponent: "FC Felgueiras 1932", date: "2027-02-06", home: false, competition: COMPETITION },
  { id: "J20", matchday: 20, opponent: "Solar Norte – SCP", date: "2027-02-13", home: true, competition: COMPETITION },
  { id: "J21", matchday: 21, opponent: "FC Penafiel", date: "2027-02-20", home: false, competition: COMPETITION },
  { id: "J22", matchday: 22, opponent: "FC Lagares", date: "2027-02-27", home: false, competition: COMPETITION },
  { id: "J23", matchday: 23, opponent: "FC Paços de Ferreira", date: "2027-03-06", home: true, competition: COMPETITION },
  { id: "J24", matchday: 24, opponent: "FC Porto SAD", date: "2027-03-13", home: false, competition: COMPETITION, featured: true },
  { id: "J25", matchday: 25, opponent: "USC Baltar", date: "2027-03-20", home: true, competition: COMPETITION },
  { id: "J26", matchday: 26, opponent: "Amarante FC", date: "2027-04-03", home: false, competition: COMPETITION },
  { id: "J27", matchday: 27, opponent: "U. Nogueirense FC", date: "2027-04-10", home: true, competition: COMPETITION },
  { id: "J28", matchday: 28, opponent: "AD Lousada", date: "2027-04-17", home: false, competition: COMPETITION },
  { id: "J29", matchday: 29, opponent: "GRD Rans", date: "2027-04-24", home: true, competition: COMPETITION },
  { id: "J30", matchday: 30, opponent: "UD Sousense", date: "2027-05-01", home: false, competition: COMPETITION },
];

export function getNextFixture(referenceDate: Date = new Date()): Match {
  const upcoming = fixtures.find((f) => new Date(f.date) >= referenceDate);
  return upcoming ?? fixtures[fixtures.length - 1];
}

export function getFixtureById(id: string): Match | undefined {
  return fixtures.find((f) => f.id === id);
}
