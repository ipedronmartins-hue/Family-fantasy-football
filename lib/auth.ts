import { createServerSupabase } from "@/lib/supabase/server";

export interface CurrentParent {
  userId: string;
  email: string | undefined;
  displayName: string;
  isAdmin: boolean;
  isPlatformOwner: boolean;
  fantasyTeamId: string;
  fantasyTeamName: string;
  formation: string;
}

/**
 * Returns the logged-in parent + their Fantasy Team, or null if the visitor
 * is not logged in, or "onboarding" if logged in but hasn't finished
 * creating their profile/team yet.
 */
export async function getCurrentParent(): Promise<CurrentParent | null | "onboarding"> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: parent } = await supabase
    .from("parents")
    .select("display_name, is_admin, is_platform_owner")
    .eq("id", user.id)
    .maybeSingle();

  if (!parent) return "onboarding";

  const { data: team } = await supabase
    .from("fantasy_teams")
    .select("id, name, formation")
    .eq("parent_id", user.id)
    .maybeSingle();

  if (!team) return "onboarding";

  return {
    userId: user.id,
    email: user.email,
    displayName: parent.display_name,
    isAdmin: parent.is_admin,
    isPlatformOwner: parent.is_platform_owner,
    fantasyTeamId: team.id,
    fantasyTeamName: team.name,
    formation: team.formation,
  };
}
