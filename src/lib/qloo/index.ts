// Qloo facade: one place that talks to Qloo (live or mock), parses responses,
// records every call in the trace, and applies per-endpoint fallbacks (SRS FR-703).

import { getConfig } from "../config";
import { insightsParams, qlooGet, type Params } from "./live";
import { mockGet } from "./mock";
import { parseDemographics, parseEntityList, parseHeatmap, parseTrending } from "./parse";
import type { Tracer } from "./trace";
import type { AgeBand, InsightsQuery, QDemographics, QEntity, QHeatCell, QlooType, QTrendPoint } from "./types";
import { QlooError } from "./types";

export * from "./types";

export class Qloo {
  readonly mode: "live" | "mock";

  constructor(
    private tracer: Tracer,
    mode?: "live" | "mock",
  ) {
    this.mode = mode ?? getConfig().qlooMode;
  }

  private async call<T>(
    tool: string,
    path: string,
    params: Params,
    parse: (json: unknown) => T[],
    describe: (t: T) => string,
  ): Promise<T[]> {
    const started = Date.now();
    try {
      const json = this.mode === "live" ? await qlooGet(path, params) : await mockGet(path, params);
      const out = parse(json);
      this.tracer.add({
        tool,
        endpoint: path,
        params,
        status: 200,
        ms: Date.now() - started,
        count: out.length,
        top: out.slice(0, 4).map(describe),
        mode: this.mode,
      });
      return out;
    } catch (err) {
      const status = err instanceof QlooError ? err.status : 0;
      this.tracer.add({
        tool,
        endpoint: path,
        params,
        status: "error",
        ms: Date.now() - started,
        count: 0,
        top: [],
        mode: this.mode,
        note: `HTTP ${status || "network"}: ${(err as Error).message.slice(0, 120)}`,
      });
      throw err;
    }
  }

  private note(tool: string, endpoint: string, note: string) {
    this.tracer.add({ tool, endpoint, params: {}, status: "fallback", ms: 0, count: 0, top: [], mode: this.mode, note });
  }

  search(query: string, types?: QlooType[], take = 6) {
    const params: Params = { query, take: String(take) };
    if (types?.length) params.types = types.join(",");
    return this.call("resolve", "/search", params, (j) => parseEntityList(j), (e) => e.name);
  }

  insights(q: InsightsQuery, tool = "insights") {
    return this.call(tool, "/v2/insights", insightsParams(q), (j) => parseEntityList(j, q.type), (e) =>
      e.affinity !== undefined ? `${e.name} (${e.affinity.toFixed(2)})` : e.name,
    );
  }

  /** Demographic affinity per entity, or null if the endpoint isn't available (fallback: age-signal bias only). */
  async demographics(entityIds: string[], tool = "audience_profile"): Promise<QDemographics[] | null> {
    if (!entityIds.length) return [];
    try {
      const results = await Promise.all(
        entityIds.map((id) =>
          this.call(tool, "/v2/insights", { "filter.type": "urn:demographics", "signal.interests.entities": id }, parseDemographics, (d) =>
            topBand(d.age),
          ),
        ),
      );
      return results.flat();
    } catch {
      this.note(tool, "/v2/insights (urn:demographics)", "demographics unavailable → using signal.demographics.age bias only");
      return null;
    }
  }

  /** Taste heatmap around a location, or null (fallback: radius place search). */
  async heatmap(interests: string[], locationQuery: string, age?: AgeBand, tool = "find_local_places"): Promise<QHeatCell[] | null> {
    const params: Params = { "filter.type": "urn:heatmap", "filter.location.query": locationQuery };
    if (interests.length) params["signal.interests.entities"] = interests.join(",");
    if (age) params["signal.demographics.age"] = age;
    try {
      const cells = await this.call(tool, "/v2/insights", params, parseHeatmap, (c) => `${c.geohash} (${c.affinity.toFixed(2)})`);
      if (!cells.length) throw new QlooError("empty heatmap", 200);
      return cells;
    } catch {
      this.note(tool, "/v2/insights (urn:heatmap)", "heatmap unavailable → radius place search");
      return null;
    }
  }

  /** Entities both groups would enjoy. Falls back to scoring candidates per group and keeping the maximin. */
  async compare(a: string[], b: string[], types: QlooType[], tool = "shared_with_family"): Promise<(QEntity & { a?: number; b?: number })[]> {
    if (!a.length || !b.length) return [];
    const params: Params = {
      "a.signal.interests.entities": a.join(","),
      "b.signal.interests.entities": b.join(","),
      "filter.type": types.join(","),
      take: "10",
    };
    try {
      const out = await this.call(tool, "/v2/analysis/compare", params, (j) => parseEntityList(j), (e) => e.name);
      if (out.length) return out;
      throw new QlooError("empty compare", 200);
    } catch {
      this.note(tool, "/v2/analysis/compare", "compare unavailable/empty → per-person scoring, keep maximin");
      const pools = await Promise.all(types.map((type) => this.insights({ type, interests: [...a, ...b], take: 15 }, tool).catch(() => [])));
      const candidates = pools.flat();
      if (!candidates.length) return [];
      const ids = candidates.map((c) => c.id);
      const [sa, sb] = await Promise.all(
        [a, b].map((sig) =>
          Promise.all(types.map((type) => this.insights({ type, interests: sig, resultEntities: ids, take: 50 }, tool).catch(() => []))).then((r) =>
            new Map(r.flat().map((e) => [e.id, e.affinity ?? 0])),
          ),
        ),
      );
      return candidates
        .map((c) => ({ ...c, a: sa.get(c.id) ?? 0, b: sb.get(c.id) ?? 0, affinity: Math.min(sa.get(c.id) ?? 0, sb.get(c.id) ?? 0) }))
        .sort((x, y) => (y.affinity ?? 0) - (x.affinity ?? 0))
        .slice(0, 8);
    }
  }

  /** Weekly trend series for one entity, or null if unavailable (fallback: bias.trends). */
  async trending(entityId: string, type: QlooType, start: string, end: string, tool = "whats_rising"): Promise<QTrendPoint[] | null> {
    const params: Params = { "filter.type": type, "signal.interests.entities": entityId, "filter.start_date": start, "filter.end_date": end };
    try {
      const pts = await this.call(tool, "/v2/trending", params, parseTrending, (p) => `${p.date}: p${p.percentile.toFixed(0)}`);
      return pts.length ? pts : null;
    } catch {
      return null;
    }
  }
}

function topBand(age: QDemographics["age"]): string {
  const best = Object.entries(age).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
  return best ? `${best[0]} (${(best[1] ?? 0).toFixed(2)})` : "n/a";
}
