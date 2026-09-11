import { supabase, CURRENT_SEASON_ID } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

interface LeaderboardRow {
  fantasy_team_id: string;
  team_name: string;
  total_points: number;
}

export default async function ClassificacaoPage() {
  const { data, error } = await supabase
    .from("season_leaderboard")
    .select("fantasy_team_id, team_name, total_points")
    .eq("season_id", CURRENT_SEASON_ID)
    .order("total_points", { ascending: false });

  const rawStandings = (data as LeaderboardRow[] | null) ?? [];
  const hasRealPoints = rawStandings.some((s) => s.total_points > 0);
  const standings = hasRealPoints ? rawStandings : [];
  const leader = standings[0];

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Family Fantasy · 2026/27</p>
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
      </main>
    </div>
  );
}
