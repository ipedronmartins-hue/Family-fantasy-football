import Link from "next/link";
import ClubPicker from "@/components/ClubPicker";

// Seletor de clubes sempre visível: ao contrário de "/", não reencaminha quem
// já tem conta, para se poder trocar de clube ou mostrar a plataforma.
export default function ClubesPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-8">
      <div className="mb-8 flex items-center justify-between">
        <p className="font-display text-lg font-semibold text-blue">Family Fantasy</p>
        <Link href="/login" className="rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-blue">
          Já tenho conta · Entrar
        </Link>
      </div>
      <ClubPicker />
    </div>
  );
}
