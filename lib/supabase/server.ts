import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = "https://ztahmjclkaajxdclhddw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0YWhtamNsa2FhanhkY2xoZGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NTcyNDUsImV4cCI6MjEwNDQzMzI0NX0.WdJojeZKn6Okghh0GV0coZ8uJsSC9Sz_f9QrxJaCK2s";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component without a mutable response —
          // safe to ignore because middleware refreshes the session too.
        }
      },
    },
  });
}
