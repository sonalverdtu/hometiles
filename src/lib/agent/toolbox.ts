// Research tools the agent can call. Each gathers Qloo evidence into candidates with reasons.
// Used by both the Claude tool-runner agent and the scripted planner.

import { distanceM } from "../geo";
import type { Qloo } from "../qloo";
import type { AgeBand, QDemographics, QEntity, QHeatCell, QlooType } from "../qloo/types";
import type { Candidate } from "../board/engine";
import type { EntityRef, Partner, Profile, Reason } from "../board/types";

export interface AgentCtx {
  profile: Profile;
  qloo: Qloo;
  emit: (text: string, tool?: string) => void;
  candidates: Map<string, Candidate>;
  demographics: Map<string, QDemographics>;
  heat?: QHeatCell[];
  notes: string[];
  ran: Set<string>;
}

const FAVOURITE_TYPES: QlooType[] = ["urn:entity:tv_show", "urn:entity:video_game", "urn:entity:artist", "urn:entity:movie"];

const loveIds = (loves: EntityRef[]) => loves.map((l) => l.qlooId).filter((x): x is string => !!x);

function loveName(ctx: AgentCtx, id: string) {
  return ctx.profile.loves.find((l) => l.qlooId === id)?.name ?? ctx.profile.family.flatMap((f) => f.loves).find((l) => l.qlooId === id)?.name;
}

function upsert(ctx: AgentCtx, c: Candidate) {
  const prev = ctx.candidates.get(c.entity.id);
  if (!prev) {
    ctx.candidates.set(c.entity.id, c);
    return;
  }
  const keepCategory = prev.category === "together" || prev.category === "new" ? prev.category : c.category === "together" ? c.category : prev.category;
  ctx.candidates.set(c.entity.id, {
    ...prev,
    category: keepCategory,
    personal: Math.max(prev.personal, c.personal),
    local: c.local ?? prev.local,
    partner: c.partner ?? prev.partner,
    trend: c.trend ?? prev.trend,
    entity: { ...prev.entity, distanceM: c.entity.distanceM ?? prev.entity.distanceM, image: prev.entity.image ?? c.entity.image },
    reasons: [...prev.reasons, ...c.reasons.filter((r) => !prev.reasons.some((p) => p.text === r.text))],
  });
}

function personalReason(ctx: AgentCtx, e: QEntity): Reason {
  const drivers = (e.explain ?? [])
    .sort((a, b) => b.score - a.score)
    .map((x) => loveName(ctx, x.entityId))
    .filter(Boolean)
    .slice(0, 2);
  const because = drivers.length ? `People who love ${drivers.join(" & ")} also love this` : "Matches their taste profile";
  return { kind: "personal", text: `${because} (Qloo affinity ${(e.affinity ?? 0).toFixed(2)})`, value: e.affinity };
}

/** Resolve the person's and family's loves to Qloo entity IDs via /search. */
export async function resolveLoves(ctx: AgentCtx) {
  ctx.emit("Looking up what they love in Qloo's taste graph…", "resolve");
  const all = [...ctx.profile.loves, ...ctx.profile.family.flatMap((f) => f.loves)];
  await Promise.all(
    all
      .filter((l) => !l.qlooId)
      .map(async (l) => {
        const hits = await ctx.qloo.search(l.name, [l.type], 3).catch(() => []);
        const best = hits.find((h) => h.type === l.type) ?? hits[0];
        if (best) {
          l.qlooId = best.id;
          l.image = l.image ?? best.image;
          l.nameLocal = best.nameLocal;
        }
      }),
  );
  const found = all.filter((l) => l.qlooId).length;
  ctx.notes.push(`Resolved ${found}/${all.length} favourites to Qloo entities.`);
}

