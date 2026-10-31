// Board engine: scoring, layout with category quotas, safety rules, refresh planning.
// Pure functions (no I/O) so they are unit-testable and shared by server and client.

import type { QEntity } from "../qloo/types";
import type { TraceEntry } from "../qloo/trace";
import { LANG_CODES, type LocalNames } from "../i18n";
import type { Board, Category, Folder, Lang, Localized, Partner, Profile, Reason, Suggestion, Tile } from "./types";
import { BANTER, CORE, FOLDER_META, newPhrase, PHRASES, REACTIONS, SAFETY, TYPE_EMOJI, togetherPhrase } from "./vocab";

export const QUOTAS: Record<"food" | "places" | "favourites" | "together" | "new", number> = {
  favourites: 10,
  food: 8,
  places: 6,
  together: 4,
  new: 3,
};

export const FOLDER_ORDER: Category[] = ["favourites", "food", "places", "fun", "together", "new", "people", "safety"];

export interface Candidate {
  entity: QEntity;
  category: keyof typeof QUOTAS;
  personal: number;
  local?: number;
  ageFit?: number;
  partner?: Partner;
  /** Family members this was found to share with (shared_with_family), so a talk about them can surface it. */
  sharedWith?: string[];
  /** Something the family typed in themselves: always on the board, first in its folder, and locked. */
  own?: boolean;
  trend?: number[];
  reasons: Reason[];
}

export interface TileText {
  label?: Localized;
  speak?: Localized;
}

const LANGS: Lang[] = LANG_CODES;

export function scoreCandidate(c: Candidate): number {
  const local = c.local ?? 0.5;
  const age = c.ageFit === undefined ? 0.5 : (c.ageFit + 1) / 2;
  const pop = c.entity.popularity ?? 0.5;
  const s = 0.55 * c.personal + 0.25 * local + 0.15 * age + 0.05 * pop;
  return Math.round(s * 1000) / 1000;
}

/** Highest score first; deterministic tie-break on id. Dedupes entities (first category wins). */
export function rankCandidates(cands: Candidate[]): Candidate[] {
  const best = new Map<string, Candidate>();
  for (const c of cands) {
    const prev = best.get(c.entity.id);
    if (!prev || scoreCandidate(c) > scoreCandidate(prev)) best.set(c.entity.id, prev ? { ...c, reasons: mergeReasons(prev.reasons, c.reasons) } : c);
  }
  return [...best.values()].sort((a, b) => scoreCandidate(b) - scoreCandidate(a) || a.entity.id.localeCompare(b.entity.id));
}

function mergeReasons(a: Reason[], b: Reason[]): Reason[] {
  const seen = new Set<string>();
  return [...a, ...b].filter((r) => (seen.has(r.text) ? false : (seen.add(r.text), true)));
}

export function displayName(e: { name: string; nameLocal?: LocalNames }, lang: Lang): string {
  if (lang === "en") return e.name;
  return e.nameLocal?.[lang] ?? e.name;
}

function localized(fn: (lang: Lang) => string): Localized {
  const out = { en: fn("en") } as Localized;
  for (const l of LANGS) out[l] = fn(l);
  return out;
}

export function candidateToTile(c: Candidate, text?: TileText): Tile {
  const tpl = c.category === "together" ? togetherPhrase(c.entity.type) : c.category === "new" ? newPhrase(c.entity.type) : PHRASES[c.category];
  return {
    id: `t-${c.entity.id}`,
    kind: "rotating",
    category: c.category,
    label: text?.label ?? localized((l) => displayName(c.entity, l)),
    speak: text?.speak ?? localized((l) => tpl[l](displayName(c.entity, l))),
    emoji: TYPE_EMOJI[c.entity.type] ?? "⭐",
    image: c.entity.image ? { url: c.entity.image, source: "qloo" } : undefined,
    entity: {
      // A favourite Qloo didn't recognise has a local id, which must never be sent to Qloo as a seed.
      qlooId: c.entity.id.startsWith("own-") ? undefined : c.entity.id,
      name: c.entity.name,
      type: c.entity.type,
      image: c.entity.image,
      nameLocal: c.entity.nameLocal,
      affinity: c.entity.affinity,
      distanceM: c.entity.distanceM,
    },
    locked: !!c.own,
    partner: c.partner,
    sharedWith: c.sharedWith,
    reasons: c.reasons,
    score: scoreCandidate(c),
    trend: c.trend,
  };
}

function personEmoji(s: string): string {
  if (/grandmother|dadi|nani|abuela|granny/i.test(s)) return "👵";
  if (/grandfather|dadu|nana|abuelo|grandpa/i.test(s)) return "👴";
  if (/mother|mom|maa|mam|sister|aunt|didi|hermana|t[ií]a/i.test(s)) return "👩";
  if (/father|dad|papa|pap[aá]|brother|uncle|bhai|hermano|t[ií]o/i.test(s)) return "👨";
  return "🧑";
}

