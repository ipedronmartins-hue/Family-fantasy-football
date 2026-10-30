import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getCurrentParent } from "@/lib/auth";

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;

  // Cada pai só vê a sua equipa: se abrir o link de outra, volta à dele.
  // (O dono da plataforma é trocado automaticamente de equipa no middleware.)
  const parent = await getCurrentParent();
  if (parent && typeof parent === "object" && !parent.isPlatformOwner && parent.teamSlug && parent.teamSlug !== teamSlug) {
    redirect(`/${parent.teamSlug}`);
  }

  return (
    <>
      {children}
      <BottomNav teamSlug={teamSlug} />
    </>
  );
}
