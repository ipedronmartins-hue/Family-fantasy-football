/**
 * Predictions and the weekly Fantasy Team close only when the admin
 * manually locks the match -- no automatic time-based deadline.
 */
export function isPredictionLocked(kickoffAt: string, manualLockedAt: string | null): boolean {
  if (!manualLockedAt) return false;
  return new Date(manualLockedAt).getTime() <= Date.now();
}

/**
 * Voting for Homem do Jogo stays open on the day of the match, and closes
 * as soon as the calendar day changes (Portugal time) -- matches the RLS
 * policy on motm_votes exactly.
 */
export function isVotingClosed(kickoffAt: string): boolean {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(d); // YYYY-MM-DD
  return fmt(new Date()) > fmt(new Date(kickoffAt));
}
