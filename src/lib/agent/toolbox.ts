// Research tools the agent can call. Each gathers Qloo evidence into candidates with reasons.
// Used by both the Claude tool-runner agent and the scripted planner.

import { distanceM } from "../geo";
import type { Qloo } from "../qloo";
import type { AgeBand, QDemographics, QEntity, QHeatCell, QlooType } from "../qloo/types";
import type { Candidate } from "../board/engine";
import type { EntityRef, Partner, Profile, Reason } from "../board/types";
import { ageGroupOf, isMinor, ratingOk, screenRatings } from "../board/age";
import { describeChild, temperamentTags } from "../board/temperament";
import { getConfig } from "../config";
import { proposeLocalSnacks } from "../llm";

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

// Kid-friendly place categories (Qloo tag IDs). Adults get nightlife excluded instead.
const KID_PLACE_TAGS = [
  "urn:tag:category:place:ice_cream_shop",
  "urn:tag:category:place:bakery",
  "urn:tag:category:place:park",
  "urn:tag:category:place:playground",
  "urn:tag:category:place:fast_food",
  "urn:tag:category:place:snack_bar",
  "urn:tag:category:place:indian_sweets_shop",
  "urn:tag:genre:place:restaurant:dessert_shop",
  "urn:tag:genre:place:restaurant:street_food",
  "urn:tag:category:place:toy_store",
  "urn:tag:category:place:zoo",
  "urn:tag:children:place:good_for_kids",
];
const NIGHTLIFE_TAGS = ["urn:tag:category:place:bar", "urn:tag:category:place:night_club", "urn:tag:category:place:lounge"];
// Found by testing live Qloo for four children: energy drinks came back as "snacks" for 8–9-year-olds.
const ENERGY_DRINK_TAGS = ["urn:tag:genre:brand:food_and_beverage:drinks:energy_drink"];
// Explicit rap styles that came back for a 9-year-old who loves a film-song singer.
const EXPLICIT_MUSIC_TAGS = ["urn:tag:genre:mumble_rap", "urn:tag:style:qloo:soundcloud_rap", "urn:tag:style:qloo:trap"];
const FOOD_BRAND_TAGS = ["urn:tag:genre:brand:food_and_beverage"];
const isFoodBrand = (e: QEntity) => e.tags.some((t) => /food_and_beverage|genre:brand:dining/.test(t.id)) || e.tags.length === 0;
// Not for a child's board, whatever the taste graph says (word-boundary, so "Barbie" passes).
const ADULT_WORDS = /\b(bar|pub|lounge|brew(ery|ing)?|wine|liquor|beer|vodka|whisk(e)?y|casino|hookah|energy drink|g fuel|red bull|monster energy|slim jim|starbucks|dunkin|coffee|espresso|diet (coke|pepsi)|pepsi nitro|protinex|protein)\b/i;
// Judged on what a place or brand IS (its category and genre tags), never on what it offers: on live Qloo
// nearly every family restaurant carries "offerings: wine/beer/coffee" tags. Matched per tag segment, so
// "bar" never matches "barbecue" or "snack_bar".
const ADULT_KINDS = new Set(["pub", "bar", "night_club", "nightlife", "lounge", "gastropub", "brewery", "wine_bar", "liquor_store", "casino", "hookah_bar", "alcohol", "beer", "wine", "spirits", "tobacco", "vape_shop", "energy_drink", "energy_drinks", "coffee_and_tea", "vitamins_and_supplements", "sports_nutrition", "fitness_nutrition"]);
const LODGING = new Set(["hotel", "inn", "bed_breakfast", "guest_house", "serviced_accommodation", "hostel", "motel"]);
const kindTags = (e: QEntity) => e.tags.filter((t) => /:(category|genre|product_category):/.test(t.id)).flatMap((t) => t.id.split(":"));
const isAdultKind = (e: QEntity) => kindTags(e).some((s) => ADULT_KINDS.has(s));
/** Hotels near home are never a useful place tile, for anyone. */
const isLodging = (e: QEntity) => kindTags(e).some((s) => LODGING.has(s));
const YOUNG_TAGS = /mumble_rap|soundcloud_rap|style:qloo:trap|horrorcore|drill/;
/** Screens a Qloo result for a minor: names, tags, and the rating Qloo reports (its own rating filter misses games). */
function ageSafe(ctx: AgentCtx, e: QEntity): boolean {
  const g = ageGroupOf(ctx.profile);
  if (!isMinor(g)) return true;
  if (ADULT_WORDS.test(e.name) || isAdultKind(e)) return false;
  if (g !== "teen" && e.tags.some((t) => YOUNG_TAGS.test(t.id))) return false;
  const kind = e.type === "urn:entity:videogame" ? "game" : e.type === "urn:entity:tv_show" || e.type === "urn:entity:movie" ? "screen" : null;
  return !kind || ratingOk(g, e.contentRating, kind);
}
const minor = (ctx: AgentCtx) => isMinor(ageGroupOf(ctx.profile));
const ratings = (ctx: AgentCtx) => screenRatings(ageGroupOf(ctx.profile));
/** "Rajouri Garden, New Delhi" → "New Delhi": Qloo's location queries and heatmaps work best at city level. */
const cityOnly = (city: string) => city.split(",").map((s) => s.trim()).filter(Boolean).pop() ?? city;

