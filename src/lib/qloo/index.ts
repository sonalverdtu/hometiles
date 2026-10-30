// Qloo facade: one place that talks to Qloo (live or mock), parses responses,
// records every call in the trace, and applies per-endpoint fallbacks (SRS FR-703).

import { getConfig } from "../config";
import { insightsParams, qlooGet, type Params } from "./live";
import { mockGet } from "./mock";
import { parseCompareTags, parseDemographics, parseEntityList, parseHeatmap, parseTrending } from "./parse";
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

  /**
   * Entities both groups would enjoy. Live Qloo's compare returns the tags the two groups share;
   * we chain those shared tags into an insights call seeded by both groups. If compare is unavailable
   * or shares nothing, fall back to scoring candidates per group and keeping the maximin.
   */
  async compare(a: string[], b: string[], types: QlooType[], tool = "shared_with_family", contentRating?: string[]): Promise<(QEntity & { a?: number; b?: number; sharedTags?: string[] })[]> {
    if (!a.length || !b.length) return [];
    const params: Params = { "a.signal.interests.entities": a.join(","), "b.signal.interests.entities": b.join(",") };
    try {
      const started = Date.now();
      const raw: unknown = this.mode === "live" ? await qlooGet("/v2/analysis/compare", params) : await mockGet("/v2/analysis/compare", { ...params, "filter.type": types.join(","), take: "10" });
      const entities = parseEntityList(raw);
      const tags = parseCompareTags(raw);
      const aIds = new Set(tags.a.map((t) => t.id));
      const shared: { id: string; name: string; score?: number }[] = tags.shared.length ? tags.shared : tags.b.filter((t) => aIds.has(t.id));
      this.tracer.add({
        tool,
        endpoint: "/v2/analysis/compare",
        params,
        status: 200,
        ms: Date.now() - started,
        count: entities.length || shared.length,
        top: entities.length ? entities.slice(0, 4).map((e) => e.name) : shared.slice(0, 5).map((t) => `#${t.name}`),
        mode: this.mode,
        note: !entities.length && shared.length ? "shared tags → chained into insights" : undefined,
      });
      if (entities.length) return entities;
      if (!shared.length) throw new QlooError("compare shared nothing", 200);
      const tagIds = shared
        .sort((x, y) => (y.score ?? 0) - (x.score ?? 0))
        .slice(0, 5)
        .map((t) => t.id);
      const names = shared.slice(0, 5).map((t) => t.name);
      const pools = await Promise.all(
        types.map((type) => this.insights({ type, interests: [...a, ...b], tags: tagIds, take: 6, contentRating }, tool).catch(() => [] as QEntity[])),
      );
      const exclude = new Set([...a, ...b]);
      return pools
        .flat()
        .filter((e) => !exclude.has(e.id))
        .sort((x, y) => (y.affinity ?? 0) - (x.affinity ?? 0))
        .slice(0, 8)
        .map((e) => ({ ...e, sharedTags: names }));
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

  /**
   * Weekly trend series for one entity (percentiles normalised to 0–100), or null (fallback: bias.trends).
   * The hackathon dataset's trend history can end before today, so an empty window retries the last known one.
   */
  async trending(entityId: string, type: QlooType, start: string, end: string, tool = "whats_rising"): Promise<QTrendPoint[] | null> {
    // The hackathon dataset's trend history currently ends around Sep 2025: try that window first when live.
    const windows: [string, string][] = this.mode === "live" ? [["2025-06-01", "2025-09-30"]] : [[start, end]];
    for (const [s0, e0] of windows) {
      const params: Params = { "filter.type": type, "signal.interests.entities": entityId, "filter.start_date": s0, "filter.end_date": e0 };
      try {
        const pts = await this.call(tool, "/v2/trending", params, parseTrending, (p) => `${p.date}: ${p.percentile.toFixed(2)}`);
        if (pts.length) {
          const scale = pts.every((p) => p.percentile <= 1) ? 100 : 1;
          return pts.map((p) => ({ ...p, percentile: p.percentile * scale }));
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  /** Best /search hit whose name actually matches what the parent typed (avoids "Parle-G" → "G Fuel"). */
  async resolve(name: string, type: QlooType): Promise<QEntity | null> {
    const hits = await this.search(name, [type], 5).catch(() => [] as QEntity[]);
    const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9ऀ-ॿ ]/g, " ").replace(/\s+/g, " ").trim();
    const want = norm(name);
    const tokens = new Set(want.split(" ").filter((t) => t.length > 1));
    let best: QEntity | null = null;
    let bestScore = 0;
    for (const h of hits) {
      const got = norm(h.name);
      const gotTokens = got.split(" ");
      const overlap = gotTokens.filter((t) => tokens.has(t)).length / Math.max(1, tokens.size);
      const score = got === want ? 2 : got.startsWith(want) || want.startsWith(got) ? 1.5 : overlap;
      if (score > bestScore) {
        bestScore = score;
        best = h;
      }
    }
    return bestScore >= 0.6 ? best : null;
  }
}

function topBand(age: QDemographics["age"]): string {
  const best = Object.entries(age).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
  return best ? `${best[0]} (${(best[1] ?? 0).toFixed(2)})` : "n/a";
}
