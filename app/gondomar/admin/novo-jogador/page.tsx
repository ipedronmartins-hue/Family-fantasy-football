import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { getRoster } from "@/db/queries/players";
import { NewPlayerForm } from "@/components/NewPlayerForm";

export const dynamic = "force-dynamic";

export default async function NovoJogadorPage() {
  const parent = await getCurrentParent();
  if (parent === null) redirect("/login");
  if (parent === "onboarding") redirect("/gondomar/onboarding");
  if (!parent.isAdmin) redirect("/gondomar");

  const roster = await getRoster();
  const nextNumber = roster.length > 0 ? Math.max(...roster.map((p) => p.number)) + 1 : 1;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Admin</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Novo Jogador</h1>
      </header>

      <main className="flex-1 px-5 pt-6">
        <NewPlayerForm nextNumber={nextNumber} />
      </main>
    </div>
  );
}
