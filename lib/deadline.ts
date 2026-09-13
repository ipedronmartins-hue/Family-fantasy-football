export const DEADLINE_MINUTES_BEFORE_KICKOFF = 90;

/**
 * Predictions close automatically 90 minutes before kickoff (matching how
 * real Fantasy Premier League gameweek deadlines work), or earlier if the
 * admin has manually locked the match.
 */
export function isPredictionLocked(kickoffAt: string, manualLockedAt: string | null): boolean {
  const now = Date.now();
  const autoDeadline = new Date(kickoffAt).getTime() - DEADLINE_MINUTES_BEFORE_KICKOFF * 60 * 1000;
  if (now >= autoDeadline) return true;
  if (manualLockedAt && new Date(manualLockedAt).getTime() <= now) return true;
  return false;
}
