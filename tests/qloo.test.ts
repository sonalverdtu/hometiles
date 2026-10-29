import { describe, expect, it } from "vitest";
import { Qloo } from "../src/lib/qloo";
import { parseDemographics, parseEntityList, parseHeatmap, parseTrending } from "../src/lib/qloo/parse";
import { insightsParams } from "../src/lib/qloo/live";
import { Tracer } from "../src/lib/qloo/trace";

describe("parsers (shapes from Qloo docs; values synthetic)", () => {
  it("parses insights entities with affinity, tags, location and explainability", () => {
    const json = {
      success: true,
      results: {
        entities: [
          {
            entity_id: "E1",
            name: "Some Place",
            types: ["urn:entity:place"],
            popularity: 0.8,
            properties: { image: { url: "https://img.example/1.png" }, address: "1 Street" },
            location: { lat: 1.5, lon: 2.5 },
            tags: [{ tag_id: "urn:tag:genre:x", name: "x", type: "urn:tag:genre" }],
            query: { affinity: 0.77, distance: 420, explainability: { "signal.interests.entities": [{ entity_id: "L1", score: 0.6 }] } },
          },
        ],
      },
    };
    const [e] = parseEntityList(json);
    expect(e).toMatchObject({ id: "E1", type: "urn:entity:place", affinity: 0.77, distanceM: 420, image: "https://img.example/1.png" });
    expect(e.location).toEqual({ lat: 1.5, lon: 2.5, address: "1 Street" });
    expect(e.explain).toEqual([{ entityId: "L1", score: 0.6 }]);
  });

  it("parses search results ({ results: [...] })", () => {
    expect(parseEntityList({ results: [{ entity_id: "a", name: "A", types: ["urn:entity:movie"] }] })[0].type).toBe("urn:entity:movie");
  });

  it("parses demographics, heatmap and trending", () => {
    const demo = parseDemographics({ results: { demographics: [{ entity_id: "E", query: { age: { "24_and_younger": 0.4, "55_and_older": -0.3 }, gender: { male: 0.1, female: -0.1 } } }] } });
    expect(demo[0].age["24_and_younger"]).toBe(0.4);
    const heat = parseHeatmap({ results: { heatmap: [{ location: { latitude: 1, longitude: 2, geohash: "abcdef" }, query: { affinity: 0.9, popularity: 0.2 } }] } });
    expect(heat[0]).toMatchObject({ geohash: "abcdef", affinity: 0.9 });
    const tr = parseTrending({ results: { trending: [{ date: "2026-10-01", population_percentile: 88, population_rank_velocity: 3, velocity_fold_change: 1.2 }] } });
    expect(tr[0]).toMatchObject({ date: "2026-10-01", percentile: 88 });
  });
});

describe("insightsParams", () => {
  it("uses filter.location for places and signal.location for other types", () => {
    const place = insightsParams({ type: "urn:entity:place", point: { lat: 10, lon: 20 }, radiusM: 1000 });
    expect(place["filter.location"]).toBe("POINT(20 10)");
    expect(place["filter.location.radius"]).toBe("1000");
    const brand = insightsParams({ type: "urn:entity:brand", locationQuery: "Delhi", age: "24_and_younger", explain: true });
    expect(brand["signal.location.query"]).toBe("Delhi");
    expect(brand["signal.demographics.age"]).toBe("24_and_younger");
    expect(brand["feature.explainability"]).toBe("true");
  });
});

describe("Qloo facade in mock mode", () => {
  it("searches, runs insights and records a trace", async () => {
    const tracer = new Tracer();
    const q = new Qloo(tracer, "mock");
    const [bheem] = await q.search("Chhota Bheem", ["urn:entity:tv_show"]);
    expect(bheem.id).toBeTruthy();
    const recs = await q.insights({ type: "urn:entity:tv_show", interests: [bheem.id], take: 5 });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.id !== bheem.id)).toBe(true);
    expect(tracer.entries.length).toBe(2);
    expect(tracer.entries.every((e) => e.mode === "mock" && e.status === 200)).toBe(true);
  });

  it("returns null (fallback) instead of throwing when demographics fail", async () => {
    const tracer = new Tracer();
    const q = new Qloo(tracer, "mock");
    const out = await q.demographics(["does-not-exist"]);
    expect(Array.isArray(out) || out === null).toBe(true);
  });
});
