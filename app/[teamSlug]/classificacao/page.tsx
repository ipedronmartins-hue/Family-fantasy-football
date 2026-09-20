import { supabase } from "@/lib/supabaseClient";
import { getTeamBySlug } from "@/lib/team";

export const dynamic = "force-dynamic";

interface LeaderboardRow {
  fantasy_team_id: string;
  team_name: string;
  total_points: number;
}

interface MotmTallyRow {
  player_id: string;
  player_name: string;
  shirt_number: number;
  awards: number;
}

export default async function ClassificacaoPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const team = await getTeamBySlug(teamSlug);

  const [{ data, error }, { data: motmData }] = await Promise.all([
    supabase
      .from("season_leaderboard")
      .select("fantasy_team_id, team_name, total_points")
      .eq("season_id", team.seasonId)
      .order("total_points", { ascending: false }),
    supabase
      .from("motm_season_tally")
      .select("player_id, player_name, shirt_number, awards")
      .eq("season_id", team.seasonId)
      .order("awards", { ascending: false }),
  ]);

  const motmTally = (motmData as MotmTallyRow[] | null) ?? [];

  const rawStandings = (data as LeaderboardRow[] | null) ?? [];
  const hasRealPoints = rawStandings.some((s) => s.total_points > 0);
  const standings = hasRealPoints ? rawStandings : [];
  const leader = standings[0];

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">{team.clubName} · {team.teamName} · {team.seasonLabel}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Classificação</h1>
      </header>

      <main className="flex-1 px-5 pt-6">
        {error && (
          <p className="text-center text-sm text-red">Não foi possível carregar a classificação.</p>
        )}

        {!error && standings.length === 0 && (
          <div className="rounded-2xl border border-line bg-white p-6 text-center">
            <p className="text-sm text-ink/60">
              Ainda ninguém pontuou.
              <br />
              Sê o primeiro Mister da Bancada a entrar no ranking.
            </p>
          </div>
        )}

        {leader && (
          <div className="mb-4 rounded-2xl border border-line bg-white p-4">
            <p className="text-xs font-semibold text-ink/60">LÍDER</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">{leader.team_name}</h2>
            <p className="mt-1 font-display text-4xl font-bold text-blue">{leader.total_points} pts</p>
          </div>
        )}

        {standings.length > 0 && (
          <ul className="rounded-2xl border border-line bg-white px-4">
            {standings.map((entry, i) => (
              <li
                key={entry.fantasy_team_id}
                className="grid grid-cols-[28px_1fr_auto] items-center gap-2 border-b border-line py-3 text-sm last:border-b-0"
              >
                <span className="font-display font-semibold text-ink/50">{i + 1}</span>
                <span className="text-ink">{entry.team_name}</span>
                <span className="font-display font-semibold text-blue">{entry.total_points}</span>
              </li>
            ))}
          </ul>
        )}

        {motmTally.length > 0 && (
          <>
            <h2 className="mb-2 mt-8 font-display text-lg font-semibold text-ink">
              🏆 Corrida a Jogador do Ano
            </h2>
            <p className="mb-3 text-xs text-ink/50">
              Quem mais vezes for eleito Homem do Jogo pelos pais ao longo da época, é o
              Jogador do Ano.
            </p>
            <ul className="rounded-2xl border border-line bg-white px-4">
              {motmTally.map((entry, i) => (
                <li
                  key={entry.player_id}
                  className="grid grid-cols-[28px_1fr_auto] items-center gap-2 border-b border-line py-3 text-sm last:border-b-0"
                >
                  <span className="font-display font-semibold text-ink/50">{i + 1}</span>
                  <span className="text-ink">
                    {entry.shirt_number} {entry.player_name}
                  </span>
                  <span className="font-display font-semibold text-gold">
                    {entry.awards} {entry.awards === 1 ? "vez" : "vezes"}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
