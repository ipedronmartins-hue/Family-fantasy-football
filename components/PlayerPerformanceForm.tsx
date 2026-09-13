"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import { createBrowserSupabase } from "@/lib/supabase/client";

type MinutesTier = 0 | 30 | 60;

export interface CardRow {
  id: string;
  playerId: string;
  cardType: "yellow" | "red";
}

export interface PenaltyRow {
  id: string;
  playerId: string;
  eventType: "miss" | "save";
}

export function PlayerPerformanceForm({
  matchId,
  players,
  initialMinutes,
  initialCards,
  initialPenalties,
  initialBonus,
}: {
  matchId: string;
  players: Player[];
  initialMinutes: Record<string, number>;
  initialCards: CardRow[];
  initialPenalties: PenaltyRow[];
  initialBonus: { playerId: string; points: number }[];
}) {
  const toTier = (m: number): MinutesTier => (m >= 60 ? 60 : m > 0 ? 30 : 0);

  const [minutes, setMinutes] = useState<Record<string, MinutesTier>>(() => {
    const map: Record<string, MinutesTier> = {};
    for (const p of players) map[p.id] = toTier(initialMinutes[p.id] ?? 0);
    return map;
  });
  const [cards, setCards] = useState<CardRow[]>(initialCards);
  const [newCardPlayer, setNewCardPlayer] = useState("");
  const [newCardType, setNewCardType] = useState<"yellow" | "red">("yellow");
  const [penalties, setPenalties] = useState<PenaltyRow[]>(initialPenalties);
  const [newPenPlayer, setNewPenPlayer] = useState("");
  const [newPenType, setNewPenType] = useState<"miss" | "save">("miss");
  const [bonus3, setBonus3] = useState(initialBonus.find((b) => b.points === 3)?.playerId ?? "");
  const [bonus2, setBonus2] = useState(initialBonus.find((b) => b.points === 2)?.playerId ?? "");
  const [bonus1, setBonus1] = useState(initialBonus.find((b) => b.points === 1)?.playerId ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const byId = new Map(players.map((p) => [p.id, p]));

  async function saveMinutes() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    for (const [playerId, tier] of Object.entries(minutes)) {
      await supabase
        .from("match_lineups")
        .upsert(
          { match_id: matchId, player_id: playerId, minutes_played: tier, started: tier >= 30 },
          { onConflict: "match_id,player_id" }
        );
    }
    setBusy(false);
    setMessage("Minutos guardados.");
  }

  async function addCard() {
    if (!newCardPlayer) return;
    setBusy(true);
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("match_cards")
      .insert({ match_id: matchId, player_id: newCardPlayer, card_type: newCardType })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setCards((prev) => [...prev, { id: data.id, playerId: newCardPlayer, cardType: newCardType }]);
    setNewCardPlayer("");
  }

  async function removeCard(id: string) {
    const supabase = createBrowserSupabase();
    await supabase.from("match_cards").delete().eq("id", id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  async function addPenalty() {
    if (!newPenPlayer) return;
    setBusy(true);
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("match_penalty_events")
      .insert({ match_id: matchId, player_id: newPenPlayer, event_type: newPenType })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setPenalties((prev) => [...prev, { id: data.id, playerId: newPenPlayer, eventType: newPenType }]);
    setNewPenPlayer("");
  }

  async function removePenalty(id: string) {
    const supabase = createBrowserSupabase();
    await supabase.from("match_penalty_events").delete().eq("id", id);
    setPenalties((prev) => prev.filter((p) => p.id !== id));
  }

  async function saveBonus() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    await supabase.from("match_bonus_points").delete().eq("match_id", matchId);
    const rows = [
      bonus3 && { match_id: matchId, player_id: bonus3, points: 3 },
      bonus2 && { match_id: matchId, player_id: bonus2, points: 2 },
      bonus1 && { match_id: matchId, player_id: bonus1, points: 1 },
    ].filter(Boolean);
    if (rows.length > 0) {
      const { error } = await supabase.from("match_bonus_points").insert(rows as never[]);
      if (error) {
        setBusy(false);
        setMessage(error.message);
        return;
      }
    }
    setBusy(false);
    setMessage("Bónus guardado.");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-1 font-display text-base font-semibold text-ink">Minutos jogados</h2>
        <p className="mb-3 text-xs text-ink/50">
          Precisos para os pontos de participação, clean sheet, e golos sofridos.
        </p>
        <ul>
          {players.map((p) => (
            <li key={p.id} className="flex items-center gap-2 border-b border-line py-2 last:border-b-0">
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                {p.number} {p.name}
              </span>
              {([0, 30, 60] as MinutesTier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setMinutes((prev) => ({ ...prev, [p.id]: tier }))}
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                    minutes[p.id] === tier ? "bg-blue text-white" : "bg-line text-ink/50"
                  }`}
                >
                  {tier === 0 ? "Não jogou" : tier === 30 ? "<60" : "60+"}
                </button>
              ))}
            </li>
          ))}
        </ul>
        <button
          onClick={saveMinutes}
          disabled={busy}
          className="mt-3 w-full rounded-xl bg-blue py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Guardar minutos
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">Cartões</h2>
        <ul className="mb-3">
          {cards.map((c) => (
            <li key={c.id} className="flex items-center gap-2 border-b border-line py-2 text-sm last:border-b-0">
              <span className="flex-1">
                {c.cardType === "yellow" ? "🟨" : "🟥"} {byId.get(c.playerId)?.name ?? "?"}
              </span>
              <button onClick={() => removeCard(c.id)} className="text-xs font-semibold text-red">
                remover
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <select
            value={newCardPlayer}
            onChange={(e) => setNewCardPlayer(e.target.value)}
            className="flex-1 rounded-xl border border-line px-2 py-2 text-sm"
          >
            <option value="">Jogador</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={newCardType}
            onChange={(e) => setNewCardType(e.target.value as "yellow" | "red")}
            className="rounded-xl border border-line px-2 py-2 text-sm"
          >
            <option value="yellow">Amarelo</option>
            <option value="red">Vermelho</option>
          </select>
        </div>
        <button
          onClick={addCard}
          disabled={busy || !newCardPlayer}
          className="mt-3 w-full rounded-xl border border-blue py-2 text-sm font-semibold text-blue disabled:opacity-50"
        >
          Adicionar cartão
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">Grandes penalidades</h2>
        <ul className="mb-3">
          {penalties.map((pe) => (
            <li key={pe.id} className="flex items-center gap-2 border-b border-line py-2 text-sm last:border-b-0">
              <span className="flex-1">
                {pe.eventType === "miss" ? "❌ Falhou" : "🧤 Defendeu"} — {byId.get(pe.playerId)?.name ?? "?"}
              </span>
              <button onClick={() => removePenalty(pe.id)} className="text-xs font-semibold text-red">
                remover
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <select
            value={newPenPlayer}
            onChange={(e) => setNewPenPlayer(e.target.value)}
            className="flex-1 rounded-xl border border-line px-2 py-2 text-sm"
          >
            <option value="">Jogador</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={newPenType}
            onChange={(e) => setNewPenType(e.target.value as "miss" | "save")}
            className="rounded-xl border border-line px-2 py-2 text-sm"
          >
            <option value="miss">Falhou</option>
            <option value="save">Defendeu</option>
          </select>
        </div>
        <button
          onClick={addPenalty}
          disabled={busy || !newPenPlayer}
          className="mt-3 w-full rounded-xl border border-blue py-2 text-sm font-semibold text-blue disabled:opacity-50"
        >
          Adicionar
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-1 font-display text-base font-semibold text-ink">
          Bónus — melhores em campo
        </h2>
        <p className="mb-3 text-xs text-ink/50">Até 3 jogadores, à tua avaliação.</p>
        {[
          { label: "3 pontos", value: bonus3, setter: setBonus3 },
          { label: "2 pontos", value: bonus2, setter: setBonus2 },
          { label: "1 ponto", value: bonus1, setter: setBonus1 },
        ].map((row) => (
          <div key={row.label} className="mb-2">
            <label className="mb-1 block text-xs font-semibold text-ink/70">{row.label}</label>
            <select
              value={row.value}
              onChange={(e) => row.setter(e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
            >
              <option value="">Ninguém</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button
          onClick={saveBonus}
          disabled={busy}
          className="mt-2 w-full rounded-xl bg-blue py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Guardar bónus
        </button>
      </section>

      {message && <p className="text-center text-xs text-blue">{message}</p>}
    </div>
  );
}
