import { PositionGroup } from "@/types/player";

export type FormationId = "4-3-3" | "4-2-3-1" | "4-4-2" | "3-4-3" | "3-5-2";

export interface FormationSlot {
  group: PositionGroup;
  /** Percentage position within the pitch container. */
  left: number;
  bottom: number;
}

export const FORMATION_LABELS: Record<FormationId, string> = {
  "4-3-3": "4-3-3",
  "4-2-3-1": "4-2-3-1",
  "4-4-2": "4-4-2",
  "3-4-3": "3-4-3",
  "3-5-2": "3-5-2",
};

const FOUR_AT_THE_BACK: FormationSlot[] = [
  { group: "GR", left: 50, bottom: 4 },
  { group: "DEF", left: 10, bottom: 24 },
  { group: "DEF", left: 35, bottom: 20 },
  { group: "DEF", left: 65, bottom: 20 },
  { group: "DEF", left: 90, bottom: 24 },
];

const THREE_AT_THE_BACK: FormationSlot[] = [
  { group: "GR", left: 50, bottom: 4 },
  { group: "DEF", left: 20, bottom: 22 },
  { group: "DEF", left: 50, bottom: 18 },
  { group: "DEF", left: 80, bottom: 22 },
];

export const FORMATIONS: Record<FormationId, FormationSlot[]> = {
  "4-3-3": [
    ...FOUR_AT_THE_BACK,
    { group: "MED", left: 25, bottom: 43 },
    { group: "MED", left: 50, bottom: 47 },
    { group: "MED", left: 75, bottom: 43 },
    { group: "EXT", left: 15, bottom: 68 },
    { group: "AV", left: 50, bottom: 74 },
    { group: "EXT", left: 85, bottom: 68 },
  ],
  "4-2-3-1": [
    ...FOUR_AT_THE_BACK,
    { group: "MED", left: 32, bottom: 40 },
    { group: "MED", left: 68, bottom: 40 },
    { group: "EXT", left: 15, bottom: 60 },
    { group: "MED", left: 50, bottom: 62 },
    { group: "EXT", left: 85, bottom: 60 },
    { group: "AV", left: 50, bottom: 78 },
  ],
  "4-4-2": [
    ...FOUR_AT_THE_BACK,
    { group: "EXT", left: 12, bottom: 48 },
    { group: "MED", left: 38, bottom: 44 },
    { group: "MED", left: 62, bottom: 44 },
    { group: "EXT", left: 88, bottom: 48 },
    { group: "AV", left: 35, bottom: 72 },
    { group: "AV", left: 65, bottom: 72 },
  ],
  "3-4-3": [
    ...THREE_AT_THE_BACK,
    { group: "EXT", left: 10, bottom: 46 },
    { group: "MED", left: 37, bottom: 42 },
    { group: "MED", left: 63, bottom: 42 },
    { group: "EXT", left: 90, bottom: 46 },
    { group: "EXT", left: 20, bottom: 72 },
    { group: "AV", left: 50, bottom: 78 },
    { group: "EXT", left: 80, bottom: 72 },
  ],
  "3-5-2": [
    ...THREE_AT_THE_BACK,
    { group: "EXT", left: 8, bottom: 44 },
    { group: "MED", left: 30, bottom: 40 },
    { group: "MED", left: 50, bottom: 44 },
    { group: "MED", left: 70, bottom: 40 },
    { group: "EXT", left: 92, bottom: 44 },
    { group: "AV", left: 38, bottom: 74 },
    { group: "AV", left: 62, bottom: 74 },
  ],
};
