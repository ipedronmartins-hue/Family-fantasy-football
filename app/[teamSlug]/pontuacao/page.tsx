import { supabase } from "@/lib/supabaseClient";
import { getTeamBySlug } from "@/lib/team";

export const dynamic = "force-dynamic";

const LABELS: { key: string; label: string }[] = [
  { key: "correctOutcomeGuess", label: "Acertar o resultado (vitória / empate / derrota)" },
  { key: "exactResultGuess", label: "Acertar o resultado exato" },
  { key: "exactGoalsGuess", label: "Acertar o nº exato de golos da equipa" },
  { key: "scorerGuess", label: "Acertar o marcador" },
  { key: "assistGuess", label: "Acertar a assistência" },
  { key: "manOfTheMatchGuess", label: "Acertar o Homem do Jogo (o jogador mais votado pelos pais)" },
  { key: "startingXIGuess", label: "Por cada titular acertado no 11 provável" },
];

const POSITION_LABELS: Record<string, string> = {
  GR: "Guarda-redes",
  DEF: "Defesa",
  MED: "Médio",
  EXT: "Extremo",
  AV: "Avançado",
};

interface Rules {
  bonus?: { captain: number };
  ownership?: {
    goalsByPosition: Record<string, number>;
    assist: number;
    cleanSheetGoalkeeperDefender: number;
    cleanSheetMidfielder: number;
    playedUpTo60: number;
    played60Plus: number;
    ownGoal: number;
    yellowCard: number;
    redCard: number;
    penaltyMiss: number;
    penaltySave: number;
    goalsConcededPer2: number;
  };
  [key: string]: unknown;
}

export default async function PontuacaoPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const team = await getTeamBySlug(teamSlug);

  const { data } = await supabase
    .from("scoring_rules")
    .select("rules")
    .eq("season_id", team.seasonId)
    .maybeSingle();

  const rules = (data?.rules ?? {}) as Rules;
  const ownership = rules.ownership;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">{team.clubName} · {team.teamName} · {team.seasonLabel}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Como se ganham pontos?</h1>
      </header>

      <main className="flex-1 px-5 pt-6">
        <h2 className="mb-2 font-display text-base font-semibold text-ink">
          Equipa — pelo desempenho real dos teus jogadores
        </h2>
        {ownership && (
          <ul className="mb-6 rounded-2xl border border-line bg-white px-4">
            {Object.entries(ownership.goalsByPosition).map(([pos, pts]) => (
              <li key={pos} className="flex items-center justify-between border-b border-line py-2.5 text-sm">
                <span className="text-ink">Golo — {POSITION_LABELS[pos] ?? pos}</span>
                <span className="font-display font-semibold text-blue">+{pts} pts</span>
              </li>
            ))}
            {[
              ["Assistência", ownership.assist],
              ["Jogar até 60 min", ownership.playedUpTo60],
              ["Jogar 60+ min", ownership.played60Plus],
              ["Clean sheet — GR/Defesa", ownership.cleanSheetGoalkeeperDefender],
              ["Clean sheet — Médio", ownership.cleanSheetMidfielder],
              ["Defesa de grande penalidade", ownership.penaltySave],
              ["Bónus (melhores em campo)", "1 a 3"],
              ["Cartão amarelo", ownership.yellowCard],
              ["Cartão vermelho", ownership.redCard],
              ["Golo próprio", ownership.ownGoal],
              ["Falhar grande penalidade", ownership.penaltyMiss],
              ["Cada 2 golos sofridos (GR/Defesa)", ownership.goalsConcededPer2],
            ].map(([label, pts]) => (
              <li key={label as string} className="flex items-center justify-between border-b border-line py-2.5 text-sm last:border-b-0">
                <span className="text-ink">{label}</span>
                <span className="font-display font-semibold text-blue">
                  {typeof pts === "number" && pts > 0 ? "+" : ""}
                  {pts} {typeof pts === "number" ? "pts" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="-mt-4 mb-6 text-xs text-ink/50">
          O capitão duplica os pontos que ganhar. Se não jogar, passa para o vice.
        </p>

        <h2 className="mb-2 font-display text-base font-semibold text-ink">
          Previsão — pelo que acertares
        </h2>
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
          {rules.bonus && (
            <li className="flex items-center justify-between py-3 text-sm">
              <span className="text-ink">Bónus de capitão (ou vice) no MVP acertado</span>
              <span className="font-display font-semibold text-gold">+{rules.bonus.captain} pts</span>
            </li>
          )}
        </ul>
      </main>
    </div>
  );
}
