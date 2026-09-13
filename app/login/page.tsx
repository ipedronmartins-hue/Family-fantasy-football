"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const team = searchParams.get("team");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createBrowserSupabase();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (team) callbackUrl.searchParams.set("team", team);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-20">
      <p className="text-sm text-blue">Family Fantasy Soccer</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Entrar</h1>
      <p className="mt-2 text-sm text-ink/60">
        Sem palavra-passe — enviamos-te um link de acesso por email.
      </p>

      {status === "sent" ? (
        <div className="mt-6 rounded-2xl border border-line bg-white p-4 text-sm text-ink">
          Verifica o teu email — enviámos um link para {email}. Podes fechar esta janela.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6">
          <label className="mb-1.5 block text-xs font-semibold text-ink/70">O teu email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pai@exemplo.com"
            className="mb-4 w-full rounded-xl border border-line px-3 py-2.5"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {status === "sending" ? "A enviar…" : "Enviar link de acesso"}
          </button>
          {status === "error" && (
            <p className="mt-3 text-center text-xs text-red">
              Não foi possível enviar o link. Tenta outra vez.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
