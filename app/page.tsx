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

      <a
        href={`https://wa.me/351913695846?text=${encodeURIComponent(
          "Olá! 👋 Vi o Fantasy Football Formação e gostava de trazer a minha equipa para a plataforma. Podemos falar?"
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-center font-display text-base font-semibold text-white"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm0 1.67c2.19 0 4.25.85 5.8 2.4a8.19 8.19 0 0 1 2.4 5.84c0 4.55-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.55 3.7-8.24 8.29-8.24Zm-4.53 4.7c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03s.87 2.36.99 2.52c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.09.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28-.24-.12-1.43-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42h-.24Z" />
        </svg>
        Pedir acesso no WhatsApp
      </a>

      <Link
        href="/registar-equipa"
        className="mt-3 block rounded-2xl bg-gold py-3.5 text-center font-display text-base font-semibold text-ink"
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
