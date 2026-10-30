import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const parent = await getCurrentParent();
  if (!parent || typeof parent === "string") redirect(`/${teamSlug}`);

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-24 pt-10">
      <h1 className="font-display text-2xl font-semibold text-ink">O meu perfil</h1>
      <p className="mt-1 text-sm text-ink/60">Muda o teu nome ou o nome da tua equipa.</p>
      <ProfileForm teamSlug={teamSlug} initialName={parent.displayName} initialTeam={parent.fantasyTeamName} />
    </div>
  );
}