export async function expandPersonalTaste(ctx: AgentCtx, types: QlooType[] = FAVOURITE_TYPES, take = 10) {
  const ids = loveIds(ctx.profile.loves);
  if (!ids.length) return "No resolved favourites to expand.";
  ctx.emit("Finding shows, games and music they'll love…", "expand_personal_taste");
  ctx.ran.add("expand_personal_taste");
  const results = await Promise.all(
    types.map((type) =>
      ctx.qloo
        .insights({ type, interests: ids, age: ctx.profile.ageBand, explain: true, take }, "expand_personal_taste")
        .catch(() => [] as QEntity[]),
    ),
  );
  let n = 0;
  for (const list of results)
    for (const e of list) {
      n++;
      upsert(ctx, { entity: e, category: "favourites", personal: e.affinity ?? 0.5, reasons: [personalReason(ctx, e)] });
    }
  return `Found ${n} favourite candidates: ${results.flat().slice(0, 8).map((e) => e.name).join(", ")}`;
}

export async function findLocalBrands(ctx: AgentCtx, take = 12) {
  ctx.emit(`Finding snacks and brands popular around ${ctx.profile.city}…`, "find_local_brands");
  ctx.ran.add("find_local_brands");
  const ids = loveIds(ctx.profile.loves);
  const [personal, local] = await Promise.all([
    ctx.qloo.insights({ type: "urn:entity:brand", interests: ids, locationQuery: ctx.profile.city, age: ctx.profile.ageBand, explain: true, take }, "find_local_brands").catch(() => []),
    ctx.qloo.insights({ type: "urn:entity:brand", locationQuery: ctx.profile.city, age: ctx.profile.ageBand, take }, "find_local_brands").catch(() => []),
  ]);
  const localMap = new Map(local.map((e) => [e.id, e.affinity ?? 0.5]));
  const all = new Map<string, QEntity>();
  [...personal, ...local].forEach((e) => all.set(e.id, all.get(e.id) ?? e));
  for (const e of all.values()) {
    const p = personal.find((x) => x.id === e.id);
    const loc = localMap.get(e.id);
    const reasons: Reason[] = [];
    if (p) reasons.push(personalReason(ctx, p));
    if (loc !== undefined) reasons.push({ kind: "local", text: `Popular around ${ctx.profile.city} (local affinity ${loc.toFixed(2)})`, value: loc });
    upsert(ctx, { entity: e, category: "food", personal: p?.affinity ?? 0.4, local: loc, reasons });
  }
  return `Found ${all.size} brands/snacks: ${[...all.values()].slice(0, 8).map((e) => e.name).join(", ")}`;
}

