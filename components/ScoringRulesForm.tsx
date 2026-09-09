"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export interface ScoringRules {
  correctOutcomeGuess: number;
  exactResultGuess: number;
  exactGoalsGuess: number;
  scorerGuess: number;
  assistGuess: number;
  manOfTheMatchGuess: number;
  startingXIGuess: number;
  bonus: { captain: number };
}

const FIELDS: { key: keyof Omit<ScoringRules, "bonus">; label: string }[] = [
  { key: "correctOutcomeGuess", label: "Acertar o resultado (vitória / empate / derrota)" },
  { key: "exactResultGuess", label: "Acertar o resultado exato" },
  { key: "exactGoalsGuess", label: "Acertar o nº exato de golos do Gondomar" },
  { key: "scorerGuess", label: "Acertar o marcador" },
  { key: "assistGuess", label: "Acertar a assistência" },
  { key: "manOfTheMatchGuess", label: "Acertar o Homem do Jogo" },
  { key: "startingXIGuess", label: "Por cada titular acertado no 11 provável" },
];

export function ScoringRulesForm({ seasonId, initial }: { seasonId: string; initial: ScoringRules }) {
  const [rules, setRules] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function setField(key: keyof Omit<ScoringRules, "bonus">, value: string) {
    setRules((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase
      .from("scoring_rules")
      .update({ rules, updated_at: new Date().toISOString() })
      .eq("season_id", seasonId);
    setSaving(false);
    setMessage(error ? error.message : "Regras guardadas — já se aplicam ao próximo recálculo.");
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      {FIELDS.map((f) => (
        <div key={f.key} className="mb-3 flex items-center justify-between gap-3">
          <label className="text-sm text-ink/80">{f.label}</label>
          <input
            value={rules[f.key]}
            onChange={(e) => setField(f.key, e.target.value)}
            inputMode="numeric"
            className="w-16 shrink-0 rounded-lg border border-line px-2 py-1.5 text-center"
          />
        </div>
      ))}
      <div className="mb-3 flex items-center justify-between gap-3 border-t border-line pt-3">
        <label className="text-sm text-ink/80">
          Bónus de capitão (se acertares o MVP e ele for o teu capitão)
        </label>
        <input
          value={rules.bonus.captain}
          onChange={(e) =>
            setRules((prev) => ({ ...prev, bonus: { captain: Number(e.target.value) || 0 } }))
          }
          inputMode="numeric"
          className="w-16 shrink-0 rounded-lg border border-line px-2 py-1.5 text-center"
        />
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-xl bg-blue py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "A guardar…" : "Guardar regras"}
      </button>
      {message && <p className="mt-3 text-center text-xs text-blue">{message}</p>}
    </div>
  );
}
