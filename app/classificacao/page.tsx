export default function ClassificacaoPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Family Fantasy · 2026/27</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Classificação</h1>
      </header>

      <main className="flex-1 px-5 pt-6">
        <div className="rounded-2xl border border-line bg-white p-6 text-center">
          <p className="text-sm text-ink/60">
            Ainda não há classificação. Fica disponível assim que as contas dos pais
            existirem e as previsões começarem a valer pontos.
          </p>
        </div>
      </main>
    </div>
  );
}
