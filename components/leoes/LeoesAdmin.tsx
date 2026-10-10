"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { fmtFinos, palError, type PalGroup } from "@/lib/palpites";
import RoundsAdmin, { type AdminRound } from "./RoundsAdmin";

export interface AdminMember {
  user_id: string;
  display_name: string;
  status: "pending" | "active" | "suspended";
  is_admin: boolean;
  is_treasurer: boolean;
  email: string | null;
  balance: number;
}

interface Props {
  group: PalGroup;
  isAdmin: boolean;
  members: AdminMember[];
  rounds: AdminRound[];
  selfId: string;
}

const card = "rounded-2xl border border-line bg-white p-4";
const input = "w-full rounded-xl border border-line px-3 py-2 text-sm";
const btn = "rounded-xl bg-blue px-3 py-2 text-xs font-semibold text-white disabled:opacity-50";
const btnGhost = "rounded-xl border border-line bg-bg px-3 py-2 text-xs font-semibold text-ink disabled:opacity-50";

export default function LeoesAdmin({ group, isAdmin, members, rounds, selfId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState({
    fino_value: group.fino_value?.toString() ?? "",
    p1: group.p1_pct?.toString() ?? "",
    p2: group.p2_pct?.toString() ?? "",
    limit: group.member_limit?.toString() ?? "",
    cap: group.jackpot_cap?.toString() ?? "",
  });

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>, okText: string) {
    setBusy(true);
    setMsg(null);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      setMsg({ kind: "err", text: palError(error.message) });
      return false;
    }
    setMsg({ kind: "ok", text: okText });
    router.refresh();
    return true;
  }

  const sb = () => createBrowserSupabase();

  const grant = (m: AdminMember, amount: number) =>
    run(() => sb().rpc("pal_grant_finos", { p_group: group.id, p_user: m.user_id, p_amount: amount }), `${m.display_name}: ${amount > 0 ? "+" : ""}${amount} finos (acertado).`);

  const setStatus = (m: AdminMember, status: string) =>
    run(() => sb().rpc("pal_set_member_status", { p_group: group.id, p_user: m.user_id, p_status: status }), "Atualizado.");

  const setTreasurer = (m: AdminMember, flag: boolean) =>
    run(() => sb().rpc("pal_set_treasurer", { p_group: group.id, p_user: m.user_id, p_flag: flag }), flag ? "Nomeado tesoureiro." : "Tesoureiro removido.");

  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));

  const saveSettings = () =>
    run(
      () =>
        sb().rpc("pal_update_settings", {
          p_group: group.id,
          p_fino_value: numOrNull(settings.fino_value),
          p_p1: numOrNull(settings.p1),
          p_p2: numOrNull(settings.p2),
          p_limit: numOrNull(settings.limit),
          p_cap: numOrNull(settings.cap),
        }),
      "Regras guardadas."
    );

  const pending = members.filter((m) => m.status === "pending");
  const others = members.filter((m) => m.status !== "pending");

  return (
    <div className="mt-4 flex flex-col gap-6">
      {msg && (
        <p className={`rounded-xl px-3 py-2 text-sm ${msg.kind === "ok" ? "bg-[#128C7E]/10 text-[#0b6258]" : "bg-red/10 text-red"}`}>{msg.text}</p>
      )}

      {pending.length > 0 && isAdmin && (
        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Pedidos para entrar</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {pending.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {m.display_name}
                  {m.email && <span className="block text-[11px] text-ink/50">{m.email}</span>}
                </span>
                <span className="flex gap-2">
                  <button className={btn} disabled={busy} onClick={() => setStatus(m, "active")}>Aprovar</button>
                  <button className={btnGhost} disabled={busy} onClick={() => setStatus(m, "suspended")}>Recusar</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={card}>
        <h2 className="font-display text-lg font-semibold">Finos dos jogadores</h2>
        <p className="mt-1 text-xs text-ink/60">
          Regista os finos quando o jogador paga a sua parte ao clube (MB WAY, dinheiro…). O dinheiro nunca passa pela app.
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {others.length === 0 && <li className="text-sm text-ink/60">Ainda não há jogadores aprovados.</li>}
          {others.map((m) => (
            <li key={m.user_id} className="border-t border-line pt-3 first:border-0 first:pt-0">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold">
                  {m.display_name}
                  {m.is_admin && <span className="ml-1 text-[10px] text-blue">capitão</span>}
                  {m.is_treasurer && <span className="ml-1 text-[10px] text-blue">tesoureiro</span>}
                  {m.status === "suspended" && <span className="ml-1 text-[10px] text-red">suspenso</span>}
                </span>
                <span className="text-xs text-ink/70">{fmtFinos(m.balance)} finos</span>
              </div>
              {m.status === "active" && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="text-xs text-ink/70" htmlFor={`finos-${m.user_id}`}>Finos certos:</label>
                  <input
                    id={`finos-${m.user_id}`}
                    inputMode="numeric"
                    placeholder={String(Number(m.balance))}
                    value={amounts[m.user_id] ?? ""}
                    onChange={(e) => setAmounts({ ...amounts, [m.user_id]: e.target.value })}
                    className="w-20 rounded-xl border border-line px-2 py-2 text-sm"
                  />
                  <button
                    className={btn}
                    disabled={
                      busy ||
                      (amounts[m.user_id] ?? "").trim() === "" ||
                      !Number.isInteger(Number(amounts[m.user_id])) ||
                      Number(amounts[m.user_id]) < 0 ||
                      Number(amounts[m.user_id]) === Number(m.balance)
                    }
                    onClick={async () => {
                      const target = Number(amounts[m.user_id]);
                      const delta = target - Number(m.balance);
                      if (!Number.isInteger(delta)) return;
                      if (delta < 0 && !isAdmin) {
                        alert("Só o capitão pode diminuir finos.");
                        return;
                      }
                      if (await grant(m, delta)) setAmounts({ ...amounts, [m.user_id]: "" });
                    }}
                  >
                    Guardar
                  </button>
                </div>
              )}
              {isAdmin && !m.is_admin && m.user_id !== selfId && (
                <div className="mt-2 flex gap-2">
                  <button className={btnGhost} disabled={busy} onClick={() => setTreasurer(m, !m.is_treasurer)}>
                    {m.is_treasurer ? "Tirar tesoureiro" : "Nomear tesoureiro"}
                  </button>
                  <button className={btnGhost} disabled={busy} onClick={() => setStatus(m, m.status === "active" ? "suspended" : "active")}>
                    {m.status === "active" ? "Suspender" : "Reativar"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-ink/50">Escreve o total de finos que o jogador deve ter e carrega em Guardar. A app acerta a diferença.</p>
      </section>

      {isAdmin && (
        <RoundsAdmin
          groupId={group.id}
          rounds={rounds}
          busy={busy}
          run={run}
          onError={(text) => setMsg({ kind: "err", text })}
        />
      )}

      {isAdmin && (
        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Regras do grupo</h2>
          <p className="mt-1 text-xs text-ink/60">Tudo definido por vocês. Só mudam entre jornadas, quando não há palpites feitos.</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            {[
              ["fino_value", "Valor de 1 fino (€, opcional)"],
              ["limit", "Limite de finos por jogador e jornada"],
              ["p1", "% do bolo para o 1.º prémio"],
              ["p2", "% do bolo para o 2.º prémio"],
              ["cap", "Teto do acumulado (finos, opcional)"],
            ].map(([key, label]) => (
              <label key={key} className="flex flex-col gap-1 font-semibold text-ink/70">
                {label}
                <input
                  inputMode="decimal"
                  value={settings[key as keyof typeof settings]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className={input}
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink/50">O que sobra do bolo vai para a caixa do clube. Se ninguém acertar, o prémio acumula para a jornada seguinte.</p>
          <button className={`${btn} mt-3`} disabled={busy} onClick={saveSettings}>Guardar regras</button>
        </section>
      )}
    </div>
  );
}
