// Defensive parsers from raw Qloo JSON into normalised shapes.
// Shared by the live client and the mock client so both go through the same code path.

import type { AgeBand, QDemographics, QEntity, QHeatCell, QlooType, QTag, QTrendPoint } from "./types";
import { QLOO_TYPES } from "./types";

type J = Record<string, unknown>;

const isObj = (v: unknown): v is J => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.length > 0 ? v : undefined);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function get(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const key of path.split(".")) {
    if (!isObj(cur)) return undefined;
    cur = cur[key];
  }
  return cur;
}

function pickType(raw: J, fallback?: QlooType): QlooType {
  const candidates = [...arr(raw.types), raw.type, raw.subtype].filter((t): t is string => typeof t === "string");
  for (const c of candidates) {
    if ((QLOO_TYPES as readonly string[]).includes(c)) return c as QlooType;
  }
  return fallback ?? "urn:entity:brand";
}

function parseExplain(raw: J): QEntity["explain"] {
  const ex = get(raw, "query.explainability");
  if (!ex) return undefined;
  const out: { entityId: string; score: number }[] = [];
  const visit = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(visit);
    else if (isObj(v)) {
      const id = str(v.entity_id) ?? str(v.id);
      const score = num(v.score) ?? num(v.weight) ?? num(v.contribution);
      if (id && score !== undefined) out.push({ entityId: id, score });
      else Object.values(v).forEach(visit);
    }
  };
  visit(ex);
  return out.length ? out : undefined;
}

export function parseEntity(rawIn: unknown, fallbackType?: QlooType): QEntity | null {
  if (!isObj(rawIn)) return null;
  const raw = rawIn;
  const id = str(raw.entity_id) ?? str(raw.id);
  const name = str(raw.name);
  if (!id || !name) return null;
  const props = isObj(raw.properties) ? raw.properties : {};
  const image =
    str(get(props, "image.url")) ?? str(get(arr(props.images)[0], "url")) ?? str(raw.image_url) ?? undefined;
  const tags: QTag[] = arr(raw.tags)
    .map((t): QTag | null => (isObj(t) ? { id: str(t.tag_id) ?? str(t.id) ?? "", name: str(t.name) ?? "", type: str(t.type) } : null))
    .filter((t): t is QTag => !!t && !!t.id && !!t.name);
  const loc = isObj(raw.location) ? raw.location : undefined;
  const lat = loc ? (num(loc.lat) ?? num(loc.latitude)) : undefined;
  const lon = loc ? (num(loc.lon) ?? num(loc.lng) ?? num(loc.longitude)) : undefined;
  let nameLocal = isObj(raw.name_local) ? (raw.name_local as QEntity["nameLocal"]) : undefined;
  // Live Qloo carries localized names in properties.akas: [{ value, languages: ["hi", ...] }]
  for (const aka of arr(props.akas)) {
    if (!isObj(aka)) continue;
    const value = str(aka.value)?.replace(/^["'“”«»]+|["'“”«»]+$/g, "").trim();
    const langs = arr(aka.languages).filter((l): l is string => typeof l === "string");
    for (const l of ["hi", "es"] as const) {
      if (value && langs.includes(l) && !nameLocal?.[l]) nameLocal = { ...nameLocal, [l]: value };
    }
  }
  return {
    id,
    name,
    type: pickType(raw, fallbackType),
    affinity: num(get(raw, "query.affinity")) ?? num(raw.affinity),
    popularity: num(raw.popularity),
    image,
    tags,
    location: lat !== undefined && lon !== undefined ? { lat, lon, address: str(props.address) } : undefined,
    distanceM: num(get(raw, "query.distance")) ?? num(raw.distance),
    explain: parseExplain(raw),
    nameLocal,
  };
}

/** /search returns { results: [...] }; /v2/insights returns { results: { entities: [...] } }. */
export function parseEntityList(json: unknown, fallbackType?: QlooType): QEntity[] {
  const list =
    (Array.isArray(get(json, "results.entities")) && (get(json, "results.entities") as unknown[])) ||
    (Array.isArray(get(json, "results")) && (get(json, "results") as unknown[])) ||
    (Array.isArray(get(json, "entities")) && (get(json, "entities") as unknown[])) ||
    [];
  return list.map((r) => parseEntity(r, fallbackType)).filter((e): e is QEntity => !!e);
}

export function parseDemographics(json: unknown): QDemographics[] {
  return arr(get(json, "results.demographics"))
    .map((d): QDemographics | null => {
      if (!isObj(d)) return null;
      const entityId = str(d.entity_id);
      if (!entityId) return null;
      const ageRaw = get(d, "query.age");
      const age: Partial<Record<AgeBand, number>> = {};
      if (isObj(ageRaw)) for (const [k, v] of Object.entries(ageRaw)) if (num(v) !== undefined) age[k as AgeBand] = v as number;
      const g = get(d, "query.gender");
      return {
        entityId,
        age,
        gender: isObj(g) ? { male: num(g.male), female: num(g.female) } : undefined,
      };
    })
    .filter((d): d is QDemographics => !!d);
}

export function parseHeatmap(json: unknown): QHeatCell[] {
  return arr(get(json, "results.heatmap"))
    .map((c): QHeatCell | null => {
      if (!isObj(c)) return null;
      const lat = num(get(c, "location.latitude")) ?? num(get(c, "location.lat"));
      const lon = num(get(c, "location.longitude")) ?? num(get(c, "location.lon"));
      const geohash = str(get(c, "location.geohash"));
      const affinity = num(get(c, "query.affinity"));
      if (lat === undefined || lon === undefined || !geohash || affinity === undefined) return null;
      return { geohash, lat, lon, affinity, popularity: num(get(c, "query.popularity")) };
    })
    .filter((c): c is QHeatCell => !!c);
}

export function parseTrending(json: unknown): QTrendPoint[] {
  return arr(get(json, "results.trending"))
    .map((p): QTrendPoint | null => {
      if (!isObj(p)) return null;
      const date = str(p.date);
      const percentile = num(p.population_percentile);
      if (!date || percentile === undefined) return null;
      return {
        date,
        percentile,
        velocity: num(p.population_rank_velocity),
        foldChange: num(p.velocity_fold_change),
      };
    })
    .filter((p): p is QTrendPoint => !!p);
}

export interface CompareTags {
  shared: (QTag & { score?: number })[];
  a: QTag[];
  b: QTag[];
}

/** /v2/analysis/compare returns tag overlaps: { results: { tags: [...shared], a: [...], b: [...] } }. */
export function parseCompareTags(json: unknown): CompareTags {
  const tagList = (v: unknown) =>
    arr(v)
      .map((t): (QTag & { score?: number }) | null =>
        isObj(t) && str(t.tag_id) && str(t.name)
          ? { id: str(t.tag_id)!, name: str(t.name)!, type: str(t.subtype), score: num(get(t, "query.score")) }
          : null,
      )
      .filter((t): t is QTag & { score?: number } => !!t);
  return { shared: tagList(get(json, "results.tags")), a: tagList(get(json, "results.a")), b: tagList(get(json, "results.b")) };
}
