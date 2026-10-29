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

export function saveBoard(board: Board) {
  safe(() => {
    localStorage.setItem(`ht:board:${board.id}`, JSON.stringify(board));
    localStorage.setItem("ht:latest", board.id);
  }, undefined);
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
