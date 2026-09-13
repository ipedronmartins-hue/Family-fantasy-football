"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

interface MatchState {
  homeGoals: number | null;
  awayGoals: number | null;
  status: "scheduled" | "live" | "finished";
}

export function LiveMatchScore({
  matchId,
  initial,
}: {
  matchId: string;
  initial: MatchState;
}) {
  const [state, setState] = useState<MatchState>(initial);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as { home_goals: number | null; away_goals: number | null; status: MatchState["status"] };
          setState({ homeGoals: row.home_goals, awayGoals: row.away_goals, status: row.status });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  return (
    <div className="rounded-2xl border border-line bg-white p-4 text-center">
      {state.status === "live" && (
        <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-red">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red" />
          AO VIVO
        </p>
      )}
      <p className="font-display text-4xl font-bold text-ink">
        {state.homeGoals ?? "-"} - {state.awayGoals ?? "-"}
      </p>
    </div>
  );
}
