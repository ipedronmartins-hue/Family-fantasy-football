import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export interface TeamContext {
  teamId: string;
  teamSlug: string;
  teamName: string;
  clubName: string;
  seasonId: string;
  seasonLabel: string;
  platformStatus: "active" | "blocked";
}

/** Looks up a team by its URL slug. Calls notFound() if it doesn't exist. */
export async function getTeamBySlug(slug: string): Promise<TeamContext> {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, slug, platform_status, clubs(name), seasons(id, label)")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) notFound();

  const seasons = data.seasons as unknown as { id: string; label: string }[];
  const season = seasons?.[0];
  if (!season) notFound();

  return {
    teamId: data.id,
    teamSlug: data.slug,
    teamName: data.name,
    clubName: (data.clubs as unknown as { name: string } | null)?.name ?? "",
    seasonId: season.id,
    seasonLabel: season.label,
    platformStatus: data.platform_status as "active" | "blocked",
  };
}
