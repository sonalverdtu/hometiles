import { describe, expect, it } from "vitest";
import { applySuggestions, assembleBoard, isProtected, planRefresh, QUOTAS, rankCandidates, type Candidate } from "../src/lib/board/engine";
import { toObf } from "../src/lib/board/obf";
import type { Profile } from "../src/lib/board/types";
import type { QEntity } from "../src/lib/qloo/types";

const profile: Profile = {
  id: "p",
  displayName: "Test",
  ageBand: "24_and_younger",
  isChild: true,
  city: "Test City",
  primaryLang: "hi",
  secondaryLang: "en",
  loves: [{ name: "X", type: "urn:entity:tv_show", qlooId: "x" }],
  family: [],
};

const ent = (id: string, affinity = 0.5, type: QEntity["type"] = "urn:entity:tv_show"): QEntity => ({ id, name: id.toUpperCase(), type, affinity, tags: [] });
const cand = (id: string, category: Candidate["category"], personal: number): Candidate => ({ entity: ent(id, personal), category, personal, reasons: [{ kind: "personal", text: `r-${id}` }] });

function makeBoard(n = 14) {
  const cands = Array.from({ length: n }, (_, i) => cand(`fav${i}`, "favourites", 0.9 - i * 0.03));
  cands.push(cand("food1", "food", 0.7), cand("place1", "places", 0.6));
  return assembleBoard({ id: "b1", profile, candidates: cands, mode: { qloo: "mock", llm: "mock", agent: "scripted" }, trace: [] });
}

describe("ranking", () => {
  it("is deterministic and dedupes by entity", () => {
    const a = [cand("a", "favourites", 0.5), cand("b", "favourites", 0.5), cand("a", "food", 0.9)];
    const r1 = rankCandidates(a).map((c) => c.entity.id);
    const r2 = rankCandidates([...a].reverse()).map((c) => c.entity.id);
    expect(r1).toEqual(r2);
    expect(r1.filter((x) => x === "a")).toHaveLength(1);
  });
});

describe("assembleBoard", () => {
  it("respects category quotas and keeps core/safety/people locked", () => {
    const b = makeBoard(20);
    const favs = b.folders.find((f) => f.id === "favourites")!;
    expect(favs.tileIds.length).toBeLessThanOrEqual(QUOTAS.favourites);
    expect(b.coreIds.length).toBeGreaterThan(5);
    for (const t of Object.values(b.tiles)) if (t.kind !== "rotating") expect(t.locked).toBe(true);
    expect(b.folders.find((f) => f.id === "safety")?.tileIds.length).toBeGreaterThan(0);
    expect(b.folders.find((f) => f.id === "people")?.tileIds.length).toBe(2); // default Mom + Dad
  });

  it("gives every tile both language labels", () => {
    const b = makeBoard();
    for (const t of Object.values(b.tiles)) {
      expect(t.label.en).toBeTruthy();
      expect(t.label.hi).toBeTruthy();
      expect(t.speak.hi).toBeTruthy();
    }
  });
});

describe("refresh safety rules (FR-404)", () => {
  it("never suggests changes to protected tiles and caps suggestions", () => {
    const b = makeBoard(10);
    const fresh = [cand("new1", "favourites", 0.95), cand("new2", "favourites", 0.94), cand("new3", "food", 0.9)];
    const s = planRefresh(b, {}, fresh, 6);
    expect(s.length).toBeLessThanOrEqual(6);
    for (const x of s) if (x.targetTileId) expect(isProtected(b.tiles[x.targetTileId])).toBe(false);
  });

  it("moves a buried unused tile before replacing it, and never replaces a used one", () => {
    const b = makeBoard(10);
    const favs = b.folders.find((f) => f.id === "favourites")!.tileIds;
    const counts = Object.fromEntries(favs.slice(0, 4).map((id) => [id, 3]));
    const s = planRefresh(b, counts, [cand("new1", "favourites", 0.99)]);
    const buried = favs[6];
    expect(s.find((x) => x.targetTileId === buried)?.action ?? "move").toBe("move");
    for (const id of favs.slice(0, 4)) expect(s.some((x) => x.targetTileId === id)).toBe(false);
  });

  it("applySuggestions ignores attempts to change locked tiles", () => {
    const b = makeBoard();
    const core = b.coreIds[0];
    const out = applySuggestions(b, [{ id: "x", action: "replace", folder: "favourites", targetTileId: core, tile: { ...b.tiles[core], id: "evil" }, reason: "" }]);
    expect(out.tiles[core]).toBeDefined();
    expect(out.tiles.evil).toBeUndefined();
  });
});

describe("OBF export", () => {
  it("produces a valid open-board structure", () => {
    const b = makeBoard();
    const obf = toObf(b, "hi", 6);
    expect(obf.format).toBe("open-board-0.1");
    expect(obf.grid.columns).toBe(6);
    const ids = new Set(obf.buttons.map((x) => x.id));
    for (const row of obf.grid.order) {
      expect(row).toHaveLength(6);
      for (const cell of row) if (cell !== null) expect(ids.has(cell)).toBe(true);
    }
    expect(obf.buttons.every((x) => x.vocalization.length > 0)).toBe(true);
  });
});
