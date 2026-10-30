// Mock Qloo "server": answers the same paths and query params as the live API, in the documented
// response shapes, from the synthetic catalogue. Lets the whole app run before an API key exists.

import { distanceM, geohashEncode, parseWktPoint } from "../geo";
import type { Params } from "./live";
import { BY_ID, CATALOGUE, CITIES, type Audience, type CityId, type Culture, type MockItem } from "./mock-data";
import { QlooError } from "./types";
import { MOCK_TEMPERAMENT_TAGS } from "../board/temperament";

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

const round = (x: number) => Math.round(x * 1000) / 1000;
const list = (v?: string) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

function toEntity(it: MockItem, query?: Record<string, unknown>) {
  return {
    entity_id: it.id,
    name: it.name,
    types: [it.type],
    popularity: it.popularity,
    tags: it.tags.map((t) => ({ tag_id: `urn:tag:mock:${t}`, name: t.replace(/-/g, " "), type: "urn:tag:keyword:mock" })),
    location: it.lat !== undefined ? { lat: it.lat, lon: it.lon } : undefined,
    properties: { address: it.address },
    name_local: { hi: it.hi, es: it.es },
    query,
  };
}

function cityOf(params: Params): CityId | undefined {
  const q = (params["signal.location.query"] ?? params["filter.location.query"] ?? "").toLowerCase();
  for (const [id, c] of Object.entries(CITIES)) if (q && c.match.test(q)) return id as CityId;
  const wkt = params["filter.location"] ?? params["signal.location"];
  const p = wkt ? parseWktPoint(wkt) : null;
  if (p) {
    return (Object.entries(CITIES) as [CityId, (typeof CITIES)[CityId]][]).sort((a, b) => distanceM(p, a[1].center) - distanceM(p, b[1].center))[0][0];
  }
  const gh = params["filter.location.geohash"];
  if (gh) {
    return (Object.entries(CITIES) as [CityId, (typeof CITIES)[CityId]][]).find(([, c]) => geohashEncode(c.center.lat, c.center.lon, 2) === gh.slice(0, 2))?.[0];
  }
  return undefined;
}

const AUDIENCE_AGE: Record<Audience, number[]> = {
  // affinity by age band: 24-, 25-29, 30-34, 35-44, 45-54, 55+
  kids: [0.8, 0.1, 0.2, 0.15, -0.3, -0.5],
  teens: [0.7, 0.35, 0.05, -0.2, -0.4, -0.55],
  adults: [-0.1, 0.3, 0.4, 0.3, 0.05, -0.2],
  elders: [-0.6, -0.4, -0.25, 0.05, 0.35, 0.7],
  all: [0.1, 0.05, 0.05, 0.05, 0.0, 0.05],
};
const BANDS = ["24_and_younger", "25_to_29", "30_to_34", "35_to_44", "45_to_54", "55_and_older"];