function fixedTiles(profile: Profile): Tile[] {
  const core: Tile[] = CORE.map((w) => ({
    id: `core-${w.key}`,
    kind: "core",
    category: "core",
    label: w.label,
    speak: w.speak ?? w.label,
    emoji: w.emoji,
    locked: true,
    reasons: [{ kind: "core", text: "Core word: always in the same place" }],
  }));
  const safety: Tile[] = SAFETY.map((w) => ({
    id: `safety-${w.key}`,
    kind: "safety",
    category: "safety",
    label: w.label,
    speak: w.speak ?? w.label,
    emoji: w.emoji,
    locked: true,
    reasons: [{ kind: "safety", text: "Safety word: never removed automatically" }],
  }));
  // A family's own names are used as typed, in every language; the defaults are the word for Mum/Dad in each one.
  const family: { name: Localized; relation: string }[] = profile.family.length
    ? profile.family.map((f) => ({ name: localized(() => f.name), relation: f.relation }))
    : [
        { name: { en: "Mom", hi: "मम्मी", es: "Mamá" }, relation: "mother" },
        { name: { en: "Dad", hi: "पापा", es: "Papá" }, relation: "father" },
      ];
  const people: Tile[] = family.map((f, i) => ({
    id: `people-${i}`,
    kind: "people",
    category: "people",
    label: f.name,
    speak: localized((l) => PHRASES.people[l](f.name[l] ?? f.name.en)),
    emoji: personEmoji(`${f.relation} ${f.name.en}`),
    locked: true,
    reasons: [{ kind: "people", text: `${f.relation}: added by the family` }],
  }));
  return [...core, ...safety, ...people];
}

function funTiles(favs: Tile[]): Tile[] {
  const tiles: Tile[] = [];
  favs.slice(0, 3).forEach((f, i) => {
    const tpl = BANTER[i % BANTER.length];
    const nameOf = (l: Lang) => f.label[l] ?? f.label.en;
    tiles.push({
      id: `fun-${f.id}`,
      kind: "rotating",
      category: "fun",
      label: localized((l) => tpl[l](nameOf(l))),
      speak: localized((l) => tpl[l](nameOf(l))),
      emoji: "😂",
      locked: false,
      reasons: [{ kind: "personal", text: `Banter about a favourite (${f.label.en}), because humour helps people be seen as people` }],
      entity: f.entity,
    });
  });
  REACTIONS.forEach((r, i) =>
    tiles.push({
      id: `fun-react-${i}`,
      kind: "rotating",
      category: "fun",
      label: r.label,
      speak: r.label,
      emoji: r.emoji,
      locked: false,
      reasons: [{ kind: "core", text: "Quick reaction for conversation timing" }],
    }),
  );
  return tiles;
}

export interface AssembleInput {
  id: string;
  profile: Profile;
  candidates: Candidate[];
  text?: Record<string, TileText>;
  mode: Board["mode"];
  trace: TraceEntry[];
  heat?: Board["heat"];
  notes?: string[];
}

export function assembleBoard(input: AssembleInput): Board {
  // The family's own favourites go first, so they always get a slot: a child who loves Bluey can say "Bluey".
  const ranked = rankCandidates(input.candidates).sort((a, b) => Number(!!b.own) - Number(!!a.own));
  const tiles: Record<string, Tile> = {};
  const folders: Record<Category, string[]> = {
    core: [], safety: [], people: [], food: [], places: [], favourites: [], fun: [], together: [], new: [],
  };

  for (const t of fixedTiles(input.profile)) {
    tiles[t.id] = t;
    folders[t.category].push(t.id);
  }
  const counts: Record<string, number> = {};
  for (const c of ranked) {
    const n = counts[c.category] ?? 0;
    if (n >= QUOTAS[c.category]) continue;
    // Keep favourites varied: at most 4 of any one kind (shows, games, music, films).
    const typeKey = `${c.category}|${c.entity.type}`;
    if (c.category === "favourites" && !c.own && (counts[typeKey] ?? 0) >= 4) continue;
    counts[typeKey] = (counts[typeKey] ?? 0) + 1;
    const tile = candidateToTile(c, input.text?.[c.entity.id]);
    tiles[tile.id] = tile;
    folders[c.category].push(tile.id);
    counts[c.category] = n + 1;
  }
  // Second pass: if the per-kind cap left favourites slots empty, fill them with the best remaining picks.
  for (const c of ranked) {
    if (c.category !== "favourites" || folders.favourites.length >= QUOTAS.favourites || tiles[`t-${c.entity.id}`]) continue;
    const tile = candidateToTile(c, input.text?.[c.entity.id]);
    tiles[tile.id] = tile;
    folders.favourites.push(tile.id);
  }
  const favs = folders.favourites.map((id) => tiles[id]);
  for (const t of funTiles(favs)) {
    tiles[t.id] = t;
    folders.fun.push(t.id);
  }

  const folderList: Folder[] = FOLDER_ORDER.filter((c) => folders[c].length > 0).map((c) => ({
    id: c,
    title: FOLDER_META[c].title,
    emoji: FOLDER_META[c].emoji,
    tileIds: folders[c],
  }));

  return {
    id: input.id,
    version: 1,
    createdAt: new Date().toISOString(),
    profile: input.profile,
    mode: input.mode,
    tiles,
    folders: folderList,
    coreIds: folders.core,
    trace: input.trace,
    heat: input.heat,
    notes: input.notes ?? [],
  };
}

