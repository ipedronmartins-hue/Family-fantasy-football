import Link from "next/link";
import { FORMACAO_CLUBS, LEOES } from "@/config/clubs";

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
      <Link href="/leoes" className="mt-2 block rounded-2xl border border-gold bg-gold/10 p-5">
        <p className="font-display text-xl font-semibold text-ink">{LEOES.club}</p>
        <p className="mt-1 text-sm text-ink/70">
          {LEOES.title}: palpites 1X2 da jornada e ranking da época, só entre os do clube.
        </p>
        <span className="mt-3 block text-sm font-semibold text-blue">Entrar →</span>
      </Link>

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
