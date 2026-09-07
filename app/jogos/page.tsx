"use client";

import { useState } from "react";
import { fixtures } from "@/db/seed/fixtures";
import { FixtureRow } from "@/components/FixtureRow";

type Filter = "all" | "home" | "away" | "featured";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "home", label: "Casa" },
  { id: "away", label: "Fora" },
  { id: "featured", label: "FC Porto" },
];

export default function JogosPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = fixtures.filter((f) => {
    if (filter === "all") return true;
    if (filter === "home") return f.home;
    if (filter === "away") return !f.home;
    return f.featured;
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      <header className="bg-blue px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-white/70">Gondomar SC · Sub-13 · 2026/27</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Calendário</h1>
        <p className="mt-2 text-sm text-white/80">
          {fixtures[0].competition} · {fixtures.length} jornadas
        </p>
      </header>

      <main className="flex-1 px-5 pt-6">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                filter === f.id
                  ? "border-blue bg-blue text-white"
                  : "border-line bg-white text-ink/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-line bg-white px-4">
          {visible.map((match) => (
            <FixtureRow key={match.id} match={match} />
          ))}
        </div>
      </main>
    </div>
  );
}
