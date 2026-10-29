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

export async function qlooGet(path: string, params: Params): Promise<unknown> {
  const { qlooKey, qlooBaseUrl } = getConfig();
  const qs = sortedQuery(params);
  const url = `${qlooBaseUrl}${path}?${qs}`;
  const cached = cacheGet<unknown>(url);
  if (cached !== undefined) return cached;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { headers: { "X-Api-Key": qlooKey, Accept: "application/json" }, signal: ctrl.signal });
      if (res.status >= 500 && attempt === 0) {
        lastErr = new QlooError(`Qloo ${res.status}`, res.status);
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new QlooError(`Qloo ${res.status}: ${body.slice(0, 200)}`, res.status);
      }
      const json = await res.json();
      cacheSet(url, json);
      return json;
    } catch (err) {
      if (err instanceof QlooError) throw err;
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? new QlooError(lastErr.message, 0) : new QlooError("Qloo request failed", 0);
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
  return p;
}
