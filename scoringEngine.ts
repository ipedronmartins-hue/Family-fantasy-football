// Fantasy scoring engine — computes points from a parent's Prediction against
// a Match's real result, using the rules in /config/scoring.ts.
//
// Intentionally not implemented yet: this file is a placeholder so the
// architecture boundary exists from day one. When Predictions and Matches
// are modeled (next step), this becomes:
//
//   calculatePoints(prediction: Prediction, result: MatchResult, rules: ScoringRules): number
//
// Keeping this logic out of /app and /components means the rules can change
// per team/club without touching any screen.
export {};
