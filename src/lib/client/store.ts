"use client";
// On-device storage (NFR-06): boards, the pending profile and the tap log never leave the browser raw.

import type { Board, Profile, TapEvent } from "../board/types";

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

const MAX_TRACE = 250;

/** false when the browser refused to store it (storage full or blocked). */
export function saveBoard(board: Board): boolean {
  const slim = board.trace.length > MAX_TRACE ? { ...board, trace: board.trace.slice(-MAX_TRACE) } : board;
  return safe(() => {
    localStorage.setItem(`ht:board:${board.id}`, JSON.stringify(slim));
    localStorage.setItem("ht:latest", board.id);
    return true;
  }, false);
}

export function loadBoard(id?: string | null): Board | null {
  return safe(() => {
    const key = id ?? localStorage.getItem("ht:latest");
    if (!key) return null;
    const raw = localStorage.getItem(`ht:board:${key}`);
    return raw ? (JSON.parse(raw) as Board) : null;
  }, null);
}

export function setPendingProfile(p: Profile) {
  safe(() => sessionStorage.setItem("ht:pending", JSON.stringify(p)), undefined);
}

export function takePendingProfile(): Profile | null {
  return safe(() => {
    const raw = sessionStorage.getItem("ht:pending");
    return raw ? (JSON.parse(raw) as Profile) : null;
  }, null);
}

export function logTap(boardId: string, tileId: string) {
  safe(() => {
    const key = `ht:taps:${boardId}`;
    const list = JSON.parse(localStorage.getItem(key) ?? "[]") as TapEvent[];
    list.push({ tileId, ts: Date.now() });
    localStorage.setItem(key, JSON.stringify(list.slice(-5000)));
  }, undefined);
}

export function getTaps(boardId: string): TapEvent[] {
  return safe(() => JSON.parse(localStorage.getItem(`ht:taps:${boardId}`) ?? "[]") as TapEvent[], []);
}

export function setTaps(boardId: string, taps: TapEvent[]) {
  safe(() => localStorage.setItem(`ht:taps:${boardId}`, JSON.stringify(taps)), undefined);
}

export function tapCounts(taps: TapEvent[], sinceMs = 7 * 86400000): Record<string, number> {
  const since = Date.now() - sinceMs;
  const out: Record<string, number> = {};
  for (const t of taps) if (t.ts >= since) out[t.tileId] = (out[t.tileId] ?? 0) + 1;
  return out;
}

// ---- Child mode, settings and recent sentences ----

export interface KidSettings {
  boards: "smart" | "classic" | "both";
  labels: "primary" | "secondary" | "both";
  size: "m" | "l" | "xl";
  speakOnTap: boolean;
}

export const DEFAULT_SETTINGS: KidSettings = { boards: "both", labels: "both", size: "l", speakOnTap: true };

export function getSettings(boardId: string): KidSettings {
  return safe(() => ({ ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(`ht:settings:${boardId}`) ?? "{}") as Partial<KidSettings>) }), DEFAULT_SETTINGS);
}

export function saveSettings(boardId: string, s: KidSettings) {
  safe(() => localStorage.setItem(`ht:settings:${boardId}`, JSON.stringify(s)), undefined);
}

/** The child lock survives a page refresh: the board reopens locked. */
export function isKidLocked(): boolean {
  return safe(() => localStorage.getItem("ht:kidlock") === "1", false);
}

export const KIDLOCK_EVENT = "ht:kidlock";

export function setKidLocked(on: boolean) {
  safe(() => (on ? localStorage.setItem("ht:kidlock", "1") : localStorage.removeItem("ht:kidlock")), undefined);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(KIDLOCK_EVENT));
}

export interface SaidEntry {
  text: string;
  tileIds: string[];
  ts: number;
}

export function getSaid(boardId: string): SaidEntry[] {
  return safe(() => JSON.parse(localStorage.getItem(`ht:said:${boardId}`) ?? "[]") as SaidEntry[], []);
}

export function addSaid(boardId: string, entry: SaidEntry) {
  safe(() => {
    const list = getSaid(boardId).filter((s) => s.text !== entry.text);
    list.unshift(entry);
    localStorage.setItem(`ht:said:${boardId}`, JSON.stringify(list.slice(0, 20)));
  }, undefined);
}
