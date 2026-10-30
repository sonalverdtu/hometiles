// Normalised Qloo shapes shared by the live and mock clients.

export const QLOO_TYPES = [
  "urn:entity:artist",
  "urn:entity:book",
  "urn:entity:brand",
  "urn:entity:destination",
  "urn:entity:movie",
  "urn:entity:person",
  "urn:entity:place",
  "urn:entity:podcast",
  "urn:entity:tv_show",
  "urn:entity:videogame",
] as const;

export type QlooType = (typeof QLOO_TYPES)[number];

export const AGE_BANDS = [
  "24_and_younger",
  "25_to_29",
  "30_to_34",
  "35_to_44",
  "45_to_54",
  "55_and_older",
] as const;

export type AgeBand = (typeof AGE_BANDS)[number];

export interface QTag {
  id: string;
  name: string;
  type?: string;
}

export interface QEntity {
  id: string;
  name: string;
  type: QlooType;
  affinity?: number;
  popularity?: number;
  image?: string;
  tags: QTag[];
  location?: { lat: number; lon: number; address?: string };
  distanceM?: number;
  /** Explainability: which input signals drove this result (0–1). */
  explain?: { entityId: string; score: number }[];
  /** Localised display name when known (e.g. Devanagari). */
  nameLocal?: Partial<Record<"hi" | "es", string>>;
  /** ESRB (games) or MPAA/TV rating when Qloo has one, e.g. "E10+", "TV-PG". */
  contentRating?: string;
}

export interface QDemographics {
  entityId: string;
  age: Partial<Record<AgeBand, number>>;
  gender?: { male?: number; female?: number };
}

export interface QHeatCell {
  geohash: string;
  lat: number;
  lon: number;
  affinity: number;
  popularity?: number;
}

export interface QTrendPoint {
  date: string;
  percentile: number;
  velocity?: number;
  foldChange?: number;
}

export interface InsightsQuery {
  type: QlooType;
  interests?: string[];
  tags?: string[];
  locationQuery?: string;
  point?: { lat: number; lon: number };
  radiusM?: number;
  geohash?: string;
  age?: AgeBand;
  trends?: "off" | "low" | "medium" | "high";
  explain?: boolean;
  resultEntities?: string[];
  /** Restrict results to these tag IDs (union), e.g. kid-friendly place categories. */
  filterTags?: string[];
  excludeTags?: string[];
  /** MPAA-style ratings for movies and TV, e.g. ["G", "PG"]. */
  contentRating?: string[];
  /** Minimum popularity percentile (0–1). */
  popularityMin?: number;
  take?: number;
}

export class QlooError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
