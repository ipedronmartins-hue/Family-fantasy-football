import { exampleLeaderboard } from "@/db/seed/leaderboard";

export default function ClassificacaoPage() {
  const leader = exampleLeaderboard[0];

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-pitch px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Family Fantasy · 2026/27</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Classificação</h1>
        <p className="mt-2 text-sm text-white/80">
          Exemplo — fica real assim que as contas dos pais estiverem ligadas.
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <div className="mb-4 rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-semibold text-ink/60">LÍDER</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">{leader.team}</h2>
          <p className="mt-1 font-display text-4xl font-bold text-pitch">{leader.points} pts</p>
        </div>

        <ul className="rounded-2xl border border-line bg-white px-4">
          {exampleLeaderboard.map((entry) => (
            <li
              key={entry.position}
              className="grid grid-cols-[28px_1fr_auto] items-center gap-2 border-b border-line py-3 text-sm last:border-b-0"
            >
              <span className="font-display font-semibold text-ink/50">{entry.position}</span>
              <span className="text-ink">{entry.team}</span>
              <span className="font-display font-semibold text-pitch">{entry.points}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
