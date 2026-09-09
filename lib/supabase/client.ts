import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = "https://ztahmjclkaajxdclhddw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0YWhtamNsa2FhanhkY2xoZGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NTcyNDUsImV4cCI6MjEwNDQzMzI0NX0.WdJojeZKn6Okghh0GV0coZ8uJsSC9Sz_f9QrxJaCK2s";

export function createBrowserSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
