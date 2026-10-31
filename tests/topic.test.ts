import { describe, expect, it } from "vitest";
import { assembleBoard, type Candidate } from "../src/lib/board/engine";
import { predict, stabilize } from "../src/lib/board/smart";
import { topicOf } from "../src/lib/board/topic";
import type { Profile, TapEvent } from "../src/lib/board/types";

const profile: Profile = {
  id: "p", displayName: "Leo", ageBand: "24_and_younger", isChild: true, city: "C", primaryLang: "en",
  loves: [{ name: "X", type: "urn:entity:tv_show", qlooId: "x" }],
  family: [{ name: "Dada", relation: "grandfather", loves: [] }],
};
const cand = (id: string, category: Candidate["category"], personal: number, extra: Partial<Candidate> = {}): Candidate => ({
  entity: { id, name: id, type: "urn:entity:tv_show", affinity: personal, tags: [] }, category, personal, reasons: [], ...extra,
});
const board = assembleBoard({
  id: "b", profile, mode: { qloo: "mock", llm: "mock", agent: "scripted" }, trace: [],
  candidates: [
    cand("show1", "favourites", 0.95), cand("show2", "favourites", 0.9), cand("snack1", "food", 0.8),
    cand("park", "places", 0.7), cand("zoo", "places", 0.4),
    cand("oldsongs", "together", 0.3, { sharedWith: ["Dada"], entity: { id: "oldsongs", name: "Old songs", type: "urn:entity:artist", tags: [] } }),
  ],
});
const NOW = 10 * 3600_000;
// Utterances 2 minutes apart; taps inside one are 2 s apart.
const said = (...utterances: string[][]): TapEvent[] =>
  utterances.flatMap((ids, u) => ids.map((tileId, k) => ({ tileId, ts: NOW - (utterances.length - u) * 120_000 + k * 2000 })));

describe("live topic", () => {
  it("talking about Dada brings up what is shared with Dada", () => {
    const taps = said(["core-i", "core-want", "people-0"], ["people-0", "core-go"]);
    const topic = topicOf(board, taps, NOW);
    expect(topic.label?.why).toBe("talking about Dada");
    expect(topic.boosts.get("t-oldsongs")).toBeGreaterThan(0.5);
    const without = predict(board, null, [], new Date(NOW), 12).map((p) => p.tile.id);
    const withTopic = predict(board, null, [], new Date(NOW), 12, topic).map((p) => p.tile.id);
    expect(withTopic.indexOf("t-oldsongs")).toBeLessThan(without.indexOf("t-oldsongs"));
    // Social words for the person come first ("hello", "love"), then what they share.
    expect(withTopic.slice(0, 3)).toContain("t-oldsongs");
    expect(withTopic.slice(0, 3).some((id) => ["basic-hello", "basic-love"].includes(id))).toBe(true);
  });

  it("'go' makes places the topic, and older utterances fade", () => {
    const topic = topicOf(board, said(["core-go", "t-park"], ["core-go"]), NOW);
    expect(topic.label?.why).toBe("talking about going out");
    expect(topic.boosts.get("t-zoo")).toBeGreaterThan(0);
    // Two hours later the topic is gone.
    expect(topicOf(board, said(["core-go"]), NOW + 3 * 3600_000).label).toBeUndefined();
  });

  it("counts a topic once per utterance, and the latest mention wins a tie", () => {
    const topic = topicOf(board, said(["core-go", "t-park", "t-zoo", "people-0"]), NOW);
    expect(topic.label?.why).toBe("talking about Dada");
  });

  it("never boosts core words", () => {
    const topic = topicOf(board, said(["people-0", "core-want"], ["people-0"]), NOW);
    expect([...topic.boosts.keys()].some((id) => id.startsWith("core-"))).toBe(false);
  });
});

describe("steady 'Maybe next' row", () => {
  const ranked = predict(board, null, [], new Date(NOW), 20);
  const ids = (ps: { tile: { id: string } }[]) => ps.map((p) => p.tile.id);

  it("keeps tiles in their slots and changes at most 3 per update", () => {
    const first = stabilize([], ranked, 6);
    expect(ids(first)).toEqual(ids(ranked.slice(0, 6)));
    // A very different ranking: the old top six fall to the bottom.
    const flipped = [...ranked.slice(6), ...ranked.slice(0, 6)];
    const next = stabilize(ids(first), flipped, 6);
    expect(next).toHaveLength(6);
    const kept = ids(next).filter((id, i) => id === ids(first)[i]);
    expect(kept.length).toBeGreaterThanOrEqual(3);
  });

  it("a tile still in the top keeps its exact slot", () => {
    const first = stabilize([], ranked, 6);
    const swapped = [ranked[1], ranked[0], ...ranked.slice(2)];
    expect(ids(stabilize(ids(first), swapped, 6))).toEqual(ids(first));
  });
});
