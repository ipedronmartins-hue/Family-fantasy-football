import { createClient } from "@supabase/supabase-js";

// Public project URL + anon key. The anon key is designed to be public —
// every read/write it can do is governed by the RLS policies on each table
// (see the migrations), never by keeping this key secret.
const SUPABASE_URL = "https://ztahmjclkaajxdclhddw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0YWhtamNsa2FhanhkY2xoZGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NTcyNDUsImV4cCI6MjEwNDQzMzI0NX0.WdJojeZKn6Okghh0GV0coZ8uJsSC9Sz_f9QrxJaCK2s";

// The pilot squad's season — hardcoded for now since there is only one
// club/team/season in play. Multi-tenancy (picking the right season per
// club) is a real feature to add once a second team signs up.
export const CURRENT_SEASON_ID = "00000000-0000-0000-0000-000000000003";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
