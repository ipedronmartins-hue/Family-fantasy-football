import { supabase } from "@/lib/supabaseClient";
import { getTeamBySlug } from "@/lib/team";

export const dynamic = "force-dynamic";

const LABELS: { key: string; label: string }[] = [
  { key: "correctOutcomeGuess", label: "Acertar o resultado (vitória / empate / derrota)" },
  { key: "exactResultGuess", label: "Acertar o resultado exato" },
  { key: "exactGoalsGuess", label: "Acertar o nº exato de golos da equipa" },
  { key: "scorerGuess", label: "Acertar o marcador" },
  { key: "assistGuess", label: "Acertar a assistência" },
  { key: "manOfTheMatchGuess", label: "Acertar o Homem do Jogo" },
  { key: "startingXIGuess", label: "Por cada titular acertado no 11 provável" },
];

export default async function PontuacaoPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const team = await getTeamBySlug(teamSlug);

  const { data } = await supabase
    .from("scoring_rules")
    .select("rules")
    .eq("season_id", team.seasonId)
    .maybeSingle();

  const rules = (data?.rules ?? {}) as Record<string, number | { captain: number }>;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">{team.clubName} · {team.teamName} · {team.seasonLabel}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Como se ganham pontos?</h1>
      </header>

      <main className="flex-1 px-5 pt-6">
        <ul className="rounded-2xl border border-line bg-white px-4">
          {LABELS.map(({ key, label }) => (
            <li
              key={key}
              className="flex items-center justify-between border-b border-line py-3 text-sm last:border-b-0"
            >
              <span className="text-ink">{label}</span>
              <span className="font-display font-semibold text-blue">
                +{typeof rules[key] === "number" ? rules[key] : "-"} pts
              </span>
            </li>
          ))}
          {typeof rules.bonus === "object" && (
            <li className="flex items-center justify-between py-3 text-sm">
              <span className="text-ink">Bónus de capitão no MVP acertado</span>
              <span className="font-display font-semibold text-gold">
                +{(rules.bonus as { captain: number }).captain} pts
              </span>
            </li>
          )}
        </ul>
      </main>
    </div>
  );
}
