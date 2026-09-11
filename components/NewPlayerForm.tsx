"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { CURRENT_SEASON_ID } from "@/lib/supabaseClient";
import { PositionGroup, POSITION_GROUP_LABELS, POSITION_GROUP_ORDER } from "@/types/player";

function slugify(name: string, number: number): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + `-${number}`
  );
}

export function NewPlayerForm({ nextNumber }: { nextNumber: number }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [number, setNumber] = useState(String(nextNumber));
  const [positionGroup, setPositionGroup] = useState<PositionGroup>("MED");
  const [positionLabel, setPositionLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("players").insert({
      season_id: CURRENT_SEASON_ID,
      external_id: slugify(name, Number(number)),
      name,
      shirt_number: Number(number),
      position_group: positionGroup,
      position_label: positionLabel || POSITION_GROUP_LABELS[positionGroup],
      traits: [],
    });

    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/plantel");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-white p-4">
      <label className="mb-1.5 block text-xs font-semibold text-ink/70">Nome</label>
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 w-full rounded-xl border border-line px-3 py-2"
      />

      <div className="mb-4 flex gap-2">
        <div className="w-24">
          <label className="mb-1.5 block text-xs font-semibold text-ink/70">Nº</label>
          <input
            required
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl border border-line px-3 py-2 text-center"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold text-ink/70">Posição</label>
          <select
            value={positionGroup}
            onChange={(e) => setPositionGroup(e.target.value as PositionGroup)}
            className="w-full rounded-xl border border-line px-3 py-2"
          >
            {POSITION_GROUP_ORDER.map((g) => (
              <option key={g} value={g}>
                {POSITION_GROUP_LABELS[g]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="mb-1.5 block text-xs font-semibold text-ink/70">
        Posição específica (opcional, ex: "Defesa Central")
      </label>
      <input
        value={positionLabel}
        onChange={(e) => setPositionLabel(e.target.value)}
        placeholder={POSITION_GROUP_LABELS[positionGroup]}
        className="mb-5 w-full rounded-xl border border-line px-3 py-2"
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "A guardar…" : "Adicionar jogador"}
      </button>
      {message && <p className="mt-3 text-center text-xs text-red">{message}</p>}
    </form>
  );
}