// Seed each kind of recommendation with the favourites of a related kind (shows → shows/films, music → music),
// so a love of Minecraft doesn't turn into rap recommendations.
const SEED_TYPES: Partial<Record<QlooType, QlooType[]>> = {
  "urn:entity:tv_show": ["urn:entity:tv_show", "urn:entity:movie"],
  "urn:entity:movie": ["urn:entity:movie", "urn:entity:tv_show"],
  "urn:entity:artist": ["urn:entity:artist"],
  "urn:entity:videogame": ["urn:entity:videogame"],
};

function seedsFor(ctx: AgentCtx, type: QlooType): string[] {
  const related = SEED_TYPES[type];
  const matched = related ? ctx.profile.loves.filter((l) => related.includes(l.type)) : [];
  return loveIds(matched.length ? matched : ctx.profile.loves);
}

const FAVOURITE_TYPES: QlooType[] = ["urn:entity:tv_show", "urn:entity:videogame", "urn:entity:artist", "urn:entity:movie"];

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
        const best = await ctx.qloo.resolve(l.name, l.type).catch(() => null);
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
        .insights(
          {
            type,
            interests: seedsFor(ctx, type),
            age: ctx.profile.ageBand,
            explain: true,
            take,
            contentRating: ratings(ctx),
            // Children recognise well-known names: keep music to popular artists.
            popularityMin: ctx.profile.isChild && type === "urn:entity:artist" ? 0.85 : undefined,
            excludeTags: ctx.profile.isChild && type === "urn:entity:artist" ? EXPLICIT_MUSIC_TAGS : undefined,
          },
          "expand_personal_taste",
        )
        .then((l) => l.filter((e) => ageSafe(ctx, e)))
        .catch(() => [] as QEntity[]),
    ),
  );
  if (types.includes("urn:entity:artist")) await parentMusicNudge(ctx, results.flat());
  let n = 0;
  for (const list of results)
    for (const e of list) {
      n++;
      upsert(ctx, { entity: e, category: "favourites", personal: e.affinity ?? 0.5, reasons: [personalReason(ctx, e)] });
    }
  return `Found ${n} favourite candidates: ${results.flat().slice(0, 8).map((e) => e.name).join(", ")}`;
}

const PARENTS = /mother|father|mum|mom|dad|parent|carer/i;

/**
 * Shows and films that fit what the child is like. Qloo has no personality model; it has descriptor tags
 * ("calm", "shy", "energetic"...). Tags outweigh the favourites when sent together, so these results are
 * kept as a lighter, separate signal next to the favourites rather than replacing them.
 */
export async function matchTemperament(ctx: AgentCtx, take = 6) {
  const ts = ctx.profile.temperament ?? [];
  if (!ts.length) return "No temperament given.";
  ctx.ran.add("match_temperament");
  const child = describeChild(ts);
  ctx.emit(`Finding shows and films for ${child}…`, "match_temperament");
  const tags = temperamentTags(ts);
  const types: QlooType[] = ["urn:entity:tv_show", "urn:entity:movie"];
  const lists = await Promise.all(
    types.map((type) =>
      ctx.qloo
        .insights({ type, interests: seedsFor(ctx, type), tags, tagsOperator: "union", age: ctx.profile.ageBand, contentRating: ratings(ctx), take }, "match_temperament")
        .then((l) => l.filter((e) => ageSafe(ctx, e)))
        .catch(() => [] as QEntity[]),
    ),
  );
  const found = lists.flat();
  // The best two per type compete with the favourites at full weight (so the signal is visible on the board);
  // the rest stay lighter, as backups.
  const top = new Set(lists.flatMap((l) => [...l].sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0)).slice(0, 2).map((e) => e.id)));
  for (const e of found) {
    const matched = e.tags.filter((t) => tags.includes(t.id)).map((t) => t.name.toLowerCase());
    upsert(ctx, {
      entity: e,
      category: "favourites",
      personal: (e.affinity ?? 0.5) * (top.has(e.id) ? 1 : 0.8),
      reasons: [
        {
          kind: "temperament",
          text: matched.length ? `For ${child}: Qloo tags it ${[...new Set(matched)].slice(0, 3).join(", ")}` : `For ${child} (from Qloo's descriptor tags)`,
          value: e.affinity,
        },
      ],
    });
  }
  return `Temperament (${ts.join(", ")}) picks: ${found.slice(0, 6).map((e) => e.name).join(", ") || "none"}`;
}

