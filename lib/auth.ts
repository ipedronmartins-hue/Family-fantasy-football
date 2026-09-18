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
  teamSlug: string;
}

/**
 * Returns the logged-in parent + their Fantasy Team, or:
 * - null: not logged in
 * - "onboarding": logged in, hasn't finished creating their profile/team yet
 * - "pending": profile created, waiting for the team admin to approve them
 * - "suspended": admin has suspended this parent's access
 */
export async function getCurrentParent(): Promise<
  CurrentParent | null | "onboarding" | "pending" | "suspended"
> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: parent } = await supabase
    .from("parents")
    .select("display_name, is_admin, is_platform_owner, status, season_id, seasons(teams(slug))")
    .eq("id", user.id)
    .maybeSingle();

  if (!parent) return "onboarding";
  if (parent.status === "pending") return "pending";
  if (parent.status === "suspended") return "suspended";

  const { data: team } = await supabase
    .from("fantasy_teams")
    .select("id, name, formation")
    .eq("parent_id", user.id)
    .maybeSingle();

  if (!team) return "onboarding";

  const teamSlug =
    (parent.seasons as unknown as { teams: { slug: string } | null } | null)?.teams?.slug ?? "";

  return {
    userId: user.id,
    email: user.email,
    displayName: parent.display_name,
    isAdmin: parent.is_admin,
    isPlatformOwner: parent.is_platform_owner,
    fantasyTeamId: team.id,
    fantasyTeamName: team.name,
    formation: team.formation,
    teamSlug,
  };
}
