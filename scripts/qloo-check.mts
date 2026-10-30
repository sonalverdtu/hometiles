// Hour-0 capability check (FR-705): run this the moment the Qloo key arrives.
//   npm run qloo:check
// Reads QLOO_API_KEY from .env.local (or the environment) and probes every endpoint HomeTiles uses.

import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
process.env.QLOO_MODE = "live";

const { Qloo } = await import("../src/lib/qloo/index");
const { Tracer } = await import("../src/lib/qloo/trace");
const { getConfig } = await import("../src/lib/config");

const cfg = getConfig();
if (!cfg.qlooKey) {
  console.error("No QLOO_API_KEY found. Add it to hometiles/.env.local first.");
  process.exit(1);
}
console.log(`Base URL: ${cfg.qlooBaseUrl}\n`);

const tracer = new Tracer();
const q = new Qloo(tracer, "live");
const results: { check: string; ok: boolean; detail: string }[] = [];
const record = (check: string, ok: boolean, detail: string) => {
  results.push({ check, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${check}: ${detail}`);
};

// 1. India + LatAm coverage via /search
const probes: [string, string][] = [
  ["Chhota Bheem", "urn:entity:tv_show"],
  ["Motu Patlu", "urn:entity:tv_show"],
  ["Arijit Singh", "urn:entity:artist"],
  ["Parle-G", "urn:entity:brand"],
  ["Haldiram's", "urn:entity:brand"],
  ["Minecraft", "urn:entity:videogame"],
  ["Encanto", "urn:entity:movie"],
  ["Karol G", "urn:entity:artist"],
  ["Takis", "urn:entity:brand"],
];
const ids: Record<string, string> = {};
for (const [name, type] of probes) {
  try {
    const hits = await q.search(name, [type as never], 3);
    const best = hits[0];
    if (best) ids[name] = best.id;
    record(`search "${name}"`, !!best, best ? `${best.name} (${best.type}) ${best.id}` : "no match");
  } catch (e) {
    record(`search "${name}"`, false, (e as Error).message);
  }
}

const seed = ids["Chhota Bheem"] ?? ids["Minecraft"] ?? Object.values(ids)[0];
if (!seed) {
  console.log("\nNo entity resolved; stopping. Check the key and base URL.");
  process.exit(1);
}

// 2. Insights (recommendations) + location for places in Delhi
try {
  const recs = await q.insights({ type: "urn:entity:tv_show", interests: [seed], age: "24_and_younger", explain: true, take: 5 });
  record("insights tv_show", recs.length > 0, recs.map((r) => `${r.name} ${r.affinity?.toFixed(2)}`).join(", ") || "empty");
  record("explainability present", recs.some((r) => r.explain?.length), recs[0]?.explain ? JSON.stringify(recs[0].explain).slice(0, 120) : "no query.explainability in results");
} catch (e) {
  record("insights tv_show", false, (e as Error).message);
}
try {
  const places = await q.insights({ type: "urn:entity:place", interests: [seed], point: { lat: 28.6492, lon: 77.122 }, radiusM: 3000, take: 5 });
  record("insights place near Rajouri Garden (Delhi)", places.length > 0, places.map((p) => `${p.name} ${p.distanceM ?? "?"}m`).join(", ") || "empty");
} catch (e) {
  record("insights place near Delhi", false, (e as Error).message);
}
try {
  const brands = await q.insights({ type: "urn:entity:brand", locationQuery: "New Delhi", age: "24_and_younger", take: 5 });
  record("insights brand + signal.location.query", brands.length > 0, brands.map((b) => b.name).join(", ") || "empty");
} catch (e) {
  record("insights brand + location", false, (e as Error).message);
}

// 3. Demographics
const demo = await q.demographics([seed]);
record("urn:demographics", !!demo?.length, demo?.length ? JSON.stringify(demo[0].age) : "unavailable → fallback");

// 4. Heatmap
const heat = await q.heatmap([seed], "New Delhi", "24_and_younger");
record("urn:heatmap", !!heat?.length, heat?.length ? `${heat.length} cells, top ${heat.sort((a, b) => b.affinity - a.affinity)[0].geohash}` : "unavailable → fallback");

// 5. Compare
const other = ids["Arijit Singh"] ?? ids["Parle-G"];
if (other) {
  const shared = await q.compare([seed], [other], ["urn:entity:tv_show", "urn:entity:movie", "urn:entity:artist"]);
  const usedFallback = tracer.entries.some((e) => e.status === "fallback" && e.endpoint.includes("compare"));
  record("analysis/compare", shared.length > 0 && !usedFallback, `${shared.length} results${usedFallback ? " (via fallback)" : ""}: ${shared.slice(0, 4).map((s) => s.name).join(", ")}`);
}

// 6. Trending
const end = new Date();
const start = new Date(end.getTime() - 56 * 86400000);
const trend = await q.trending(seed, "urn:entity:tv_show", start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
record("v2/trending", !!trend?.length, trend?.length ? `${trend.length} weekly points` : "unavailable → bias.trends fallback");

const errors = tracer.entries.filter((e) => e.status === "error");
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed. ${errors.length} HTTP errors.`);
for (const e of errors) console.log(`  ${e.endpoint} ${e.params["filter.type"] ?? ""}: ${e.note}`);
