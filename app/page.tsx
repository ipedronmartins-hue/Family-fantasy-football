import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";

export const dynamic = "force-dynamic";

const WHATSAPP_SENIORES = `https://wa.me/351913695846?text=${encodeURIComponent(
  "Olá! Tenho interesse na área para equipas de seniores do Family Fantasy."
)}`;

export default async function HubPage() {
  // Quem já tem conta vai direto para a equipa. É isto que faz a app instalada
  // (que abre sempre em "/") levar cada pessoa ao sítio onde ficou.
  const parent = await getCurrentParent();
  if (parent && typeof parent === "object") {
    redirect(`/${parent.teamSlug}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-8">
      {parent === "onboarding" && (
        <div className="mb-6 rounded-2xl border border-gold bg-gold/10 p-4 text-sm text-ink">
          A tua conta já está criada. Para continuares, usa o link específico da tua equipa (o
          que o administrador dela partilhou contigo), ou{" "}
          <Link href="/login" className="font-semibold text-blue underline">
            volta a entrar e escreve o nome da equipa
          </Link>{" "}
          quando for pedido.
        </div>
      )}
      {parent === "pending" && (
        <div className="mb-6 rounded-2xl border border-gold bg-gold/10 p-4 text-sm text-ink">
          ⏳ A tua conta está a aguardar aprovação do administrador da tua equipa.
        </div>
      )}
      {parent === "suspended" && (
        <div className="mb-6 rounded-2xl border border-red bg-red/10 p-4 text-sm text-ink">
          🔒 O administrador da tua equipa suspendeu o teu acesso. Fala com ele para resolver.
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <p className="font-display text-lg font-semibold text-blue">Family Fantasy</p>
        <Link href="/login" className="rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-blue">
          Já tenho conta · Entrar
        </Link>
      </div>

      <h1 className="font-display text-3xl font-semibold text-ink">Jogos para a bancada da tua equipa</h1>
      <p className="mt-3 text-sm text-ink/70">Escolhe a tua área.</p>

      <Link href="/fantasy" className="mt-6 block rounded-2xl border border-line bg-white p-5">
        <p className="text-xs font-semibold text-blue">⚽ FORMAÇÃO</p>
        <p className="mt-1 font-display text-xl font-semibold text-ink">Family Fantasy Formação</p>
        <p className="mt-2 text-sm text-ink/70">
          O Fantasy Football privado dos pais de uma equipa de formação. Escolhe o teu onze, prevê
          o jogo e ajuda a equipa do teu filho.
        </p>
        <span className="mt-3 block text-sm font-semibold text-blue">Saber mais →</span>
      </Link>

      <div className="mt-4 rounded-2xl border border-dashed border-line bg-white/60 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-ink/50">🏟️ SENIORES</p>
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-ink">Em breve</span>
        </div>
        <p className="mt-1 font-display text-xl font-semibold text-ink">Palpites 1X2 para equipas de seniores</p>
        <p className="mt-2 text-sm text-ink/70">
          Os palpites da jornada e o ranking da época, só entre os jogadores da equipa.
        </p>
        <a
          href={WHATSAPP_SENIORES}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-sm font-semibold text-[#128C7E]"
        >
          💬 Quero ser avisado →
        </a>
      </div>

      <p className="mt-8 text-center text-xs text-ink/40">
        És pai ou mãe de uma equipa? Toca em «Entrar» no topo.
      </p>
    </div>
  );
}
