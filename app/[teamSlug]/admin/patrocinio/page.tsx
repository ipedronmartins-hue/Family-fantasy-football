import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { getTeamBySlug } from "@/lib/team";
import { SponsorForm } from "@/components/SponsorForm";

export const dynamic = "force-dynamic";

export default async function PatrocinioPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const base = `/${teamSlug}`;
  const parent = await getCurrentParent();
  if (parent === null) redirect(`/login?team=${teamSlug}`);
  if (parent === "onboarding") redirect(`${base}/onboarding`);
  if (parent === "pending") redirect(`${base}/pendente`);
  if (parent === "suspended") redirect(`${base}/suspenso`);
  if (!parent.isAdmin) redirect(base);

  const team = await getTeamBySlug(teamSlug);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Admin · {team.teamName}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Patrocinador</h1>
        <p className="mt-2 text-sm text-white/80">
          O nome aparece no Homem do Jogo e nos prémios do fim da época.
        </p>
      </header>
      <main className="flex-1 px-5 pt-6">
        <SponsorForm teamSlug={teamSlug} initialName={team.sponsorName} />
      </main>
    </div>
  );
}
