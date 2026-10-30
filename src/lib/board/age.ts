// Age groups and what each may see. Qloo's own age signal is coarse ("24_and_younger" covers a 6-year-old and
// a 24-year-old), and in testing its content-rating filter was ignored for games and let adult sitcoms through
// as TV-PG. So the board decides age-appropriateness itself, per group, on top of what Qloo returns.

import type { Profile } from "./types";

export const AGE_GROUPS = ["young", "child", "teen", "adult"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

/** Older boards (and API callers) only have isChild. */
export const ageGroupOf = (p: Pick<Profile, "ageGroup" | "isChild">): AgeGroup => p.ageGroup ?? (p.isChild ? "child" : "adult");

export const isMinor = (g: AgeGroup) => g !== "adult";

const TV_MOVIE: Record<AgeGroup, string[] | undefined> = {
  young: ["G", "TV-Y", "TV-Y7", "TV-G"],
  child: ["G", "PG", "TV-Y", "TV-Y7", "TV-G", "TV-PG"],
  teen: ["G", "PG", "PG-13", "TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14"],
  adult: undefined,
};

/** Ratings to send as filter.content_rating for movies and TV (undefined = no filter). */
export const screenRatings = (g: AgeGroup) => TV_MOVIE[g];

const GAMES: Record<AgeGroup, string[] | undefined> = {
  young: ["EC", "E"],
  child: ["EC", "E", "E10+"],
  teen: ["EC", "E", "E10+", "T"],
  adult: undefined,
};

/**
 * Checks a rating Qloo returned (ESRB for games, MPAA/TV for screens). Unknown or missing ratings pass,
 * because many good kids' titles have none; the name and tag screen in the toolbox still applies.
 */
export function ratingOk(g: AgeGroup, rating: string | undefined, kind: "game" | "screen"): boolean {
  const allowed = kind === "game" ? GAMES[g] : TV_MOVIE[g];
  if (!allowed || !rating) return true;
  const r = rating.toUpperCase().replace(/^(ESRB|RATED)\s*/, "").replace(/\s+/g, "");
  const known = kind === "game" ? ["EC", "E", "E10+", "T", "M", "AO"] : ["G", "PG", "PG-13", "R", "NC-17", "TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA"];
  return !known.includes(r) || allowed.includes(r);
}
