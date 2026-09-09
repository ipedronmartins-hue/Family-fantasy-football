import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: parent } = await supabase
          .from("parents")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        return NextResponse.redirect(`${origin}${parent ? "/" : "/onboarding"}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
