import { redirect } from "next/navigation";
import { getRoster } from "@/db/queries/players";
import { getCurrentParent } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { EquipaClient } from "@/components/EquipaClient";
import { FormationId } from "@/config/formations";

export const dynamic = "force-dynamic";

export default async function EquipaPage() {
  const [parent, roster, supabase] = await Promise.all([
    getCurrentParent(),
    getRoster(),
    createServerSupabase(),
  ]);
  if (parent === null) redirect("/login");
  if (parent === "onboarding") redirect("/gondomar/onboarding");

  const { data: lineup } = await supabase
    .from("fantasy_lineups")
    .select("player_id, is_captain")
    .eq("fantasy_team_id", parent.fantasyTeamId);

  const initialSelected = (lineup ?? []).map((l) => l.player_id);
  const initialCaptain = (lineup ?? []).find((l) => l.is_captain)?.player_id ?? null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">{parent.fantasyTeamName}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">A Minha Equipa</h1>
        <p className="mt-2 text-sm text-white/80">
          Escolhe o teu XI, marca o capitão, e guarda.
        </p>
        <p className="mt-2 text-xs text-white/60">
          Isto é a tua Fantasy Team — os jogadores que escolhes para ti, independentemente de
          jogarem ou não. É diferente do "11 provável" que preenches em cada Previsão (o que
          achas que vai ser a titularidade real do treinador).
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <EquipaClient
          roster={roster}
          fantasyTeamId={parent.fantasyTeamId}
          initialFormation={parent.formation as FormationId}
          initialSelected={initialSelected}
          initialCaptain={initialCaptain}
        />
      </main>
    </div>
  );
}