// ---------------- Refresh (FR-4xx) ----------------

export function isProtected(t: Tile): boolean {
  return t.locked || t.kind === "core" || t.kind === "safety" || t.kind === "people";
}

/**
 * Plans weekly changes. Rules (FR-404): never touch protected tiles (core, safety, people, locked).
 * An unused tile in a prominent spot (first 4 of its folder) or one already moved once is replaced;
 * an unused tile buried further back is moved to the front first (maybe it was just hard to find).
 * Caps keep the review short: ≤2 replaces, ≤2 moves, the rest are new additions.
 */
export function planRefresh(board: Board, counts: Record<string, number>, fresh: Candidate[], max = 6): Suggestion[] {
  const onBoard = new Set(Object.values(board.tiles).map((t) => t.entity?.qlooId).filter(Boolean));
  const pool = rankCandidates(fresh).filter((c) => !onBoard.has(c.entity.id));
  const used = new Set<string>();
  const replaces: Suggestion[] = [];
  const moves: Suggestion[] = [];

  for (const folder of board.folders) {
    if (!(folder.id in QUOTAS)) continue;
    folder.tileIds.forEach((id, idx) => {
      const t = board.tiles[id];
      if (!t || isProtected(t) || (counts[id] ?? 0) > 0) return;
      if (t.moved || idx < 4) {
        if (replaces.length >= 2) return;
        const next = pool.find((c) => c.category === folder.id && !used.has(c.entity.id));
        if (!next) return;
        used.add(next.entity.id);
        replaces.push({
          id: `s-rep-${id}`,
          action: "replace",
          folder: folder.id,
          targetTileId: id,
          tile: candidateToTile(next),
          reason: `"${t.label.en}" wasn't tapped this week${t.moved ? " even after moving" : ""}. Suggesting "${next.entity.name}": ${next.reasons[0]?.text ?? "Qloo affinity"}.`,
        });
      } else if (moves.length < 2) {
        moves.push({ id: `s-move-${id}`, action: "move", folder: folder.id, targetTileId: id, reason: `"${t.label.en}" wasn't tapped and sits at the back. Moving it to the front once before replacing it.` });
      }
    });
  }
  const adds: Suggestion[] = [];
  for (const c of pool) {
    if (replaces.length + moves.length + adds.length >= max) break;
    if (used.has(c.entity.id)) continue;
    used.add(c.entity.id);
    adds.push({ id: `s-add-${c.entity.id}`, action: "add", folder: c.category, tile: candidateToTile(c), reason: c.reasons[0]?.text ?? "New Qloo match" });
  }
  return [...replaces, ...adds, ...moves];
}

export function applySuggestions(board: Board, accepted: Suggestion[]): Board {
  const tiles = { ...board.tiles };
  const folders = board.folders.map((f) => ({ ...f, tileIds: [...f.tileIds] }));
  const folderOf = (c: Category) => {
    let f = folders.find((x) => x.id === c);
    if (!f) {
      f = { id: c, title: FOLDER_META[c].title, emoji: FOLDER_META[c].emoji, tileIds: [] };
      folders.push(f);
    }
    return f;
  };
  for (const s of accepted) {
    const target = s.targetTileId ? tiles[s.targetTileId] : undefined;
    if (target && isProtected(target)) continue; // safety net (FR-404)
    const f = folderOf(s.folder);
    if (s.action === "move" && target) {
      f.tileIds = [target.id, ...f.tileIds.filter((id) => id !== target.id)];
      tiles[target.id] = { ...target, moved: true };
    } else if (s.action === "replace" && target && s.tile) {
      const idx = f.tileIds.indexOf(target.id);
      delete tiles[target.id];
      tiles[s.tile.id] = { ...s.tile, reasons: [...s.tile.reasons, { kind: "usage", text: "Added in weekly refresh" }] };
      if (idx >= 0) f.tileIds[idx] = s.tile.id;
      else f.tileIds.push(s.tile.id);
    } else if (s.action === "add" && s.tile && !tiles[s.tile.id]) {
      tiles[s.tile.id] = { ...s.tile, reasons: [...s.tile.reasons, { kind: "usage", text: "Added in weekly refresh" }] };
      f.tileIds.push(s.tile.id);
    }
  }
  return { ...board, version: board.version + 1, tiles, folders };
}
