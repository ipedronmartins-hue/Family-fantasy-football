"use client";

import { useState } from "react";
import { Match } from "@/types/match";
import { FixtureRow } from "@/components/FixtureRow";

type Filter = "all" | "home" | "away" | "featured";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "home", label: "Casa" },
  { id: "away", label: "Fora" },
  { id: "featured", label: "FC Porto" },
];

export function JogosClient({ fixtures }: { fixtures: Match[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = fixtures.filter((f) => {
    if (filter === "all") return true;
    if (filter === "home") return f.home;
    if (filter === "away") return !f.home;
    return f.featured;
  });

  return (
    <>
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
    </>
  );
}
