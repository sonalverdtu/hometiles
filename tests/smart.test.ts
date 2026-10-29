import { describe, expect, it } from "vitest";
import { assembleBoard, type Candidate } from "../src/lib/board/engine";
import { predict, sessions } from "../src/lib/board/smart";
import type { Profile, TapEvent } from "../src/lib/board/types";

const profile: Profile = {
  id: "p", displayName: "T", ageBand: "24_and_younger", isChild: true, city: "C",
  primaryLang: "en", loves: [{ name: "X", type: "urn:entity:tv_show", qlooId: "x" }], family: [],
};
const cand = (id: string, category: Candidate["category"], personal: number): Candidate => ({
  entity: { id, name: id, type: "urn:entity:tv_show", affinity: personal, tags: [] }, category, personal, reasons: [],
});
const board = assembleBoard({
  id: "b", profile, mode: { qloo: "mock", llm: "mock", agent: "scripted" }, trace: [],
  candidates: [cand("show1", "favourites", 0.9), cand("show2", "favourites", 0.85), cand("snack1", "food", 0.6), cand("snack2", "food", 0.55), cand("park", "places", 0.5)],
});

describe("smart board predictions", () => {
  it("groups taps into utterances by time gap", () => {
    const t: TapEvent[] = [{ tileId: "a", ts: 0 }, { tileId: "b", ts: 1000 }, { tileId: "c", ts: 120_000 }];
    expect(sessions(t)).toEqual([["a", "b"], ["c"]]);
  });

  it("learns what usually follows a word", () => {
    const taps: TapEvent[] = [];
    for (let i = 0; i < 5; i++) taps.push({ tileId: "core-want", ts: i * 600_000 }, { tileId: "t-snack2", ts: i * 600_000 + 2000 });
    const p = predict(board, "core-want", taps, new Date(5 * 600_000), 6);
    expect(p[0].tile.id).toBe("t-snack2");
    expect(p[0].why).toContain("often comes after");
  });

  it("mixes categories and never predicts core words or the fixed help tile", () => {
    const p = predict(board, null, [], new Date(2026, 9, 30, 12), 6);
    expect(new Set(p.map((x) => x.tile.category)).size).toBeGreaterThan(2);
    expect(p.every((x) => x.tile.kind !== "core" && x.tile.id !== "safety-help")).toBe(true);
  });
});
