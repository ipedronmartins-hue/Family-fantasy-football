import { BottomNav } from "@/components/BottomNav";

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  return (
    <>
      {children}
      <BottomNav teamSlug={teamSlug} />
    </>
  );
}
