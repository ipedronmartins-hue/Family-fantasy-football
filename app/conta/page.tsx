"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function ContaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage({ ok: false, text: "As palavras-passe não coincidem." });
      return;
    }
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    setMessage(
      error
        ? { ok: false, text: "Não foi possível mudar. Usa pelo menos 6 caracteres." }
        : { ok: true, text: "Palavra-passe alterada." }
    );
    if (!error) {
      setPassword("");
      setConfirm("");
    }
  }

  async function logout() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-20">
      <p className="text-sm text-blue">Family Fantasy Formação</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">A minha conta</h1>

      <form onSubmit={save} className="mt-6">
        <label className="mb-1.5 block text-xs font-semibold text-ink/70">Nova palavra-passe</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-xl border border-line px-3 py-2.5"
        />
        <label className="mb-1.5 block text-xs font-semibold text-ink/70">Repetir</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mb-4 w-full rounded-xl border border-line px-3 py-2.5"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "A guardar…" : "Mudar palavra-passe"}
        </button>
        {message && (
          <p className={`mt-3 text-center text-xs ${message.ok ? "text-blue" : "text-red"}`}>{message.text}</p>
        )}
      </form>

      <button onClick={() => router.back()} className="mt-6 text-center text-xs font-semibold text-blue">
        ← Voltar
      </button>
      <button onClick={logout} className="mt-3 text-center text-xs font-semibold text-red">
        Terminar sessão
      </button>
    </div>
  );
}
