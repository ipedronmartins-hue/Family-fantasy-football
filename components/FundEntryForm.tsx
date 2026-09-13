"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export interface FundEntryRow {
  id: string;
  entryType: "receita" | "despesa";
  amount: number;
  description: string | null;
  category: string;
}

const CATEGORY_OPTIONS = [
  { value: "outros", label: "Outros / não especificado" },
  { value: "transporte", label: "Transporte" },
  { value: "equipamento", label: "Equipamento" },
  { value: "torneios", label: "Torneios" },
  { value: "inscricoes", label: "Inscrições" },
  { value: "material", label: "Material" },
];

export function FundEntryForm({ seasonId, entries }: { seasonId: string; entries: FundEntryRow[] }) {
  const [rows, setRows] = useState(entries);
  const [entryType, setEntryType] = useState<"receita" | "despesa">("despesa");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("outros");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function addEntry() {
    const value = Number(amount);
    if (!value || value <= 0) {
      setMessage("Indica um valor válido.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("register_fund_entry", {
      p_season_id: seasonId,
      p_entry_type: entryType,
      p_amount: value,
      p_description: description || null,
      p_category: category,
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRows((prev) => [
      { id: crypto.randomUUID(), entryType, amount: value, description: description || null, category },
      ...prev,
    ]);
    setAmount("");
    setDescription("");
    setCategory("outros");
  }

  async function removeEntry(id: string) {
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("team_fund_entries").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <h2 className="mb-1 font-display text-base font-semibold text-ink">Registar movimento</h2>
      <p className="mb-3 text-xs text-ink/50">
        Só o valor e o tipo são obrigatórios — a nota e a categoria são só para ajudar a
        organizar, não precisas de detalhar tudo ao cêntimo.
      </p>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setEntryType("despesa")}
          className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold ${
            entryType === "despesa" ? "border-red bg-red/10 text-red" : "border-line text-ink/60"
          }`}
        >
          Despesa
        </button>
        <button
          onClick={() => setEntryType("receita")}
          className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold ${
            entryType === "receita" ? "border-blue bg-blue/10 text-blue" : "border-line text-ink/60"
          }`}
        >
          Receita
        </button>
      </div>

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Valor (€)</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        placeholder="0"
        className="mb-3 w-full rounded-xl border border-line px-3 py-2"
      />

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Nota (opcional)</label>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="ex: bolas novas, deslocação a Braga…"
        className="mb-3 w-full rounded-xl border border-line px-3 py-2"
      />

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Categoria (opcional)</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="mb-3 w-full rounded-xl border border-line px-3 py-2"
      >
        {CATEGORY_OPTIONS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <button
        onClick={addEntry}
        disabled={busy}
        className="w-full rounded-xl bg-blue py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "A guardar…" : "Adicionar"}
      </button>
      {message && <p className="mt-2 text-center text-xs text-red">{message}</p>}

      {rows.length > 0 && (
        <ul className="mt-4 border-t border-line pt-3">
          {rows.slice(0, 10).map((r) => (
            <li key={r.id} className="flex items-center gap-2 border-b border-line py-2 text-sm last:border-b-0">
              <span className="flex-1">
                {r.entryType === "receita" ? "+" : "-"}
                {r.amount.toFixed(2)} € {r.description ? `— ${r.description}` : ""}
              </span>
              <button onClick={() => removeEntry(r.id)} className="text-xs font-semibold text-red">
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