/**
 * Parents' music gently widens the child's music picks. Qloo blends signals evenly (a parent's taste took over
 * the list in testing), so the blend happens here: at most two picks, scored below the child's own.
 */
async function parentMusicNudge(ctx: AgentCtx, own: QEntity[]) {
  const parents = ctx.profile.family.filter((f) => PARENTS.test(f.relation));
  const theirs = parents.flatMap((f) => f.loves.filter((l) => l.type === "urn:entity:artist" && l.qlooId));
  const mine = seedsFor(ctx, "urn:entity:artist");
  if (!theirs.length || !mine.length) return;
  const blended = await ctx.qloo
    .insights(
      {
        type: "urn:entity:artist",
        interests: [...mine, ...loveIds(theirs)],
        age: ctx.profile.ageBand,
        explain: true,
        take: 8,
        popularityMin: ctx.profile.isChild ? 0.85 : undefined,
        excludeTags: ctx.profile.isChild ? EXPLICIT_MUSIC_TAGS : undefined,
      },
      "expand_personal_taste",
    )
    .catch(() => [] as QEntity[]);
  const ownIds = new Set(own.map((e) => e.id));
  const fresh = blended.filter((e) => !ownIds.has(e.id) && ageSafe(ctx, e)).slice(0, 2);
  const who = parents.find((p) => p.loves.some((l) => theirs.includes(l)));
  for (const e of fresh)
    upsert(ctx, {
      entity: e,
      category: "favourites",
      personal: (e.affinity ?? 0.5) * 0.7,
      reasons: [{ kind: "personal", text: `Close to their own music and to ${who?.name ?? "a parent"}'s (${theirs[0].name}), so it may already be playing at home`, value: e.affinity }],
    });
}

export async function findLocalBrands(ctx: AgentCtx, take = 12) {
  ctx.emit(`Finding snacks and brands popular around ${ctx.profile.city}…`, "find_local_brands");
  ctx.ran.add("find_local_brands");
  const ids = loveIds(ctx.profile.loves);
  const noEnergy = minor(ctx) ? ENERGY_DRINK_TAGS : undefined;
  const [personal, local] = await Promise.all([
    ctx.qloo.insights({ type: "urn:entity:brand", interests: ids, age: ctx.profile.ageBand, explain: true, filterTags: FOOD_BRAND_TAGS, excludeTags: noEnergy, take }, "find_local_brands").catch(() => []),
    ctx.qloo
      .insights({ type: "urn:entity:brand", interests: ids, locationQuery: cityOnly(ctx.profile.city), age: ctx.profile.ageBand, filterTags: FOOD_BRAND_TAGS, excludeTags: noEnergy, take: 20 }, "find_local_brands")
      .then((l) => l.filter(isFoodBrand))
      .catch(() => []),
  ]);
  const localMap = new Map(local.map((e) => [e.id, e.affinity ?? 0.5]));
  const all = new Map<string, QEntity>();
  [...personal, ...local].filter((e) => ageSafe(ctx, e)).forEach((e) => all.set(e.id, all.get(e.id) ?? e));
  const verified = await verifiedLocalSnacks(ctx, new Set(all.keys()));
  for (const e of all.values()) {
    const p = personal.find((x) => x.id === e.id);
    const loc = localMap.get(e.id);
    const reasons: Reason[] = [];
    if (p) reasons.push(personalReason(ctx, p));
    if (loc !== undefined) reasons.push({ kind: "local", text: `Popular around ${ctx.profile.city} (local affinity ${loc.toFixed(2)})`, value: loc });
    upsert(ctx, { entity: e, category: "food", personal: p?.affinity ?? loc ?? 0.4, local: loc !== undefined ? Math.min(1, loc + 0.1) : undefined, reasons });
  }
  for (const e of verified)
    upsert(ctx, {
      entity: e,
      category: "food",
      // What the family can actually buy nearby competes with Qloo's global brand picks for this folder;
      // the AI was asked what children there have, which is the age fit.
      personal: 0.85,
      local: 1,
      ageFit: ctx.profile.isChild ? 1 : undefined,
      reasons: [{ kind: "local", text: `A local favourite around ${ctx.profile.city}: suggested by the AI, then found in Qloo (names Qloo doesn't know are dropped)` }],
    });
  return `Found ${all.size + verified.length} brands/snacks: ${[...all.values(), ...verified].slice(0, 8).map((e) => e.name).join(", ")}`;
}

