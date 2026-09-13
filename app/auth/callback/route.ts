import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const team = searchParams.get("team");

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
          .select("season_id")
          .eq("id", user.id)
          .maybeSingle();

        if (parent) {
          // Already onboarded somewhere -- always send them back to THEIR
          // own team, regardless of which team's login page they used.
          const { data: season } = await supabase
            .from("seasons")
            .select("teams(slug)")
            .eq("id", parent.season_id)
            .maybeSingle();
          const slug = (season?.teams as unknown as { slug: string } | null)?.slug;
          return NextResponse.redirect(`${origin}/${slug ?? ""}`);
        }

        if (team) {
          return NextResponse.redirect(`${origin}/${team}/onboarding`);
        }

        // No existing profile and no team context -- can't know where to
        // send them to onboard.
        return NextResponse.redirect(`${origin}/`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
