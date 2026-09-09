import Link from "next/link";
import { getNextFixture, getFixtures } from "@/db/queries/fixtures";
import { getCurrentParent } from "@/lib/auth";
import { supabase, CURRENT_SEASON_ID } from "@/lib/supabaseClient";
import { MatchCard } from "@/components/MatchCard";
import { ScrollReveal } from "@/components/ScrollReveal";

export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  { icon: "⚽", title: "Escolhe a tua equipa", text: "Monta o teu onze de acordo com a formação que consideras mais adequada." },
  { icon: "👑", title: "Escolhe o capitão", text: "Confia num jogador e coloca-lhe a braçadeira." },
  { icon: "🎯", title: "Faz o desafio da jornada", text: "Prevê o resultado, possíveis marcadores, assistências e o jogador em destaque." },
  { icon: "🏆", title: "Ganha pontos", text: "As tuas escolhas são comparadas com aquilo que realmente acontece no jogo." },
  { icon: "📈", title: "Sobe no ranking", text: "Compete com os restantes pais ao longo das 30 jornadas." },
];

const FUND_ITEMS = [
  "⚽ bolas e material de treino",
  "🎒 porta-garrafas e outro material necessário",
  "🏆 inscrições da equipa técnica em torneios",
  "🚌 despesas e apoio a deslocações realizadas em benefício da equipa",
  "🚗 plafond de apoio para quem disponibiliza a sua viatura",
  "🤝 apoio pontual e discreto a famílias que possam necessitar",
];

