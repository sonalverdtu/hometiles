// Smart board predictions, computed on the device from the tap log (nothing leaves the browser).
// Signals: what usually comes next after the last word (learned word pairs), what this child uses at
// this time of day, what they use most this week, the topic of their last few utterances (topic.ts),
// and simple word→category hints for a cold start.

import type { Topic } from "./topic";
import type { Board, Category, TapEvent, Tile } from "./types";

export interface Prediction {
  tile: Tile;
  score: number;
  why: string;
}

const SESSION_GAP_MS = 45_000;

/** Splits the tap log into "utterances": taps less than 45 s apart belong together. */
export function sessions(taps: TapEvent[]): string[][] {
  const out: string[][] = [];
  let cur: string[] = [];
  let last = 0;
  for (const t of [...taps].sort((a, b) => a.ts - b.ts)) {
    if (cur.length && t.ts - last > SESSION_GAP_MS) {
      out.push(cur);
      cur = [];
    }
    cur.push(t.tileId);
    last = t.ts;
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Counts of "after tile A, the child tapped tile B". */
export function transitions(taps: TapEvent[]): Map<string, Map<string, number>> {
  const m = new Map<string, Map<string, number>>();
  for (const s of sessions(taps)) {
    for (let i = 1; i < s.length; i++) {
      const row = m.get(s[i - 1]) ?? new Map<string, number>();
      row.set(s[i], (row.get(s[i]) ?? 0) + 1);
      m.set(s[i - 1], row);
    }
  }
  return m;
}

// Cold-start hints: after a core word, which folders usually follow.
const AFTER_CORE: Record<string, Category[]> = {
  "core-want": ["food", "favourites", "places", "things"],
  "core-eat": ["food"],
  "core-go": ["places"],
  "core-play": ["favourites", "things"],
  "core-like": ["favourites", "food", "together"],
  "core-more": ["food", "favourites"],
  "core-i": ["feelings", "food", "places"],
  "basic-drink": ["food"],
  "basic-watch": ["favourites"],
  "basic-listen": ["together", "favourites"],
};

// What a child usually needs to say next, beyond wanting something. These words are the point of an AAC board,
// so they outrank any taste match: after "it hurts", where and who (not snacks); after "no", what they don't want.
const FOLLOW_UPS: Record<string, string[]> = {
  "safety-pain": ["basic-tummy", "basic-head", "basic-mouth", "basic-ear", "basic-leg", "basic-hand", "basic-doctor", "basic-sad"],
  "safety-unwell": ["basic-tummy", "basic-head", "basic-doctor", "basic-sad", "basic-home"],
  "safety-scared": ["basic-sad", "basic-where", "basic-home", "basic-calm"],
  "safety-tired": ["basic-home", "basic-calm", "basic-bored"],
  "safety-help": ["basic-where", "basic-what", "basic-dontknow"],
  "core-no": ["basic-dontlike", "basic-turnoff", "basic-angry", "basic-bored"],
  "core-stop": ["basic-turnoff", "basic-dontlike", "basic-angry", "basic-home"],
  "core-i": ["basic-happy", "basic-sad", "basic-dontknow"],
  "basic-sad": ["basic-dontknow", "basic-home"],
};
// Someone on the board: greet them, say how you feel about them.
const PERSON_FOLLOW_UPS = ["basic-love", "basic-hello", "basic-bye", "basic-where"];

// The smart row's balance, checked at every position: communication words (feelings, needs, questions, people)
// get at least a quarter of it, and things to watch, play or listen to at most a third.
const COMMUNICATION = new Set<Category>(["feelings", "chat", "body", "people", "safety"]);
const ENTERTAINMENT = new Set<Category>(["favourites", "fun", "together", "new", "things"]);
const minCommunication = (n: number) => Math.floor(n / 4);
const maxEntertainment = (n: number) => Math.ceil(n / 3);

// Action words that usually go with what was just tapped: a snack → eat/drink, a show → watch, a place → go.
const DEFAULT_ACTIONS = ["core-eat", "basic-drink", "core-play", "basic-watch", "basic-sleep", "basic-listen", "basic-look", "basic-wash"];
function actionsFor(t: Tile | undefined): string[] {
  if (!t) return [];
  const type = t.entity?.type ?? "";
  if (t.category === "food") return ["core-eat", "basic-drink", "basic-give", "basic-open"];
  if (t.category === "places") return ["core-go", "basic-come", "basic-wait", "basic-run"];
  if (t.category === "things") return ["core-play", "basic-give", "basic-open", "basic-look"];
  if (t.category === "people") return ["basic-hug", "basic-come", "core-play", "basic-look"];
  if (/artist|podcast/.test(type)) return ["basic-listen", "basic-sing", "basic-dance"];
  if (/videogame/.test(type)) return ["core-play", "basic-watch"];
  if (/tv_show|movie|book/.test(type)) return ["basic-watch", "basic-read", "core-play"];
  if (t.category === "feelings" || t.category === "body" || t.kind === "safety") return ["basic-hug", "basic-sit", "basic-sleep", "basic-wait"];
  return [];
}

/** The "Action words" row on the smart board: verbs that fit the last tap first, then the everyday ones. */
export function nextActions(board: Board, lastTileId: string | null, take = 6, skip: readonly string[] = []): Tile[] {
  const ids = [...actionsFor(lastTileId ? board.tiles[lastTileId] : undefined), ...DEFAULT_ACTIONS];
  return [...new Set(ids)]
    .filter((id) => id !== lastTileId && !skip.includes(id))
    .map((id) => board.tiles[id])
    .filter((t): t is Tile => !!t)
    .slice(0, take);
}

function timeOfDayCategories(hour: number): { cats: Category[]; label: string } {
  if (hour >= 6 && hour < 10) return { cats: ["food", "people", "chat"], label: "morning" };
  if (hour >= 10 && hour < 16) return { cats: ["places", "chat", "favourites"], label: "daytime" };
  if (hour >= 16 && hour < 21) return { cats: ["food", "feelings", "together", "places"], label: "evening" };
  return { cats: ["people", "feelings", "body"], label: "night" };
}

const sameHourBand = (a: number, b: number) => Math.abs(a - b) <= 1 || Math.abs(a - b) >= 23;

export function predict(board: Board, lastTileId: string | null, taps: TapEvent[], now = new Date(), take = 12, topic?: Topic): Prediction[] {
  // "help" already sits next to the core words, and verbs have their own row, so neither needs predicting.
  // "What's new" (trending picks) stays in its folder: a new show is never what a child most needs to say next.
  const pool = Object.values(board.tiles).filter((t) => t.kind !== "core" && t.id !== "safety-help" && t.category !== "actions" && t.category !== "new");
  // Within a folder, earlier words are the more common ones (happy before angry, tummy before teeth).
  const folderPos = new Map(board.folders.flatMap((f) => f.tileIds.map((id, i) => [id, i] as const)));
  const last = lastTileId ? board.tiles[lastTileId] : undefined;
  const follow = [...(lastTileId ? (FOLLOW_UPS[lastTileId] ?? []) : []), ...(last?.kind === "people" ? PERSON_FOLLOW_UPS : [])];
  const next = lastTileId ? transitions(taps).get(lastTileId) : undefined;
  const nextTotal = next ? [...next.values()].reduce((s, n) => s + n, 0) : 0;
  const weekAgo = now.getTime() - 7 * 86400000;
  const hour = now.getHours();
  const freq = new Map<string, number>();
  const atHour = new Map<string, number>();
  for (const t of taps) {
    if (t.ts < weekAgo) continue;
    freq.set(t.tileId, (freq.get(t.tileId) ?? 0) + 1);
    if (sameHourBand(new Date(t.ts).getHours(), hour)) atHour.set(t.tileId, (atHour.get(t.tileId) ?? 0) + 1);
  }
  const maxFreq = Math.max(1, ...freq.values());
  const maxHour = Math.max(1, ...atHour.values());
  const hint = lastTileId ? AFTER_CORE[lastTileId] : undefined;
  const tod = timeOfDayCategories(hour);
  const lastName = lastTileId ? board.tiles[lastTileId]?.label.en : undefined;

  const scored = pool.map((tile) => {
    const parts: { v: number; why: string }[] = [];
    const n = next?.get(tile.id) ?? 0;
    if (n > 0) parts.push({ v: 3 * (n / nextTotal) + 1, why: `often comes after "${lastName}"` });
    if (hint?.includes(tile.category)) parts.push({ v: 1.2 - hint.indexOf(tile.category) * 0.2, why: `fits after "${lastName}"` });
    const h = atHour.get(tile.id) ?? 0;
    if (h > 0) parts.push({ v: 1.5 * (h / maxHour), why: `used a lot around this time` });
    else if (tod.cats.includes(tile.category)) parts.push({ v: 0.35, why: `good for the ${tod.label}` });
    const f = freq.get(tile.id) ?? 0;
    if (f > 0) parts.push({ v: 1.0 * (f / maxFreq), why: `a favourite this week` });
    const b = topic?.boosts.get(tile.id) ?? 0;
    if (b > 0) parts.push({ v: 1.4 * b, why: topic?.label?.why ?? "fits what they're talking about" });
    const fi = follow.indexOf(tile.id);
    if (fi >= 0) parts.push({ v: 3 - fi * 0.15, why: `what usually comes after "${lastName}"` });
    // Prior: the child's own taste matters on a cold start, but feelings, people and questions stay in reach too.
    const prior =
      tile.kind === "rotating" ? (tile.score ?? 0.5) * 0.8
      : tile.kind === "people" ? 0.4
      : tile.kind === "basic" && COMMUNICATION.has(tile.category) ? 0.35 - (folderPos.get(tile.id) ?? 0) * 0.004
      : tile.kind === "basic" ? 0.15 - (folderPos.get(tile.id) ?? 0) * 0.004
      : 0.05;
    parts.push({ v: prior, why: tile.kind === "rotating" ? "matches their taste" : "always handy" });
    if (tile.id === lastTileId) parts.push({ v: -5, why: "" });
    const score = parts.reduce((s, p) => s + p.v, 0);
    const why = [...parts].sort((a, b) => b.v - a.v)[0]?.why ?? "";
    return { tile, score: Math.round(score * 1000) / 1000, why };
  });
  // Greedy pick with a small penalty per repeat category, so one screen mixes food, shows, places and people.
  const remaining = scored.sort((a, b) => b.score - a.score || a.tile.id.localeCompare(b.tile.id));
  const picked: Prediction[] = [];
  const perCat = new Map<string, number>();
  let comm = 0;
  let ent = 0;
  while (picked.length < take && remaining.length) {
    // Balance holds for every prefix of the row, so any number of shown tiles keeps the same mix.
    const n = picked.length + 1;
    const needComm = comm < minCommunication(n) && remaining.some((p) => COMMUNICATION.has(p.tile.category));
    const entFull = ent >= maxEntertainment(n);
    let best = -1;
    let bestVal = -Infinity;
    remaining.forEach((p, i) => {
      const c = p.tile.category;
      if (needComm && !COMMUNICATION.has(c)) return;
      if (entFull && ENTERTAINMENT.has(c)) return;
      const v = p.score - 0.35 * (perCat.get(c) ?? 0);
      if (v > bestVal) {
        bestVal = v;
        best = i;
      }
    });
    if (best < 0) break;
    const [p] = remaining.splice(best, 1);
    picked.push(p);
    perCat.set(p.tile.category, (perCat.get(p.tile.category) ?? 0) + 1);
    if (COMMUNICATION.has(p.tile.category)) comm++;
    if (ENTERTAINMENT.has(p.tile.category)) ent++;
  }
  return picked;
}

/**
 * Keeps the "Maybe next" row steady so the child can find things again: a tile keeps its slot while it is
 * still among the top `take` predictions, and at most `maxChanges` slots change per update (the best
 * newcomers take the places of tiles that dropped out).
 */
export function stabilize(prevIds: readonly string[], ranked: Prediction[], take: number, maxChanges = 3): Prediction[] {
  const top = ranked.slice(0, take);
  if (!prevIds.length) return top;
  const byId = new Map(ranked.map((p, i) => [p.tile.id, { p, rank: i }]));
  const slots: (Prediction | null)[] = prevIds.slice(0, take).map((id) => byId.get(id)?.p ?? null);
  while (slots.length < take) slots.push(null);
  const shown = new Set(slots.filter(Boolean).map((p) => p!.tile.id));
  const newcomers = top.filter((p) => !shown.has(p.tile.id));
  // Empty slots fill freely; tiles that left the top are swapped out worst-first, up to maxChanges.
  const open = slots.map((p, i) => ({ i, rank: p ? byId.get(p.tile.id)!.rank : Infinity, empty: !p }));
  const stale = open.filter((o) => o.empty || o.rank >= take).sort((a, b) => Number(b.empty) - Number(a.empty) || b.rank - a.rank);
  let changes = 0;
  for (const o of stale) {
    const next = newcomers.shift();
    if (!next) break;
    if (!o.empty && changes >= maxChanges) break;
    if (!o.empty) changes++;
    slots[o.i] = next;
  }
  return slots.filter((p): p is Prediction => !!p);
}
