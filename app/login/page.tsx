"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

function cleanSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const team = searchParams.get("team");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"credentials" | "team">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamInput, setTeamInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function goTo(path: string) {
    router.push(path);
    router.refresh();
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
      if (slug) return goTo(`/${slug}`);
    }

    if (team) return goTo(`/${team}/onboarding`);

    // Responsável convidado: vai direto para a equipa dele.
    const { data: invitedSlug } = await supabase.rpc("my_invited_team_slug");
    if (invitedSlug) return goTo(`/${invitedSlug}/onboarding`);

    // Não sabemos a equipa: pergunta, em vez de devolver a pessoa ao início.
    setBusy(false);
    setStep("team");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
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
    if (!error) {
      await afterAuth();
      return;
    }
    if (error.code === "user_already_exists" || error.message.includes("already registered")) {
      // Já tem conta: tenta entrar com os mesmos dados, em vez de o mandar andar às voltas.
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (!loginError) {
        await afterAuth();
        return;
      }
      setBusy(false);
      setErrorMsg("Já existe uma conta com este email, mas a palavra-passe não coincide. Toca em «Já tens conta? Entrar».");
      return;
    }
    setBusy(false);
    setErrorMsg("Não foi possível criar a conta. A palavra-passe precisa de pelo menos 6 caracteres.");
  }

  async function continueWithTeam(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    const supabase = createBrowserSupabase();
    const cleaned = cleanSlug(teamInput);
    if (!cleaned) {
      setBusy(false);
      return;
    }
    const { data: exact } = await supabase.from("teams").select("slug").eq("slug", cleaned).maybeSingle();
    if (exact) return goTo(`/${exact.slug}/onboarding`);

    const { data: similar } = await supabase.from("teams").select("slug").ilike("slug", `%${cleaned}%`).limit(3);
    if (similar && similar.length === 1) return goTo(`/${similar[0].slug}/onboarding`);

    setBusy(false);
    setErrorMsg(
      similar && similar.length > 1
        ? "Há várias equipas parecidas. Escreve o nome completo (clube e escalão), como te foi enviado."
        : `Não encontrei nenhuma equipa "${teamInput}". Confirma o nome com o administrador da tua equipa.`
    );
  }

  async function switchAccount() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    setStep("credentials");
    setPassword("");
    setErrorMsg(null);
  }

  if (step === "team") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-20">
        <p className="text-sm text-blue">Family Fantasy Formação</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Qual é a tua equipa?</h1>
        <p className="mt-2 text-sm text-ink/60">
          Entraste com {email}. Escreve o nome da equipa, tal como o administrador ta enviou.
        </p>
        <form onSubmit={continueWithTeam} className="mt-6">
          <input
            required
            autoFocus
            value={teamInput}
            onChange={(e) => setTeamInput(e.target.value)}
            placeholder="ex: Gondomar, FC Infesta Sub-13"
            className="mb-4 w-full rounded-xl border border-line px-3 py-2.5"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Um momento…" : "Continuar"}
          </button>
          {errorMsg && <p className="mt-3 text-center text-xs text-red">{errorMsg}</p>}
        </form>
        <button onClick={switchAccount} className="mt-4 text-center text-xs font-semibold text-blue">
          Entrar com outra conta
        </button>
      </div>
    );
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
