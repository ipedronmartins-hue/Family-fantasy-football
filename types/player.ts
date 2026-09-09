export type PositionGroup = "GR" | "DEF" | "MED" | "EXT" | "AV";

export interface Player {
  /** Unique internal ID — never derived from the display name, since names can repeat. */
  id: string;
  /** Jersey number for the pilot squad. */
  number: number;
  /** Display name shown to parents. May be disambiguated (e.g. "Duarte S."). */
  name: string;
  positionGroup: PositionGroup;
  /** Specific position label as used by the club (e.g. "Defesa Central"). */
  positionLabel: string;
  traits: string[];
  /** Optional rating, not used for Fantasy scoring in V1. */
  rating?: number;
}

export const POSITION_GROUP_LABELS: Record<PositionGroup, string> = {
  GR: "Guarda-redes",
  DEF: "Defesas",
  MED: "Médios",
  EXT: "Extremos",
  AV: "Avançados",
};

/** Pitch order — top to bottom, the way a parent would read a lineup sheet. */
export const POSITION_GROUP_ORDER: PositionGroup[] = ["GR", "DEF", "MED", "EXT", "AV"];