/** The LLM proposes local snack brands; only the ones Qloo can find (and that pass the age screen) are kept. */
async function verifiedLocalSnacks(ctx: AgentCtx, have: Set<string>): Promise<QEntity[]> {
  if (getConfig().llmMode !== "live") return [];
  const names = await proposeLocalSnacks(ctx.profile).catch(() => [] as string[]);
  if (!names.length) return [];
  ctx.emit(`Checking ${names.length} local snacks the AI suggested against Qloo…`, "find_local_brands");
  const found = await Promise.all(names.slice(0, 8).map((n) => ctx.qloo.resolve(n, "urn:entity:brand").catch(() => null)));
  // Must carry a Qloo food tag: name search alone matched "Real" (a juice) to Real Madrid CF.
  const isFood = (e: QEntity) => e.tags.some((t) => /food_and_beverage/.test(t.id));
  const kept = found.filter((e): e is QEntity => !!e && isFood(e) && !have.has(e.id) && ageSafe(ctx, e));
  ctx.notes.push(`Local snacks: the AI suggested ${names.length}, Qloo confirmed ${kept.length} (${names.filter((n, i) => !found[i] || !kept.includes(found[i]!)).join(", ") || "none"} dropped).`);
  return [...new Map(kept.map((e) => [e.id, e])).values()];
}