export async function findLocalPlaces(ctx: AgentCtx, radiusM = 2500, useHeatmap = true) {
  ctx.emit("Mapping where their kind of taste lives near home…", "find_local_places");
  ctx.ran.add("find_local_places");
  const ids = loveIds(ctx.profile.loves);
  const home = ctx.profile.home;
  let places: QEntity[] = [];
  let heatUsed = false;
  if (useHeatmap) {
    const cells = await ctx.qloo.heatmap(ids, ctx.profile.city, ctx.profile.ageBand);
    if (cells?.length) {
      ctx.heat = cells;
      const near = home ? cells.filter((c) => distanceM(home, c) <= radiusM) : cells;
      const hot = [...near].sort((a, b) => b.affinity - a.affinity).slice(0, 3);
      if (hot.length) {
        heatUsed = true;
        ctx.emit(`Hot spots found (${hot.map((h) => h.geohash).join(", ")}). Searching places inside them…`, "find_local_places");
        const lists = await Promise.all(
          hot.map((h) =>
            ctx.qloo
              .insights({ type: "urn:entity:place", interests: ids, geohash: h.geohash, age: ctx.profile.ageBand, explain: true, take: 6 }, "find_local_places")
              .then((l) => l.map((e) => ({ ...e, affinity: Math.round((((e.affinity ?? 0.5) + h.affinity) / 2) * 1000) / 1000 })))
              .catch(() => [] as QEntity[]),
          ),
        );
        places = lists.flat();
      }
    }
  }
  const radiusSearch = await ctx.qloo
    .insights(
      home
        ? { type: "urn:entity:place", interests: ids, point: home, radiusM, age: ctx.profile.ageBand, explain: true, take: 12 }
        : { type: "urn:entity:place", interests: ids, locationQuery: ctx.profile.city, radiusM, age: ctx.profile.ageBand, explain: true, take: 12 },
      "find_local_places",
    )
    .catch(() => [] as QEntity[]);
  const byId = new Map<string, QEntity>();
  [...places, ...radiusSearch].forEach((e) => {
    const prev = byId.get(e.id);
    byId.set(e.id, prev ? { ...prev, affinity: Math.max(prev.affinity ?? 0, e.affinity ?? 0), distanceM: prev.distanceM ?? e.distanceM } : e);
  });
  for (const e of byId.values()) {
    const dist = e.distanceM ?? (home && e.location ? distanceM(home, e.location) : undefined);
    const reasons: Reason[] = [personalReason(ctx, e)];
    if (dist !== undefined) reasons.push({ kind: "local", text: `${dist < 1000 ? `${dist} m` : `${(dist / 1000).toFixed(1)} km`} from home`, value: dist });
    if (heatUsed && places.some((p) => p.id === e.id)) reasons.push({ kind: "local", text: "Inside a taste hot-spot on Qloo's heatmap" });
    const local = dist !== undefined ? Math.max(0, 1 - dist / (radiusM * 1.2)) : 0.5;
    upsert(ctx, { entity: { ...e, distanceM: dist }, category: "places", personal: e.affinity ?? 0.5, local, reasons });
  }
  return `Found ${byId.size} places near home${heatUsed ? " (via heatmap hot-spots)" : ""}: ${[...byId.values()].slice(0, 6).map((e) => e.name).join(", ")}`;
}

function partnerFor(d: QDemographics, band: AgeBand): { partner: Partner; ageFit: number; text: string } {
  const young = d.age["24_and_younger"] ?? 0;
  const old = d.age["55_and_older"] ?? 0;
  const own = d.age[band] ?? 0;
  if (old > 0.25 && old > young) return { partner: "elders", ageFit: own, text: `Loved most by people 55+ (${old.toFixed(2)}), a great topic with grandparents` };
  if (young > 0.25) return { partner: "friends", ageFit: own, text: `Big with under-25s (${young.toFixed(2)}), a great topic with cousins and friends` };
  return { partner: "everyone", ageFit: own, text: "Loved across age groups, so everyone can join in" };
}

export async function audienceProfile(ctx: AgentCtx, max = 14) {
  const top = [...ctx.candidates.values()]
    .filter((c) => c.category !== "places")
    .sort((a, b) => b.personal - a.personal)
    .slice(0, max);
  if (!top.length) return "No candidates yet.";
  ctx.emit("Checking who loves each pick, so tiles land in the right conversations…", "audience_profile");
  ctx.ran.add("audience_profile");
  const demo = await ctx.qloo.demographics(top.map((c) => c.entity.id));
  if (!demo) {
    ctx.notes.push("Demographics endpoint unavailable; used the age signal only.");
    return "Demographics unavailable (fallback: age signal only).";
  }
  for (const d of demo) {
    ctx.demographics.set(d.entityId, d);
    const c = ctx.candidates.get(d.entityId);
    if (!c) continue;
    const p = partnerFor(d, ctx.profile.ageBand);
    ctx.candidates.set(d.entityId, { ...c, partner: p.partner, ageFit: p.ageFit, reasons: [...c.reasons, { kind: "audience", text: p.text, value: p.ageFit }] });
  }
  return `Audience profiles for ${demo.length} picks.`;
}

