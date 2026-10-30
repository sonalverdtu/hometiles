// Shared board types (client + server). Keep free of server-only imports.

import type { AgeBand, QlooType } from "../qloo/types";
import type { TraceEntry } from "../qloo/trace";

import type { Lang, LocalNames } from "../i18n";
import type { AgeGroup } from "./age";
import type { Temperament } from "./temperament";
export type { Lang };
export type Localized = Partial<Record<Lang, string>> & { en: string };

export type Category = "core" | "safety" | "people" | "food" | "places" | "favourites" | "fun" | "together" | "new";
export type TileKind = "core" | "safety" | "people" | "rotating";
export type Partner = "friends" | "elders" | "everyone";

export interface EntityRef {
  qlooId?: string;
  name: string;
  type: QlooType;
  image?: string;
  nameLocal?: LocalNames;
}

export interface FamilyMember {
  name: string;
  relation: string;
  loves: EntityRef[];
}

export interface Profile {
  id: string;
  displayName: string;
  ageBand: AgeBand;
  /** true for any child under 13 (kept for older boards); ageGroup is the finer version. */
  isChild: boolean;
  ageGroup?: AgeGroup;
  /** What the child is like (up to 2), turned into Qloo descriptor tags for shows and films. */
  temperament?: Temperament[];
  city: string;
  home?: { lat: number; lon: number };
  primaryLang: Lang;
  secondaryLang?: Lang;
  loves: EntityRef[];
  family: FamilyMember[];
}

export interface Reason {
  kind: "personal" | "temperament" | "local" | "age" | "shared" | "trending" | "audience" | "core" | "safety" | "people" | "usage";
  text: string;
  value?: number;
  callId?: string;
}

export interface Tile {
  id: string;
  kind: TileKind;
  category: Category;
  label: Localized;
  speak: Localized;
  emoji: string;
  image?: { url: string; source: "arasaac" | "qloo" };
  entity?: EntityRef & { affinity?: number; distanceM?: number };
  locked: boolean;
  partner?: Partner;
  reasons: Reason[];
  score?: number;
  moved?: boolean;
  trend?: number[];
}

export interface Folder {
  id: Category;
  title: Localized;
  emoji: string;
  tileIds: string[];
}

export interface Board {
  id: string;
  version: number;
  createdAt: string;
  profile: Profile;
  mode: { qloo: "live" | "mock"; llm: "live" | "mock"; agent: "llm" | "scripted" };
  tiles: Record<string, Tile>;
  folders: Folder[];
  coreIds: string[];
  trace: TraceEntry[];
  heat?: { lat: number; lon: number; affinity: number }[];
  notes: string[];
}

export interface TapEvent {
  tileId: string;
  ts: number;
}

export interface Suggestion {
  id: string;
  action: "add" | "replace" | "move";
  folder: Category;
  tile?: Tile;
  targetTileId?: string;
  reason: string;
}

export type StreamEvent =
  | { type: "step"; text: string; tool?: string }
  | { type: "trace"; entry: TraceEntry }
  | { type: "board"; board: Board }
  | { type: "error"; message: string };
