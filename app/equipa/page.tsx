import { getRoster } from "@/db/queries/players";
import { EquipaClient } from "@/components/EquipaClient";

export const dynamic = "force-dynamic";

export default async function EquipaPage() {
  const roster = await getRoster();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Gondomar SC · Sub-13</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">A Minha Equipa</h1>
        <p className="mt-2 text-sm text-white/80">
          Escolhe a formação — a titularidade real fica pronta quando as contas dos pais existirem.
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <EquipaClient roster={roster} />
      </main>
    </div>
  );
}
