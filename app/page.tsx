import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Already have an account? Skip the pitch and go straight to your team —
  // this is what makes installing the app as a PWA work well: launching it
  // always opens "/", which then lands you exactly where you left off.
  const parent = await getCurrentParent();
  if (parent && parent !== "onboarding") {
    redirect(`/${parent.teamSlug}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-8">
      <p className="text-sm text-blue">Family Fantasy Soccer</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        Porque criámos esta plataforma
      </h1>

      <p className="mt-4 text-sm text-ink/70">
        Todas as semanas, milhares de pais levam os filhos ao futebol de formação — ficam na
        bancada, torcem, conversam entre si, e voltam a fazer o mesmo na semana seguinte. Esta
        plataforma nasceu de uma pergunta simples: e se esse tempo na bancada pudesse ser um
        pouco mais divertido, e ao mesmo tempo ajudar a equipa do miúdo?
      </p>

      <h2 className="mt-6 font-display text-lg font-semibold text-ink">O que é</h2>
      <p className="mt-2 text-sm text-ink/70">
        Um Fantasy Football privado, feito para os pais de uma equipa de formação. Cada família
        monta a sua equipa com os atletas reais, escolhe um capitão, e tenta prever o que vai
        acontecer em cada jornada — quem marca, quem assiste, quem é o Homem do Jogo. No final
        de cada mês e de cada época, há distinções para quem melhor conheceu a equipa.
      </p>

      <h2 className="mt-6 font-display text-lg font-semibold text-ink">Para que serve</h2>
      <p className="mt-2 text-sm text-ink/70">
        Duas coisas, em simultâneo: aproximar os pais da equipa dos filhos, e criar um pequeno
        fundo comum que ajuda a suportar despesas do dia a dia — lanches, material, torneios,
        deslocações. Cada equipa gere o seu próprio fundo, com total transparência para as
        famílias.
      </p>

      <h2 className="mt-6 font-display text-lg font-semibold text-ink">Preços, sem letra pequena</h2>
      <div className="mt-2 rounded-2xl border border-line bg-white p-4">
        <p className="text-sm text-ink/80">
          <strong>20 €/mês por equipa</strong> — é o que a equipa paga à plataforma, e cobre
          apenas o alojamento e a manutenção. É o único valor que sai da equipa para fora.
        </p>
        <p className="mt-3 text-sm text-ink/80">
          O que cada equipa pede aos seus próprios pais (normalmente um pequeno contributo
          mensal) <strong>fica inteiramente com a equipa</strong>, gerido pelo admin dela —
          nunca passa pela plataforma.
        </p>
      </div>

      <h2 className="mt-6 font-display text-lg font-semibold text-ink">
        Também ajuda quem não pode
      </h2>
      <p className="mt-2 text-sm text-ink/70">
        Uma parte do que é reunido pode ir, de forma pontual e discreta, para famílias que
        atravessem dificuldades — para que nenhum miúdo fique de fora por causa de uma
        inscrição, um par de chuteiras, ou uma deslocação. Ninguém é identificado; a decisão
        fica sempre com quem gere o fundo da equipa.
      </p>

      <Link
        href="/registar-equipa"
        className="mt-8 block rounded-2xl bg-gold py-3.5 text-center font-display text-base font-semibold text-ink"
      >
        Trazer a minha equipa
      </Link>

      <Link
        href="/login"
        className="mt-3 block rounded-2xl border border-line bg-white py-3.5 text-center text-sm font-semibold text-blue"
      >
        Já sou pai/mãe de uma equipa → Entrar
      </Link>
    </div>
  );
}