export async function findLocalPlaces(ctx: AgentCtx, radiusM = 2500, useHeatmap = true) {
  const safety = ctx.profile.isChild ? { filterTags: KID_PLACE_TAGS, excludeTags: NIGHTLIFE_TAGS } : { excludeTags: NIGHTLIFE_TAGS };
  const away = (e: QEntity) => e.distanceM ?? (ctx.profile.home && e.location ? distanceM(ctx.profile.home, e.location) : Infinity);
  ctx.emit("Mapping where their kind of taste lives near home…", "find_local_places");
  ctx.ran.add("find_local_places");
  const ids = loveIds(ctx.profile.loves);
  const home = ctx.profile.home;
  let places: QEntity[] = [];
  let heatUsed = false;
  if (useHeatmap) {
    const cells = await ctx.qloo.heatmap(ids, cityOnly(ctx.profile.city), ctx.profile.ageBand);
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
              .insights({ type: "urn:entity:place", interests: ids, geohash: h.geohash, age: ctx.profile.ageBand, explain: true, take: 6, ...safety }, "find_local_places")
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
        ? { type: "urn:entity:place", interests: ids, point: home, radiusM, age: ctx.profile.ageBand, explain: true, take: 15, ...safety }
        : { type: "urn:entity:place", interests: ids, locationQuery: ctx.profile.city, radiusM, age: ctx.profile.ageBand, explain: true, take: 15, ...safety },
      "find_local_places",
    )
    .catch(() => [] as QEntity[]);
  const byId = new Map<string, QEntity>();
  const seenNames = new Set<string>();
  [...places, ...radiusSearch].forEach((e) => {
    const prev = byId.get(e.id);
    byId.set(e.id, prev ? { ...prev, affinity: Math.max(prev.affinity ?? 0, e.affinity ?? 0), distanceM: prev.distanceM ?? e.distanceM } : e);
  });
  // Nearest first, so a chain keeps its closest branch.
  for (const e of [...byId.values()].sort((a, b) => away(a) - away(b))) {
    if (!ageSafe(ctx, e) || isLodging(e)) continue;
    const rawDist = e.distanceM ?? (home && e.location ? distanceM(home, e.location) : undefined);
    const dist = rawDist === undefined ? undefined : Math.round(rawDist / 10) * 10;
    const nameKey = e.name.toLowerCase().replace(/\s*-.*$/, "").trim();
    if (seenNames.has(nameKey)) continue; // chains: keep the nearest branch only
    seenNames.add(nameKey);
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

export async function audienceProfile(ctx: AgentCtx, max = 8) {
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
    const shared = await ctx.qloo
      .compare(mine, loveIds(m.loves), ["urn:entity:tv_show", "urn:entity:movie", "urn:entity:artist"], "shared_with_family", ratings(ctx))
      .then((l) => l.filter((e) => ageSafe(ctx, e)))
      .catch(() => []);
    for (const e of shared.slice(0, 6)) {
      const ab = e as QEntity & { a?: number; b?: number };
      upsert(ctx, {
        entity: e,
        category: "together",
        personal: e.affinity ?? 0.5,
        partner: /grand|dadu|dadi|nana|nani|abuel/i.test(m.relation + m.name) ? "elders" : "everyone",
        reasons: [
          {
            kind: "shared",
            text: (e as QEntity & { sharedTags?: string[] }).sharedTags?.length
              ? `${ctx.profile.displayName} and ${m.name} share a taste for ${(e as QEntity & { sharedTags?: string[] }).sharedTags!.slice(0, 3).join(", ")} (Qloo compare)`
              : `Something ${ctx.profile.displayName} and ${m.name} would both enjoy${ab.a !== undefined ? ` (${ab.a.toFixed(2)} / ${ab.b?.toFixed(2)})` : ` (shared affinity ${(e.affinity ?? 0).toFixed(2)})`}`,
          },
        ],
      });
    }
    // This result goes back to the LLM: it gets the relation, never the family member's name.
    out.push(`${m.relation}: ${shared.slice(0, 4).map((e) => e.name).join(", ") || "nothing shared"}`);
  }
  return `Shared picks → ${out.join("; ")}`;
}

export async function whatsRising(ctx: AgentCtx, today = new Date()) {
  ctx.emit("Spotting what's rising right now that fits their taste…", "whats_rising");
  ctx.ran.add("whats_rising");
  const ids = loveIds(ctx.profile.loves);
  // Qloo trending doesn't support video games yet.
  const types: QlooType[] = ["urn:entity:tv_show", "urn:entity:movie", "urn:entity:artist"];
  const lists = await Promise.all(
    types.map((type) => ctx.qloo.insights({ type, interests: seedsFor(ctx, type), age: ctx.profile.ageBand, trends: "high", take: 8, contentRating: ratings(ctx) }, "whats_rising").then((l) => l.filter((e) => ageSafe(ctx, e))).catch(() => [] as QEntity[])),
  );
  // Top 3 per type (prefer picks not already on the shelf) so every type gets a chance to show it's rising.
  const pool = lists.flatMap((l) => {
    const sorted = [...l].sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0));
    return [...sorted.filter((e) => !ctx.candidates.has(e.id)), ...sorted.filter((e) => ctx.candidates.has(e.id))].slice(0, 2);
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
  // If the trend history is flat, fall back to Qloo's trend-biased ranking itself for a couple of fresh picks.
  if (!scored.length) {
    const fresh = pool.filter((e) => !ctx.candidates.has(e.id)).slice(0, 2);
    for (const e of fresh) scored.push({ e, pts: undefined, delta: undefined });
  }
  let rising = 0;
  for (const { e, pts, delta } of scored) {
    rising++;
    const prev = ctx.candidates.get(e.id);
    const reason: Reason =
      delta !== undefined
        ? { kind: "trending", text: `Rising: up ${delta.toFixed(1)} percentile points over ${pts!.length} weeks of Qloo trending data`, value: delta }
        : { kind: "trending", text: "Trending now (Qloo trend bias)" };
    if (prev?.category === "together") continue; // a family tile stays a family tile
    if (prev && rising <= 3 && (delta === undefined || delta >= 5)) {
      // A clearly rising pick earns a spot in "What's new" (freeing its favourites slot for someone else).
      ctx.candidates.set(e.id, { ...prev, category: "new", trend: pts, reasons: [...prev.reasons, reason] });
      continue;
    }
    upsert(ctx, { entity: e, category: "new", personal: e.affinity ?? 0.5, trend: pts, reasons: [reason] });
  }
  return `Rising picks: ${rising}`;
}
