// Fantasy scoring engine.
//
// The actual implementation is NOT in this file — it lives as a Postgres
// function in Supabase: `recalculate_match_points(p_match_id uuid)`.
// Admin triggers it from /admin/[code] after entering a match result; it
// reads the configurable rules from the `scoring_rules` table (editable at
// /admin/pontuacao, visible to parents at /pontuacao) and writes one row
// per prediction into `fantasy_points`.
//
// This file is kept only as a pointer for anyone reading the app code who
// wonders where the scoring logic is — it is not dead code left over by
// mistake, and it is not a stub waiting to be filled in.
export {};