export async function sharedWithFamily(ctx: AgentCtx, relation?: string) {
  const members = ctx.profile.family.filter((f) => f.loves.some((l) => l.qlooId) && (!relation || f.relation.toLowerCase() === relation.toLowerCase()));
  if (!members.length) return "No family member with resolved favourites.";
  ctx.ran.add("shared_with_family");
  const mine = loveIds(ctx.profile.loves);
  const out: string[] = [];
  for (const m of members) {
    ctx.emit(`Comparing their taste with ${m.name}'s to find things to share…`, "shared_with_family");
    const shared = await ctx.qloo.compare(mine, loveIds(m.loves), FAVOURITE_TYPES).catch(() => []);
    for (const e of shared.slice(0, 6)) {
      const ab = e as QEntity & { a?: number; b?: number };
      upsert(ctx, {
        entity: e,
        category: "together",
        personal: e.affinity ?? 0.5,
        partner: /grand|dadu|dadi|nana|nani|abuel/i.test(m.relation + m.name) ? "elders" : "everyone",
        reasons: [{ kind: "shared", text: `Something ${ctx.profile.displayName} and ${m.name} would both enjoy${ab.a !== undefined ? ` (${ab.a.toFixed(2)} / ${ab.b?.toFixed(2)})` : ` (shared affinity ${(e.affinity ?? 0).toFixed(2)})`}` }],
      });
    }
    out.push(`${m.name}: ${shared.slice(0, 4).map((e) => e.name).join(", ") || "nothing shared"}`);
  }
  return `Shared picks → ${out.join("; ")}`;
}

export async function whatsRising(ctx: AgentCtx, today = new Date()) {
  ctx.emit("Spotting what's rising right now that fits their taste…", "whats_rising");
  ctx.ran.add("whats_rising");
  const ids = loveIds(ctx.profile.loves);
  const types: QlooType[] = ["urn:entity:tv_show", "urn:entity:video_game", "urn:entity:artist"];
  const lists = await Promise.all(
    types.map((type) => ctx.qloo.insights({ type, interests: ids, age: ctx.profile.ageBand, trends: "high", take: 8 }, "whats_rising").catch(() => [] as QEntity[])),
  );
  // Top 3 per type (prefer picks not already on the shelf) so every type gets a chance to show it's rising.
  const pool = lists.flatMap((l) => {
    const sorted = [...l].sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0));
    return [...sorted.filter((e) => !ctx.candidates.has(e.id)), ...sorted.filter((e) => ctx.candidates.has(e.id))].slice(0, 3);
  });
  const end = today.toISOString().slice(0, 10);
  const start = new Date(today.getTime() - 56 * 86400000).toISOString().slice(0, 10);
  const series = await Promise.all(pool.map((e) => ctx.qloo.trending(e.id, e.type, start, end)));
  const scored = pool
    .map((e, i) => {
      const pts = series[i] ? [...series[i]!].sort((a, b) => a.date.localeCompare(b.date)).map((p) => p.percentile) : undefined;
      const delta = pts && pts.length > 1 ? pts[pts.length - 1] - pts[0] : undefined;
      return { e, pts, delta };
    })
    .filter((x) => x.delta === undefined || x.delta >= 2)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0));
  let rising = 0;
  for (const { e, pts, delta } of scored) {
    rising++;
    const prev = ctx.candidates.get(e.id);
    const reason: Reason =
      delta !== undefined
        ? { kind: "trending", text: `Rising: up ${delta.toFixed(1)} percentile points in 8 weeks`, value: delta }
        : { kind: "trending", text: "Trending now (Qloo trend bias)" };
    if (prev && rising <= 3 && (delta === undefined || delta >= 5)) {
      // A clearly rising pick earns a spot in "What's new" (freeing its favourites slot for someone else).
      ctx.candidates.set(e.id, { ...prev, category: "new", trend: pts, reasons: [...prev.reasons, reason] });
      continue;
    }
    upsert(ctx, { entity: e, category: "new", personal: e.affinity ?? 0.5, trend: pts, reasons: [reason] });
  }
  return `Rising picks: ${rising}`;
}
