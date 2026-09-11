"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function RegistarEquipaPage() {
  const [clubName, setClubName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("team_registration_requests").insert({
      club_name: clubName,
      team_name: teamName,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone || null,
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-20 text-center">
        <p className="font-display text-2xl font-semibold text-ink">Pedido enviado.</p>
        <p className="mt-2 text-sm text-ink/60">
          Entramos em contacto convosco para combinar os detalhes e a mensalidade de 20 €.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-20 pt-8">
      <p className="text-sm text-blue">Family Fantasy Soccer</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Trazer a tua equipa</h1>
      <p className="mt-2 text-sm text-ink/60">
        A tua equipa pode ter a sua própria versão do Family Fantasy Soccer, com o vosso
        plantel e calendário, por 20 €/mês.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink/70">Clube</label>
          <input
            required
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink/70">Equipa (ex: Sub-11)</label>
          <input
            required
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink/70">O teu nome</label>
          <input
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink/70">Email</label>
          <input
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink/70">Telefone (opcional)</label>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2.5"
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {status === "sending" ? "A enviar…" : "Pedir inscrição"}
        </button>
        {status === "error" && (
          <p className="text-center text-xs text-red">Não foi possível enviar. Tenta outra vez.</p>
        )}
      </form>
    </div>
  );
}
