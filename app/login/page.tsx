"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const team = searchParams.get("team");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);
    const supabase = createBrowserSupabase();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (team) callbackUrl.searchParams.set("team", team);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl.toString() },
    });
    if (error) {
      setStatus("error");
      setErrorMsg("Não foi possível enviar. Tenta outra vez.");
      return;
    }
    setStatus("sent");
    setStage("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("verifying");
    setErrorMsg(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      setStatus("error");
      setErrorMsg("Código incorreto ou expirado. Pede um novo.");
      return;
    }

    // Same routing the email-link path uses: already have a profile? go to
    // your own team. First time here? go finish onboarding for the team
    // this login was started from.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: parent } = await supabase
        .from("parents")
        .select("season_id, seasons(teams(slug))")
        .eq("id", user.id)
        .maybeSingle();
      const slug = (parent?.seasons as unknown as { teams: { slug: string } | null } | null)?.teams?.slug;
      if (slug) {
        router.push(`/${slug}`);
        return;
      }
    }
    router.push(team ? `/${team}/onboarding` : "/");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-20">
      <p className="text-sm text-blue">Family Fantasy Formação</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Entrar</h1>
      <p className="mt-2 text-sm text-ink/60">
        Sem palavra-passe — enviamos-te um código de acesso por email.
      </p>

      {stage === "email" ? (
        <form onSubmit={requestCode} className="mt-6">
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
            {status === "sending" ? "A enviar…" : "Enviar código de acesso"}
          </button>
          {errorMsg && <p className="mt-3 text-center text-xs text-red">{errorMsg}</p>}
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-6">
          <div className="mb-4 rounded-2xl border border-line bg-white p-4 text-sm text-ink">
            Enviámos um email para <strong>{email}</strong>. Podes carregar no link, ou
            escrever aqui o código de 6 dígitos que também vem no email — mais garantido se
            o link não abrir à primeira.
          </div>
          <label className="mb-1.5 block text-xs font-semibold text-ink/70">Código de 6 dígitos</label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            inputMode="numeric"
            autoFocus
            className="mb-4 w-full rounded-xl border border-line px-3 py-2.5 text-center text-lg tracking-widest"
          />
          <button
            type="submit"
            disabled={status === "verifying"}
            className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {status === "verifying" ? "A verificar…" : "Confirmar"}
          </button>
          {errorMsg && <p className="mt-3 text-center text-xs text-red">{errorMsg}</p>}
          <button
            type="button"
            onClick={() => setStage("email")}
            className="mt-3 w-full text-center text-xs font-semibold text-blue"
          >
            Usar outro email ou pedir novo código
          </button>
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
