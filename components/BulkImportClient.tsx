"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { PositionGroup, POSITION_GROUP_LABELS } from "@/types/player";

const POSITIONS: PositionGroup[] = ["GR", "DEF", "MED", "EXT", "AV"];

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

interface ParsedPlayer {
  number: number;
  name: string;
  position: PositionGroup;
}

interface ParsedMatch {
  kickoff: Date;
  opponent: string;
  home: boolean;
}

function parsePlayers(text: string): { ok: ParsedPlayer[]; bad: string[] } {
  const ok: ParsedPlayer[] = [];
  const bad: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(\d+)\s*[—–;|.-]\s*(.+?)(?:\s+[—–;|-]\s+(GR|DEF|MED|EXT|AV))?\s*$/i);
    const number = Number(m?.[1]);
    const name = m?.[2]?.trim();
    const pos = (m?.[3]?.toUpperCase() ?? "") as PositionGroup;
    if (!m || !Number.isInteger(number) || number <= 0 || !name) {
      bad.push(line);
      continue;
    }
    ok.push({ number, name, position: POSITIONS.includes(pos) ? pos : "MED" });
  }
  return { ok, bad };
}

function parseMatches(text: string): { ok: ParsedMatch[]; bad: string[] } {
  const ok: ParsedMatch[] = [];
  const bad: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s*;\s*/);
    const m = parts[0]?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
    const opponent = parts[1]?.trim();
    const where = parts[2]?.trim().toLowerCase();
    if (!m || !opponent || (where !== "casa" && where !== "fora")) {
      bad.push(line);
      continue;
    }
    const [, d, mo, y, h = "10", mi = "00"] = m;
    const kickoff = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
    if (isNaN(kickoff.getTime())) {
      bad.push(line);
      continue;
    }
    ok.push({ kickoff, opponent, home: where === "casa" });
  }
  return { ok, bad };
}

export function BulkImportClient({
  teamSlug,
  seasonId,
  existingNumbers,
  nextMatchday,
}: {
  teamSlug: string;
  seasonId: string;
  existingNumbers: number[];
  nextMatchday: number;
}) {
  const router = useRouter();
  const [playersText, setPlayersText] = useState("");
  const [matchesText, setMatchesText] = useState("");
  const [competition, setCompetition] = useState("Campeonato");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const players = useMemo(() => parsePlayers(playersText), [playersText]);
  const matches = useMemo(() => parseMatches(matchesText), [matchesText]);
  const repeatedNumbers = players.ok.filter((p) => existingNumbers.includes(p.number)).map((p) => p.number);

  async function importPlayers() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("players").insert(
      players.ok.map((p) => ({
        season_id: seasonId,
        external_id: slugify(p.name, p.number),
        name: p.name,
        shirt_number: p.number,
        position_group: p.position,
        position_label: POSITION_GROUP_LABELS[p.position],
        traits: [],
      }))
    );
    setBusy(false);
    if (error) {
      setMessage(`Erro: ${error.message}`);
      return;
    }
    setMessage(`${players.ok.length} jogadores importados.`);
    setPlayersText("");
    router.refresh();
  }

  async function importMatches() {
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const sorted = [...matches.ok].sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
    const { error } = await supabase.from("matches").insert(
      sorted.map((m, i) => ({
        season_id: seasonId,
        matchday: nextMatchday + i,
        opponent: m.opponent,
        competition,
        kickoff_at: m.kickoff.toISOString(),
        home: m.home,
      }))
    );
    setBusy(false);
    if (error) {
      setMessage(`Erro: ${error.message}`);
      return;
    }
    setMessage(`${sorted.length} jogos importados.`);
    setMatchesText("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {message && <p className="rounded-xl bg-blue/5 p-2 text-center text-xs text-blue">{message}</p>}

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-display text-base font-semibold text-ink">Plantel</h2>
        <p className="mb-2 mt-1 text-xs text-ink/50">
          Um jogador por linha: <strong>número — nome</strong>. Opcional no fim: GR, DEF, MED, EXT ou AV
          (por omissão fica MED).
        </p>
        <textarea
          value={playersText}
          onChange={(e) => setPlayersText(e.target.value)}
          rows={8}
          placeholder={"1 — Enzo — GR\n4 — Manau — DEF\n10 — V. Coutinho"}
          className="w-full rounded-xl border border-line px-3 py-2 font-mono text-xs"
        />
        {players.ok.length > 0 && (
          <p className="mt-2 text-xs text-ink/60">✓ {players.ok.length} jogadores reconhecidos</p>
        )}
        {players.bad.length > 0 && (
          <p className="mt-1 text-xs text-red">Não percebi: {players.bad.join(" · ")}</p>
        )}
        {repeatedNumbers.length > 0 && (
          <p className="mt-1 text-xs text-red">
            Já existem jogadores com os números: {repeatedNumbers.join(", ")}
          </p>
        )}
        <button
          onClick={importPlayers}
          disabled={busy || players.ok.length === 0 || players.bad.length > 0 || repeatedNumbers.length > 0}
          className="mt-3 w-full rounded-xl bg-blue py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Importar {players.ok.length || ""} jogadores
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-display text-base font-semibold text-ink">Calendário</h2>
        <p className="mb-2 mt-1 text-xs text-ink/50">
          Um jogo por linha: <strong>dd/mm/aaaa hh:mm; adversário; casa</strong> (ou fora). A hora é
          opcional (10:00 por omissão). As jornadas são numeradas pela ordem das datas, a começar
          na {nextMatchday}.
        </p>
        <label className="mb-1 block text-xs font-semibold text-ink/70">Competição</label>
        <input
          value={competition}
          onChange={(e) => setCompetition(e.target.value)}
          className="mb-2 w-full rounded-xl border border-line px-3 py-2 text-sm"
        />
        <textarea
          value={matchesText}
          onChange={(e) => setMatchesText(e.target.value)}
          rows={8}
          placeholder={"04/10/2026 10:30; FC Exemplo; casa\n11/10/2026; SC Exemplo; fora"}
          className="w-full rounded-xl border border-line px-3 py-2 font-mono text-xs"
        />
        {matches.ok.length > 0 && (
          <p className="mt-2 text-xs text-ink/60">✓ {matches.ok.length} jogos reconhecidos</p>
        )}
        {matches.bad.length > 0 && (
          <p className="mt-1 text-xs text-red">Não percebi: {matches.bad.join(" · ")}</p>
        )}
        <button
          onClick={importMatches}
          disabled={busy || matches.ok.length === 0 || matches.bad.length > 0}
          className="mt-3 w-full rounded-xl bg-blue py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Importar {matches.ok.length || ""} jogos
        </button>
      </section>

      <a href={`/${teamSlug}/admin`} className="block text-center text-xs font-semibold text-blue">
        ← Voltar ao Admin
      </a>
    </div>
  );
}