export default async function InicioPage() {
  const [nextMatch, fixtures, parent] = await Promise.all([
    getNextFixture(),
    getFixtures(),
    getCurrentParent(),
  ]);

  const hasTeam = parent && parent !== "onboarding";
  const ctaHref = parent === null ? "/login" : parent === "onboarding" ? "/onboarding" : "/equipa";
  const ctaLabel = hasTeam ? "Ver a minha equipa" : "Montar a minha equipa";

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthKey = monthStart.toISOString().slice(0, 10);

  const [{ data: monthly }, { data: season }, quotaResult] = await Promise.all([
    supabase
      .from("monthly_leaderboard")
      .select("team_name, points")
      .eq("season_id", CURRENT_SEASON_ID)
      .eq("month", monthKey)
      .order("points", { ascending: false })
      .limit(1),
    supabase
      .from("season_leaderboard")
      .select("team_name, total_points")
      .eq("season_id", CURRENT_SEASON_ID)
      .order("total_points", { ascending: false })
      .limit(3),
    hasTeam
      ? supabase
          .from("family_payments")
          .select("id")
          .eq("fantasy_team_id", parent.fantasyTeamId)
          .eq("month", monthKey)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const monthlyLeader = monthly?.[0];
  const podium = season ?? [];
  const quotaPaid = !!quotaResult.data;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-8 pt-8 text-white">
        <p className="text-sm text-white/70">Gondomar SC · Sub-13 · 2026/27</p>
        <h1 className="mt-2 font-display text-2xl font-semibold leading-tight">
          A equipa joga no campo.
          <br />
          Tu jogas na bancada.
        </h1>
        <p className="mt-3 text-sm text-white/80">
          Bem-vindo ao Family Fantasy Soccer — a competição dos pais do Gondomar SC Sub-13.
          Escolhe os teus 11, o teu capitão, e tenta antecipar o que vai acontecer dentro das
          quatro linhas em cada jornada.
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-ink/60">
            PRÓXIMO JOGO · {nextMatch.code.replace("J", "JORNADA ")}
          </p>
          <MatchCard match={nextMatch} />
        </div>

        <Link
          href={ctaHref}
          className="block rounded-2xl bg-gold py-3.5 text-center font-display text-base font-semibold text-ink"
        >
          {ctaLabel}
        </Link>

        {hasTeam && (
          <p className="mb-8 mt-2 text-center text-xs text-ink/60">
            Quota deste mês: {quotaPaid ? "paga ✅" : "por pagar ⏳"}
          </p>
        )}
        {!hasTeam && <div className="mb-8" />}

        <ScrollReveal>
          <section id="como-funciona" className="mb-8 scroll-mt-6">
            <h2 className="mb-3 font-display text-xl font-semibold text-ink">Como funciona?</h2>
            <div className="space-y-3">
              {HOW_IT_WORKS.map((step) => (
                <div key={step.title} className="flex gap-3 rounded-2xl border border-line bg-white p-4">
                  <span className="text-2xl">{step.icon}</span>
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-xs text-ink/60">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="mb-8 rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-semibold text-gold">🏆 MISTER DA BANCADA DO MÊS</p>
            <p className="mt-2 text-sm text-ink/70">
              Todos os meses há uma nova oportunidade para chegar ao topo — não precisas de
              estar em primeiro no ranking geral para ganhar. Cada mês começa uma nova corrida.
            </p>
            {monthlyLeader ? (
              <div className="mt-3 rounded-xl bg-blue/5 p-3 text-center">
                <p className="font-display text-lg font-semibold text-blue">{monthlyLeader.team_name}</p>
                <p className="text-xs text-ink/60">{monthlyLeader.points} pts este mês</p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink/50">
                Ainda sem líder este mês — sê o primeiro a pontuar.
              </p>
            )}
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="mb-8 rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-semibold text-ink/60">E NO FINAL DA ÉPOCA…</p>
            <p className="mt-2 text-sm text-ink/70">
              Os três melhores classificados do ranking geral serão distinguidos — os prémios
              poderão incluir merchandising do clube, equipamento ou material desportivo para
              os filhos dos três primeiros classificados.
            </p>
            {podium.length > 0 ? (
              <div className="mt-3 space-y-2">
                {podium.map((row, i) => (
                  <div key={row.team_name} className="flex items-center gap-3 rounded-xl bg-blue/5 p-2.5">
                    <span className="text-xl">{["🥇", "🥈", "🥉"][i]}</span>
                    <span className="flex-1 text-sm font-semibold text-ink">{row.team_name}</span>
                    <span className="text-sm font-semibold text-blue">{row.total_points} pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink/50">A época ainda vai a começar.</p>
            )}
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="mb-8">
            <h2 className="mb-2 font-display text-xl font-semibold text-ink">
              Mais do que um jogo
            </h2>
            <p className="mb-3 text-sm text-ink/70">
              O Family Fantasy Soccer foi criado para aproximar os pais da equipa — mas tem
              também um segundo objetivo: ajudar a nossa equipa. Pedimos a quem quiser
              participar um contributo de <strong>5 € por mês / família</strong>, que ajuda a
              suportar despesas como:
            </p>
            <ul className="mb-3 space-y-1.5 rounded-2xl border border-line bg-white p-4 text-sm text-ink/80">
              {FUND_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mb-3 text-xs text-ink/60">
              Todos contribuímos um pouco. A equipa beneficia. E queremos que todos saibam para
              onde vai o contributo.
            </p>
            <Link
              href="/fundo"
              className="block rounded-2xl border border-blue py-2.5 text-center text-sm font-semibold text-blue"
            >
              Ver o Fundo da Equipa →
            </Link>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="mb-8 rounded-2xl bg-blue p-5 text-white">
            <p className="font-display text-lg font-semibold">A nossa época. O nosso jogo.</p>
            <p className="mt-2 text-sm text-white/80">
              Os miúdos têm o campeonato deles. Nós temos o nosso. Durante 30 jornadas vamos
              escolher, prever, acertar, falhar, ganhar pontos e tentar chegar ao topo. No
              final, haverá um campeão — mas o verdadeiro objetivo é que esta seja uma época
              ainda melhor para todos os nossos miúdos.
            </p>
            <p className="mt-3 font-display text-sm font-semibold">
              Estás pronto para ser o Mister da Bancada?
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href={ctaHref}
                className="flex-1 rounded-xl bg-gold py-2.5 text-center text-sm font-semibold text-ink"
              >
                {ctaLabel}
              </Link>
              <a
                href="#como-funciona"
                className="flex-1 rounded-xl border border-white/40 py-2.5 text-center text-sm font-semibold text-white"
              >
                Como funciona
              </a>
            </div>
          </section>
        </ScrollReveal>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-blue">
          <Link href="/plantel" className="rounded-xl border border-line bg-white py-3">
            Plantel
          </Link>
          <Link href="/fundo" className="rounded-xl border border-line bg-white py-3">
            Fundo
          </Link>
          {hasTeam && parent.isAdmin && (
            <Link href="/admin" className="rounded-xl border border-gold bg-gold/10 py-3 text-ink">
              Admin
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
