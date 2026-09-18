"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const team = searchParams.get("team");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [manualTeam, setManualTeam] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function resolveTeamSlug(input: string): Promise<string | null> {
    const supabase = createBrowserSupabase();
    const cleaned = input
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!cleaned) return null;
    const { data } = await supabase.from("teams").select("slug").eq("slug", cleaned).maybeSingle();
    return data?.slug ?? null;
  }

  async function afterAuth() {
    const supabase = createBrowserSupabase();
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
        router.refresh();
        return;
      }
    }

    if (team) {
      router.push(`/${team}/onboarding`);
      router.refresh();
      return;
    }

    if (manualTeam) {
      const resolved = await resolveTeamSlug(manualTeam);
      if (resolved) {
        router.push(`/${resolved}/onboarding`);
        router.refresh();
        return;
      }
      setBusy(false);
      setErrorMsg(
        `Não encontrei nenhuma equipa com o nome "${manualTeam}". Confirma o nome com o administrador da tua equipa.`
      );
      return;
    }

    setBusy(false);
    setErrorMsg("Preciso de saber a tua equipa para continuar — escreve o nome dela acima.");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setErrorMsg("Email ou palavra-passe incorretos.");
      return;
    }
    await afterAuth();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      setErrorMsg(
        error.message.includes("already registered") || error.message.includes("already exists")
          ? "Já existe uma conta com este email — tenta entrar."
          : "Não foi possível criar a conta. A palavra-passe precisa de pelo menos 6 caracteres."
      );
      return;
    }
    await afterAuth();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-20">
      <p className="text-sm text-blue">Family Fantasy Formação</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        {mode === "login" ? "Entrar" : "Criar conta"}
      </h1>
      <p className="mt-2 text-sm text-ink/60">
        {mode === "login"
          ? "Entra com o teu email e palavra-passe."
          : "A primeira vez? Cria a tua conta em segundos."}
      </p>

      <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="mt-6">
        <label className="mb-1.5 block text-xs font-semibold text-ink/70">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="pai@exemplo.com"
          className="mb-4 w-full rounded-xl border border-line px-3 py-2.5"
        />

        <label className="mb-1.5 block text-xs font-semibold text-ink/70">Palavra-passe</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Pelo menos 6 caracteres"
          className="mb-4 w-full rounded-xl border border-line px-3 py-2.5"
        />

        {mode === "signup" && !team && (
          <>
            <label className="mb-1.5 block text-xs font-semibold text-ink/70">
              Qual é a tua equipa?
            </label>
            <input
              required
              value={manualTeam}
              onChange={(e) => setManualTeam(e.target.value)}
              placeholder="ex: Gondomar"
              className="mb-4 w-full rounded-xl border border-line px-3 py-2.5"
            />
          </>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Um momento…" : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
        {errorMsg && <p className="mt-3 text-center text-xs text-red">{errorMsg}</p>}
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setErrorMsg(null);
        }}
        className="mt-4 text-center text-xs font-semibold text-blue"
      >
        {mode === "login" ? "Ainda não tens conta? Cria uma" : "Já tens conta? Entrar"}
      </button>
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
