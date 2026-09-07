/**
 * Configurable Fantasy scoring rules.
 *
 * This file is intentionally the ONLY place point values live. Nothing in
 * /components or /app should hardcode a score — everything reads from here
 * (or, eventually, from an admin-editable table that this file seeds).
 *
 * Values are placeholders for V1 and are expected to change per team.
 */
export const SCORING_RULES = {
  startingXIGuess: 3,
  scorerGuess: 5,
  exactGoalsGuess: 4,
  exactResultGuess: 8,
  assistGuess: 4,
  manOfTheMatchGuess: 6,
  bonus: {
    captain: 2,
    cleanSheetPrediction: 3,
  },
} as const;

export type ScoringRules = typeof SCORING_RULES;
