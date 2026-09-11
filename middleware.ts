import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = "https://ztahmjclkaajxdclhddw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0YWhtamNsa2FhanhkY2xoZGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NTcyNDUsImV4cCI6MjEwNDQzMzI0NX0.WdJojeZKn6Okghh0GV0coZ8uJsSC9Sz_f9QrxJaCK2s";

// Gondomar's team id -- the only team on the platform for now. When real
// multi-tenant routing exists, this becomes "the team for this request"
// instead of a constant.
const CURRENT_TEAM_ID = "00000000-0000-0000-0000-000000000002";

const ALWAYS_ALLOWED = ["/login", "/auth/callback", "/bloqueado", "/registar-equipa", "/superadmin"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Touching getUser() is what actually refreshes an expiring session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (ALWAYS_ALLOWED.some((p) => pathname.startsWith(p))) {
    return response;
  }

  const { data: team } = await supabase
    .from("teams")
    .select("platform_status")
    .eq("id", CURRENT_TEAM_ID)
    .maybeSingle();

  if (team?.platform_status === "blocked") {
    let isOwner = false;
    if (user) {
      const { data: parent } = await supabase
        .from("parents")
        .select("is_platform_owner")
        .eq("id", user.id)
        .maybeSingle();
      isOwner = !!parent?.is_platform_owner;
    }
    if (!isOwner) {
      return NextResponse.redirect(new URL("/bloqueado", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
