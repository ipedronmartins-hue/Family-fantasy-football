/**
 * Predictions and the weekly Fantasy Team close only when the admin
 * manually locks the match -- no automatic time-based deadline.
 */
export function isPredictionLocked(kickoffAt: string, manualLockedAt: string | null): boolean {
  if (!manualLockedAt) return false;
  return new Date(manualLockedAt).getTime() <= Date.now();
}
