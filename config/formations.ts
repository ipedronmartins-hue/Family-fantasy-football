import { PositionGroup } from "@/types/player";

export type TeamFormat = "fut5" | "fut7" | "fut9" | "fut11";

export const FORMAT_LABELS: Record<TeamFormat, string> = {
  fut5: "Futebol de 5",
  fut7: "Futebol de 7",
  fut9: "Futebol de 9",
  fut11: "Futebol de 11",
};

/** Total titulares (incluindo guarda-redes) para cada formato. */
export const FORMAT_SQUAD_SIZE: Record<TeamFormat, number> = {
  fut5: 5,
  fut7: 7,
  fut9: 9,
  fut11: 11,
};

export interface FormationSlot {
  group: PositionGroup;
  /** Percentage position within the pitch container. */
  left: number;
  bottom: number;
}

const GR: FormationSlot = { group: "GR", left: 50, bottom: 4 };

// ---------- Futebol de 5 (1 GR + 4) ----------
const FUT5_FORMATIONS: Record<string, FormationSlot[]> = {
  "2-2": [
    GR,
    { group: "DEF", left: 25, bottom: 26 },
    { group: "DEF", left: 75, bottom: 26 },
    { group: "AV", left: 30, bottom: 66 },
    { group: "AV", left: 70, bottom: 66 },
  ],
  "1-2-1": [
    GR,
    { group: "DEF", left: 50, bottom: 24 },
    { group: "MED", left: 22, bottom: 48 },
    { group: "MED", left: 78, bottom: 48 },
    { group: "AV", left: 50, bottom: 74 },
  ],
  "3-1": [
    GR,
    { group: "DEF", left: 18, bottom: 26 },
    { group: "DEF", left: 50, bottom: 22 },
    { group: "DEF", left: 82, bottom: 26 },
    { group: "AV", left: 50, bottom: 72 },
  ],
};

// ---------- Futebol de 7 (1 GR + 6) ----------
const FUT7_FORMATIONS: Record<string, FormationSlot[]> = {
  "3-2-1": [
    GR,
    { group: "DEF", left: 15, bottom: 24 },
    { group: "DEF", left: 50, bottom: 20 },
    { group: "DEF", left: 85, bottom: 24 },
    { group: "MED", left: 30, bottom: 48 },
    { group: "MED", left: 70, bottom: 48 },
    { group: "AV", left: 50, bottom: 74 },
  ],
  "2-3-1": [
    GR,
    { group: "DEF", left: 25, bottom: 24 },
    { group: "DEF", left: 75, bottom: 24 },
    { group: "MED", left: 15, bottom: 48 },
    { group: "MED", left: 50, bottom: 44 },
    { group: "MED", left: 85, bottom: 48 },
    { group: "AV", left: 50, bottom: 74 },
  ],
  "2-2-2": [
    GR,
    { group: "DEF", left: 25, bottom: 24 },
    { group: "DEF", left: 75, bottom: 24 },
    { group: "MED", left: 30, bottom: 46 },
    { group: "MED", left: 70, bottom: 46 },
    { group: "AV", left: 30, bottom: 72 },
    { group: "AV", left: 70, bottom: 72 },
  ],
};

// ---------- Futebol de 9 (1 GR + 8) ----------
const FUT9_FORMATIONS: Record<string, FormationSlot[]> = {
  "3-3-2": [
    GR,
    { group: "DEF", left: 15, bottom: 22 },
    { group: "DEF", left: 50, bottom: 18 },
    { group: "DEF", left: 85, bottom: 22 },
    { group: "MED", left: 18, bottom: 44 },
    { group: "MED", left: 50, bottom: 40 },
    { group: "MED", left: 82, bottom: 44 },
    { group: "AV", left: 35, bottom: 72 },
    { group: "AV", left: 65, bottom: 72 },
  ],
  "3-4-1": [
    GR,
    { group: "DEF", left: 15, bottom: 22 },
    { group: "DEF", left: 50, bottom: 18 },
    { group: "DEF", left: 85, bottom: 22 },
    { group: "MED", left: 12, bottom: 46 },
    { group: "MED", left: 38, bottom: 42 },
    { group: "MED", left: 62, bottom: 42 },
    { group: "MED", left: 88, bottom: 46 },
    { group: "AV", left: 50, bottom: 74 },
  ],
  "2-4-2": [
    GR,
    { group: "DEF", left: 25, bottom: 22 },
    { group: "DEF", left: 75, bottom: 22 },
    { group: "MED", left: 12, bottom: 46 },
    { group: "MED", left: 38, bottom: 42 },
    { group: "MED", left: 62, bottom: 42 },
    { group: "MED", left: 88, bottom: 46 },
    { group: "AV", left: 35, bottom: 72 },
    { group: "AV", left: 65, bottom: 72 },
  ],
};

// ---------- Futebol de 11 (1 GR + 10) ----------
const FOUR_AT_THE_BACK: FormationSlot[] = [
  GR,
  { group: "DEF", left: 10, bottom: 24 },
  { group: "DEF", left: 35, bottom: 20 },
  { group: "DEF", left: 65, bottom: 20 },
  { group: "DEF", left: 90, bottom: 24 },
];

const THREE_AT_THE_BACK: FormationSlot[] = [
  GR,
  { group: "DEF", left: 20, bottom: 22 },
  { group: "DEF", left: 50, bottom: 18 },
  { group: "DEF", left: 80, bottom: 22 },
];

const FUT11_FORMATIONS: Record<string, FormationSlot[]> = {
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

export const FORMATIONS_BY_FORMAT: Record<TeamFormat, Record<string, FormationSlot[]>> = {
  fut5: FUT5_FORMATIONS,
  fut7: FUT7_FORMATIONS,
  fut9: FUT9_FORMATIONS,
  fut11: FUT11_FORMATIONS,
};

export function formationIdsFor(format: TeamFormat): string[] {
  return Object.keys(FORMATIONS_BY_FORMAT[format]);
}

export function defaultFormationFor(format: TeamFormat): string {
  return formationIdsFor(format)[0];
}
