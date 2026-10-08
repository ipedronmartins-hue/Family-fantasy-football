import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import ClubPicker from "@/components/ClubPicker";

export const dynamic = "force-dynamic";

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

      <ClubPicker />

      <p className="mt-8 text-center text-xs text-ink/40">
        És pai ou mãe de uma equipa? Toca em «Entrar» no topo.
      </p>
    </div>
  );
}
