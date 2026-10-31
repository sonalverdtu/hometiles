// Live topic: what the child has been talking about in their last few utterances, so "Maybe next" can lean
// towards it (talk about Dada → the things shared with Dada; "go" → places). Computed on the device from the
// tap log, like the rest of the predictions. It only re-weights "Maybe next": core words, folders and safety
// words never move.

import { sessions } from "./smart";
import { FOLDER_META, TYPE_EMOJI } from "./vocab";
import type { Board, Localized, TapEvent, Tile } from "./types";

/** How many recent utterances make up the topic, and how much each older one still counts. */
export const TOPIC_WINDOW = 5;
const DECAY = 0.6;
/** Yesterday's chat isn't today's topic. */
const MAX_AGE_MS = 2 * 3600_000;

export interface Topic {
  /** tile id → how strongly it fits the current topic (0 to about 1.5). */
  boosts: Map<string, number>;
  /** The strongest topic, for the "Talking about" chip. */
  label?: { emoji: string; text: Localized; why: string };
}

export const NO_TOPIC: Topic = { boosts: new Map() };

interface Anchor {
  weight: number;
  related: Map<string, number>; // tile id → strength 0..1
  emoji: string;
  text: Localized;
  why: string;
}

const folderTiles = (board: Board, id: string) => board.folders.find((f) => f.id === id)?.tileIds ?? [];

/** Together tiles found for this person (older boards only name them in the reason text). */
function sharedWith(board: Board, name: string): string[] {
  const n = name.toLowerCase();
  return Object.values(board.tiles)
    .filter((t) => t.sharedWith?.some((s) => s.toLowerCase() === n) || t.reasons.some((r) => r.kind === "shared" && r.text.toLowerCase().includes(n)))
    .map((t) => t.id);
}

function anchorFor(board: Board, t: Tile): { key: string; a: Omit<Anchor, "weight"> } | null {
  const rel = (ids: string[], s = 1) => new Map(ids.map((id) => [id, s]));
  if (t.kind === "people") {
    const name = t.label.en;
    // The person, how the child feels about them, and only then the things they share.
    const social = rel(["basic-love", "basic-hello", "basic-where"].filter((id) => board.tiles[id]), 0.8);
    return { key: `person:${t.id}`, a: { related: new Map([...rel(sharedWith(board, name)), ...social, [t.id, 0.5]]), emoji: t.emoji, text: t.label, why: `talking about ${name}` } };
  }
  if (t.id === "core-go" || t.category === "places")
    return { key: "places", a: { related: rel(folderTiles(board, "places")), emoji: FOLDER_META.places.emoji, text: FOLDER_META.places.title, why: "talking about going out" } };
  if (t.id === "core-eat" || t.category === "food")
    return { key: "food", a: { related: rel(folderTiles(board, "food")), emoji: FOLDER_META.food.emoji, text: FOLDER_META.food.title, why: "talking about food" } };
  if (t.id === "core-play")
    return { key: "play", a: { related: new Map([...rel(folderTiles(board, "favourites"), 0.6), ...rel(folderTiles(board, "fun"), 0.8)]), emoji: "🎲", text: t.label, why: "talking about playing" } };
  if (t.kind === "rotating" && t.entity) {
    // A favourite: the jokes about that same thing first, then other things of the same kind.
    const same = Object.values(board.tiles).filter((x) => x.id !== t.id && x.kind === "rotating" && x.entity);
    const related = new Map<string, number>();
    for (const x of same) {
      if (x.entity!.qlooId && x.entity!.qlooId === t.entity.qlooId) related.set(x.id, 1);
      else if (x.entity!.type === t.entity.type && x.category !== "food" && x.category !== "places") related.set(x.id, 0.6);
    }
    return { key: `entity:${t.entity.qlooId ?? t.id}`, a: { related, emoji: TYPE_EMOJI[t.entity.type] ?? t.emoji, text: t.label, why: `talking about ${t.label.en}` } };
  }
  return null;
}

/** The topic of the last few utterances (taps less than 45 s apart), newest counting most. */
export function topicOf(board: Board, taps: TapEvent[], now = Date.now()): Topic {
  const recent = taps.filter((t) => now - t.ts <= MAX_AGE_MS);
  const utterances = sessions(recent).slice(-TOPIC_WINDOW);
  const anchors = new Map<string, Anchor & { seen: number }>();
  let seen = 0;
  utterances.forEach((ids, i) => {
    const w = DECAY ** (utterances.length - 1 - i);
    const counted = new Set<string>(); // "go" + a place in one utterance is one mention of going out
    for (const id of ids) {
      const t = board.tiles[id];
      const found = t && anchorFor(board, t);
      if (!found) continue;
      seen++;
      const prev = anchors.get(found.key);
      const add = counted.has(found.key) ? 0 : w;
      counted.add(found.key);
      anchors.set(found.key, prev ? { ...prev, weight: prev.weight + add, seen } : { ...found.a, weight: w, seen });
    }
  });
  const boosts = new Map<string, number>();
  for (const a of anchors.values())
    for (const [id, s] of a.related) boosts.set(id, Math.min(1.5, (boosts.get(id) ?? 0) + a.weight * s));
  // Strongest topic; on a tie, the one mentioned last.
  const top = [...anchors.values()].sort((x, y) => y.weight - x.weight || y.seen - x.seen)[0];
  // A single passing mention two utterances ago isn't a topic yet.
  return { boosts, label: top && top.weight >= 0.6 && top.related.size ? { emoji: top.emoji, text: top.text, why: top.why } : undefined };
}
