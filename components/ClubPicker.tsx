import Link from "next/link";
import { FORMACAO_CLUBS, LEOES } from "@/config/clubs";

const WHATSAPP_LEOES = `https://wa.me/351913695846?text=${encodeURIComponent(
  "Olá! Tenho interesse nos Palpites dos Leões."
)}`;

/** Seletor de clubes da página principal: cada cartão leva à área do clube. */
export default function ClubPicker() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-ink">Escolhe o teu clube</h1>
      <p className="mt-3 text-sm text-ink/70">
        Cada clube tem a sua área privada. Toca no teu para continuares.
      </p>

      <p className="mt-6 text-xs font-semibold text-blue">⚽ FORMAÇÃO</p>
      <div className="mt-2 flex flex-col gap-3">
        {FORMACAO_CLUBS.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="block rounded-2xl border border-line bg-white p-5"
          >
            <p className="font-display text-xl font-semibold text-ink">{c.club}</p>
            <p className="mt-1 text-sm text-ink/70">{c.team} · Family Fantasy Formação</p>
            <span className="mt-3 block text-sm font-semibold text-blue">Entrar →</span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-xs font-semibold text-ink/60">🏟️ SENIORES · CONCEITO DIFERENTE</p>
      <div className="mt-2 rounded-2xl border border-dashed border-gold bg-gold/10 p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-xl font-semibold text-ink">{LEOES.club}</p>
          <span className="rounded-full bg-gold/30 px-2 py-0.5 text-[10px] font-semibold text-ink">
            Em breve
          </span>
        </div>
        <p className="mt-1 text-sm text-ink/70">
          {LEOES.title}: palpites 1X2 da jornada e ranking da época, só entre os do clube.
        </p>
        <a
          href={WHATSAPP_LEOES}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-sm font-semibold text-[#128C7E]"
        >
          💬 Quero ser avisado →
        </a>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/registar-equipa"
          className="block rounded-2xl bg-gold py-3.5 text-center font-display text-base font-semibold text-ink"
        >
          Trazer a minha equipa
        </Link>
        <Link href="/fantasy" className="text-center text-sm font-semibold text-blue">
          Saber mais sobre a plataforma
        </Link>
      </div>
    </>
  );
}
