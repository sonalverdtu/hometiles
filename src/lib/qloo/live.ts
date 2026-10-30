// Live Qloo HTTP client: GET + query string, X-Api-Key header, hackathon base URL only.

import { getConfig } from "../config";
import { cacheGet, cacheSet } from "./cache";
import type { InsightsQuery } from "./types";
import { QlooError } from "./types";

const TIMEOUT_MS = 8000;

export type Params = Record<string, string>;

function sortedQuery(params: Params) {
  return Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");
}

// The hackathon key is rate-limited: keep at most 2 requests in flight, spaced out, and back off on 429.
const MAX_IN_FLIGHT = 2;
const MIN_GAP_MS = 150;
let inFlight = 0;
let lastStart = 0;
const waiting: (() => void)[] = [];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function acquire() {
  if (inFlight >= MAX_IN_FLIGHT) await new Promise<void>((r) => waiting.push(r));
  inFlight++;
  const gap = lastStart + MIN_GAP_MS - Date.now();
  lastStart = Math.max(Date.now(), lastStart + MIN_GAP_MS);
  if (gap > 0) await sleep(gap);
}

function release() {
  inFlight--;
  waiting.shift()?.();
}

export async function qlooGet(path: string, params: Params): Promise<unknown> {
  const { qlooKey, qlooBaseUrl } = getConfig();
  const qs = sortedQuery(params);
  const url = `${qlooBaseUrl}${path}?${qs}`;
  const cached = cacheGet<unknown>(url);
  if (cached !== undefined) return cached;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    await acquire();
    const ctrl = new AbortController();
    // Heatmaps return thousands of cells and can take longer than other calls.
    const timer = setTimeout(() => ctrl.abort(), params["filter.type"] === "urn:heatmap" ? 25_000 : TIMEOUT_MS);
    let retryAfter = 0;
    try {
      const res = await fetch(url, { headers: { "X-Api-Key": qlooKey, Accept: "application/json" }, signal: ctrl.signal });
      if (res.status === 429 || (res.status >= 500 && attempt < 2)) {
        lastErr = new QlooError(`Qloo ${res.status}`, res.status);
        retryAfter = Number(res.headers.get("retry-after")) * 1000 || 600 * 2 ** attempt;
      } else if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new QlooError(`Qloo ${res.status}: ${body.slice(0, 200)}`, res.status);
      } else {
        const json = await res.json();
        cacheSet(url, json);
        return json;
      }
    } catch (err) {
      if (err instanceof QlooError) throw err;
      lastErr = err;
      retryAfter = 300;
    } finally {
      clearTimeout(timer);
      release();
    }
    await sleep(retryAfter);
  }
  throw lastErr instanceof QlooError ? lastErr : lastErr instanceof Error ? new QlooError(lastErr.message, 0) : new QlooError("Qloo request failed", 0);
}

const wkt = (p: { lat: number; lon: number }) => `POINT(${p.lon} ${p.lat})`;

export function insightsParams(q: InsightsQuery): Params {
  const p: Params = { "filter.type": q.type, take: String(q.take ?? 20) };
  if (q.interests?.length) p["signal.interests.entities"] = q.interests.join(",");
  if (q.tags?.length) p["signal.interests.tags"] = q.tags.join(",");
  const isPlace = q.type === "urn:entity:place";
  if (q.geohash) p["filter.location.geohash"] = q.geohash;
  else if (q.point) {
    p[isPlace ? "filter.location" : "signal.location"] = wkt(q.point);
    if (q.radiusM) p[isPlace ? "filter.location.radius" : "signal.location.radius"] = String(q.radiusM);
  } else if (q.locationQuery) {
    p[isPlace ? "filter.location.query" : "signal.location.query"] = q.locationQuery;
    if (q.radiusM && isPlace) p["filter.location.radius"] = String(q.radiusM);
  }
  if (q.age) p["signal.demographics.age"] = q.age;
  if (q.trends) p["bias.trends"] = q.trends;
  if (q.explain) p["feature.explainability"] = "true";
  if (q.resultEntities?.length) p["filter.results.entities"] = q.resultEntities.join(",");
  if (q.filterTags?.length) p["filter.tags"] = q.filterTags.join(",");
  if (q.excludeTags?.length) p["filter.exclude.tags"] = q.excludeTags.join(",");
  if (q.popularityMin !== undefined) p["filter.popularity.min"] = String(q.popularityMin);
  if (q.contentRating?.length && (q.type === "urn:entity:movie" || q.type === "urn:entity:tv_show")) p["filter.content_rating"] = q.contentRating.join(",");
  return p;
}
