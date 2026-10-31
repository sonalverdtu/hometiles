import { describe, expect, it } from "vitest";
import { assembleBoard, type Candidate } from "../src/lib/board/engine";
import { predict } from "../src/lib/board/smart";
import { topicOf } from "../src/lib/board/topic";
import type { Category, Profile, TapEvent } from "../src/lib/board/types";

// An entertainment-heavy board, like a real one: lots of shows, toys and jokes with high taste scores.
const profile: Profile = {
  id: "p", displayName: "Leo", ageBand: "24_and_younger", isChild: true, city: "C", primaryLang: "en",
  loves: [{ name: "Bluey", type: "urn:entity:tv_show", qlooId: "bluey" }],
  family: [{ name: "Grandma", relation: "grandmother", loves: [] }],
};
const cand = (id: string, category: Candidate["category"], personal: number): Candidate => ({
  entity: { id, name: id, type: "urn:entity:tv_show", affinity: personal, tags: [] }, category, personal, reasons: [],
});
const board = assembleBoard({
  id: "b", profile, mode: { qloo: "mock", llm: "mock", agent: "scripted" }, trace: [],
  candidates: [
    ...["show1", "show2", "show3", "show4", "show5", "show6"].map((s, i) => cand(s, "favourites", 0.98 - i * 0.01)),
    cand("toy1", "things", 0.95), cand("toy2", "things", 0.94), cand("duet", "together", 0.96), cand("hit", "new", 0.99),
    cand("snack1", "food", 0.9), cand("park1", "places", 0.85),
  ],
});

const COMM = new Set<Category>(["feelings", "chat", "body", "people", "safety"]);
const ENT = new Set<Category>(["favourites", "fun", "together", "new", "things"]);
const at = (h: number) => new Date(2026, 9, 31, h, 0);
const mix = (ids: { tile: { category: Category } }[]) => ({
  comm: ids.filter((p) => COMM.has(p.tile.category)).length,
  ent: ids.filter((p) => ENT.has(p.tile.category)).length,
});

describe("the smart row stays a communication board", () => {
  it("keeps at least 3 communication words and at most 4 entertainment tiles in 12, at any hour", () => {
    for (const h of [8, 13, 18, 22]) {
      const m = mix(predict(board, null, [], at(h), 12));
      expect(m.comm).toBeGreaterThanOrEqual(3);
      expect(m.ent).toBeLessThanOrEqual(4);
    }
  });

  it("holds the balance for any number of shown tiles (the board shows 8 on phones)", () => {
    const row = predict(board, null, [], at(13), 20);
    for (const n of [4, 8, 12, 20]) {
      const m = mix(row.slice(0, n));
      expect(m.comm).toBeGreaterThanOrEqual(Math.floor(n / 4));
      expect(m.ent).toBeLessThanOrEqual(Math.ceil(n / 3));
    }
  });

  it("after 'it hurts' it offers where it hurts and the doctor, not snacks and shows", () => {
    const top = predict(board, "safety-pain", [], at(18), 6).map((p) => p.tile.id);
    expect(top).toContain("basic-tummy");
    expect(top).toContain("basic-head");
    expect(top.filter((id) => ["basic-doctor", "basic-sad", "basic-mouth", "basic-ear"].includes(id)).length).toBeGreaterThan(0);
    expect(top.some((id) => id.startsWith("t-show") || id.startsWith("t-snack"))).toBe(false);
  });

  it("after 'no' it lets the child say what they don't want", () => {
    const top = predict(board, "core-no", [], at(18), 4).map((p) => p.tile.id);
    expect(top).toContain("basic-dontlike");
    expect(top).toContain("basic-turnoff");
  });

  it("after 'I' it offers feelings, not only things to want", () => {
    const top = predict(board, "core-i", [], at(18), 6).map((p) => p.tile.category);
    expect(top).toContain("feelings");
  });

  it("after a person it offers love and hello", () => {
    const top = predict(board, "people-0", [], at(18), 6).map((p) => p.tile.id);
    expect(top).toContain("basic-love");
    expect(top).toContain("basic-hello");
  });

  it("talking about Grandma brings up social words, not only shared shows", () => {
    const taps: TapEvent[] = [{ tileId: "people-0", ts: at(18).getTime() - 120_000 }];
    const topic = topicOf(board, taps, at(18).getTime());
    expect(topic.boosts.get("basic-love")).toBeGreaterThan(0);
    expect(topic.boosts.get("basic-hello")).toBeGreaterThan(0);
  });

  it("never puts trending 'What's new' picks in the smart row", () => {
    for (const h of [8, 13, 18, 22]) expect(predict(board, null, [], at(h), 20).some((p) => p.tile.category === "new")).toBe(false);
  });
});