function cultureOfInterests(items: MockItem[]): Culture | undefined {
  const c = items.filter((i) => i.culture !== "global").map((i) => i.culture);
  if (!c.length) return undefined;
  // The most common non-global culture among the interests.
  const counts = new Map<Culture, number>();
  for (const x of c) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function scoreItem(it: MockItem, interests: MockItem[], tagSet: Set<string>, culture: Culture | undefined, params: Params) {
  const overlap = it.tags.filter((t) => tagSet.has(t)).length;
  const tagScore = it.tags.length ? overlap / it.tags.length : 0;
  const cultureScore = !culture ? 0.5 : it.culture === culture ? 1 : it.culture === "global" ? 0.6 : 0.1;
  const band = params["signal.demographics.age"];
  const ageScore = band ? (AUDIENCE_AGE[it.audience][BANDS.indexOf(band)] ?? 0) * 0.5 + 0.5 : 0.5;
  const trend = params["bias.trends"] === "high" && it.rising ? 0.12 : 0;
  const noise = hash01(it.id + interests.map((i) => i.id).join()) * 0.05;
  const affinity = Math.min(1, 0.36 * tagScore + 0.24 * cultureScore + 0.18 * ageScore + 0.17 * it.popularity + trend + noise);
  const explain = interests
    .map((src) => {
      const shared = src.tags.filter((t) => it.tags.includes(t)).length;
      return { entity_id: src.id, score: round(shared / Math.max(1, src.tags.length)) };
    })
    .filter((e) => e.score >= 0.1);
  return { affinity: round(affinity), explain };
}

function insights(params: Params) {
  const type = params["filter.type"];
  if (type === "urn:demographics") return demographics(params);
  if (type === "urn:heatmap") return heatmap(params);
  const interestIds = list(params["signal.interests.entities"]);
  const interests = interestIds.map((id) => BY_ID.get(id)).filter((x): x is MockItem => !!x);
  let tagSet = new Set(interests.flatMap((i) => i.tags));
  for (const t of list(params["signal.interests.tags"])) tagSet.add(t.replace("urn:tag:mock:", ""));
  // Like live Qloo, temperament tags outweigh the seed's own tags.
  const mood = list(params["signal.interests.tags"]).flatMap((t) => MOCK_TEMPERAMENT_TAGS[t] ?? []);
  if (mood.length) tagSet = new Set(mood);
  const cityId = cityOf(params);
  const culture = cultureOfInterests(interests) ?? (cityId ? CITIES[cityId].culture : undefined);
  const city = cityOf(params);
  const onlyIds = new Set(list(params["filter.results.entities"]));
  const point = parseWktPoint(params["filter.location"] ?? "") ?? undefined;
  const radius = Number(params["filter.location.radius"] ?? "15000");
  const geohash = params["filter.location.geohash"];

  let pool = CATALOGUE.filter((c) => c.type === type && !interestIds.includes(c.id));
  if (onlyIds.size) pool = CATALOGUE.filter((c) => onlyIds.has(c.id));
  if (type === "urn:entity:place") {
    pool = pool.filter((c) => (city ? c.city === city : true));
    if (geohash) pool = pool.filter((c) => c.lat !== undefined && geohashEncode(c.lat, c.lon!, geohash.length).startsWith(geohash.slice(0, 5)));
  }
  if (type === "urn:entity:brand" && city) pool = pool.filter((c) => c.culture === CITIES[city].culture || c.culture === "global");

  const take = Number(params.take ?? "20");
  const entities = pool
    .map((it) => {
      const { affinity, explain } = scoreItem(it, interests, tagSet, culture, params);
      const query: Record<string, unknown> = { affinity };
      if (params["feature.explainability"] === "true" && explain.length) query.explainability = { "signal.interests.entities": explain };
      if (point && it.lat !== undefined) query.distance = distanceM(point, { lat: it.lat, lon: it.lon! });
      return { it, query };
    })
    .filter((r) => (point && typeof r.query.distance === "number" ? (r.query.distance as number) <= radius : true))
    .sort((a, b) => (b.query.affinity as number) - (a.query.affinity as number) || a.it.id.localeCompare(b.it.id))
    .slice(0, take)
    .map((r) => toEntity(r.it, r.query));
  return { success: true, results: { entities } };
}

function demographics(params: Params) {
  const ids = list(params["signal.interests.entities"]);
  const demographicsOut = ids
    .map((id) => BY_ID.get(id))
    .filter((x): x is MockItem => !!x)
    .map((it) => {
      const base = AUDIENCE_AGE[it.audience];
      const age = Object.fromEntries(BANDS.map((b, i) => [b, round(base[i] + (hash01(it.id + b) - 0.5) * 0.1)]));
      return { entity_id: it.id, query: { age, gender: { male: 0, female: 0 } } };
    });
  return { success: true, results: { demographics: demographicsOut } };
}

function heatmap(params: Params) {
  const city = cityOf(params) ?? "london";
  const center = CITIES[city].center;
  const interests = list(params["signal.interests.entities"]).map((id) => BY_ID.get(id)).filter((x): x is MockItem => !!x);
  const tagSet = new Set(interests.flatMap((i) => i.tags));
  const hotspots = CATALOGUE.filter((c) => c.type === "urn:entity:place" && c.city === city && c.lat !== undefined).map((c) => ({
    lat: c.lat!,
    lon: c.lon!,
    w: 0.4 + c.tags.filter((t) => tagSet.has(t) || ["family-outing", "play", "street-food", "sweets"].includes(t)).length * 0.2,
  }));
  const cells = [];
  for (let i = -4; i <= 4; i++) {
    for (let j = -4; j <= 4; j++) {
      const lat = center.lat + i * 0.0035;
      const lon = center.lon + j * 0.0035;
      let a = 0.15 + hash01(`${city}${i}${j}`) * 0.1;
      for (const h of hotspots) a += h.w * Math.exp(-distanceM({ lat, lon }, h) / 450);
      cells.push({ location: { latitude: round(lat * 1000) / 1000, longitude: round(lon * 1000) / 1000, geohash: geohashEncode(lat, lon, 6) }, query: { affinity: round(Math.min(1, a)), affinity_rank: 0, popularity: round(hash01(`${i}${j}p`)) } });
    }
  }
  return { success: true, results: { heatmap: cells } };
}

function compare(params: Params) {
  const a = list(params["a.signal.interests.entities"]).map((id) => BY_ID.get(id)).filter((x): x is MockItem => !!x);
  const b = list(params["b.signal.interests.entities"]).map((id) => BY_ID.get(id)).filter((x): x is MockItem => !!x);
  const types = list(params["filter.type"]);
  const aTags = new Set(a.flatMap((i) => i.tags));
  const bTags = new Set(b.flatMap((i) => i.tags));
  const exclude = new Set([...a, ...b].map((i) => i.id));
  const culture = cultureOfInterests([...a, ...b]);
  const results = CATALOGUE.filter((c) => (!types.length || types.includes(c.type)) && !exclude.has(c.id) && c.type !== "urn:entity:place")
    .map((c) => {
      const sa = c.tags.filter((t) => aTags.has(t)).length / c.tags.length;
      const sb = c.tags.filter((t) => bTags.has(t)).length / c.tags.length;
      const familyBonus = c.audience === "all" ? 0.35 : 0;
      const cultureBonus = culture && c.culture === culture ? 0.15 : 0;
      const ra = Math.min(1, sa + familyBonus + cultureBonus);
      const rb = Math.min(1, sb + familyBonus + cultureBonus);
      return { c, ra, rb, joint: Math.min(ra, rb) };
    })
    .filter((r) => r.joint > 0.2)
    .sort((x, y) => y.joint - x.joint || x.c.id.localeCompare(y.c.id))
    .slice(0, Number(params.take ?? "10"))
    .map((r) => toEntity(r.c, { affinity: round(r.joint), a_affinity: round(r.ra), b_affinity: round(r.rb) }));
  return { success: true, results: { entities: results } };
}

function trending(params: Params) {
  const id = list(params["signal.interests.entities"])[0];
  const it = id ? BY_ID.get(id) : undefined;
  if (!it) return { success: true, results: { trending: [] } };
  const end = new Date(params["filter.end_date"] ?? "2026-10-29");
  const points = [];
  for (let w = 0; w < 8; w++) {
    const date = new Date(end.getTime() - w * 7 * 86400000).toISOString().slice(0, 10);
    const base = it.popularity * 100 - (it.rising ? w * 2.6 : w * 0.2) + (hash01(it.id + w) - 0.5) * 2;
    points.push({ date, population_percentile: round(Math.max(1, Math.min(99.9, base))), population_rank: 0, population_rank_velocity: it.rising ? 12 - w : 0, velocity_fold_change: it.rising ? round(1.3 + (7 - w) * 0.1) : 1, population_percent_delta: 0 });
  }
  return { success: true, results: { trending: points } };
}

function search(params: Params) {
  const q = (params.query ?? "").toLowerCase().trim();
  const types = list(params.types);
  if (!q) return { success: true, results: [] };
  const words = q.split(/\s+/);
  const results = CATALOGUE.filter((c) => !types.length || types.includes(c.type))
    .map((c) => {
      const n = c.name.toLowerCase();
      const score = n === q ? 3 : n.startsWith(q) ? 2 : words.every((w) => n.includes(w) || (c.hi ?? "").includes(w) || (c.es ?? "").toLowerCase().includes(w)) ? 1 : 0;
      return { c, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.c.popularity - a.c.popularity)
    .slice(0, Number(params.take ?? "6"))
    .map((r) => toEntity(r.c));
  return { success: true, results };
}

export async function mockGet(path: string, params: Params): Promise<unknown> {
  if (path === "/search") return search(params);
  if (path === "/v2/insights") return insights(params);
  if (path === "/v2/analysis/compare") return compare(params);
  if (path === "/v2/trending") return trending(params);
  throw new QlooError(`mock: no route ${path}`, 404);
}
