import { PositionGroup } from "@/types/player";

export type FormationId = "4-3-3" | "4-4-2";

export interface FormationSlot {
  group: PositionGroup;
  /** Percentage position within the pitch container. */
  left: number;
  bottom: number;
}

export const FORMATION_LABELS: Record<FormationId, string> = {
  "4-3-3": "4-3-3",
  "4-4-2": "4-4-2",
};

export const FORMATIONS: Record<FormationId, FormationSlot[]> = {
  "4-3-3": [
    { group: "GR", left: 50, bottom: 4 },
    { group: "DEF", left: 10, bottom: 24 },
    { group: "DEF", left: 35, bottom: 20 },
    { group: "DEF", left: 65, bottom: 20 },
    { group: "DEF", left: 90, bottom: 24 },
    { group: "MED", left: 25, bottom: 43 },
    { group: "MED", left: 50, bottom: 47 },
    { group: "MED", left: 75, bottom: 43 },
    { group: "EXT", left: 15, bottom: 68 },
    { group: "AV", left: 50, bottom: 74 },
    { group: "EXT", left: 85, bottom: 68 },
  ],
  "4-4-2": [
    { group: "GR", left: 50, bottom: 4 },
    { group: "DEF", left: 10, bottom: 24 },
    { group: "DEF", left: 35, bottom: 20 },
    { group: "DEF", left: 65, bottom: 20 },
    { group: "DEF", left: 90, bottom: 24 },
    { group: "EXT", left: 12, bottom: 48 },
    { group: "MED", left: 38, bottom: 44 },
    { group: "MED", left: 62, bottom: 44 },
    { group: "EXT", left: 88, bottom: 48 },
    { group: "AV", left: 35, bottom: 72 },
    { group: "AV", left: 65, bottom: 72 },
  ],
};
