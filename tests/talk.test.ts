import { describe, expect, it } from "vitest";
import { assembleBoard, type Candidate } from "../src/lib/board/engine";
import { predict } from "../src/lib/board/smart";
import { avoider, talkFor } from "../src/lib/board/talk";
import type { Profile } from "../src/lib/board/types";
import type { QTag } from "../src/lib/qloo/types";

// Real tag ids and names, as live Qloo returned them for The Regent's Park, Bluey and Cadbury.
const tag = (id: string, name: string): QTag => ({ id: `urn:tag:${id}`, name });
const PARK = [
  tag("amenities:place:swings", "Swings"), tag("amenities:place:slides", "Slides"), tag("amenities:place:public_restroom", "Public restroom"),
  tag("amenities:place:picnic_tables", "Picnic tables"), tag("activity_type:qloo:boating", "Boating"), tag("pets:place:dogs_allowed", "Dogs allowed"),
  tag("ambience:qloo:tranquil", "Tranquil"),
];
const BLUEY = [
  tag("keyword:qloo:puppy", "Puppy"), tag("keyword:qloo:sibling", "Sibling"), tag("keyword:qloo:friendship", "Friendship"),
  tag("plot:qloo:playful", "Playful"), tag("genre:media:comedy", "Comedy"), tag("theme:qloo:imagination", "Imagination"), tag("genre:media:family", "Family"),
];
const CADBURY = [tag("genre:brand:food_and_beverage", "Food & Beverage"), tag("keyword:qloo:chocolate", "Chocolate"), tag("flavor_profile:qloo:sweet", "Sweet"), tag("keyword:qloo:sharing", "Sharing")];

describe("talk words from Qloo tags", () => {
  it("a park gives what you do and need there", () => {
    expect(talkFor("urn:entity:place", PARK)).toEqual(["=basic-swing", "slide", "=safety-toilet", "picnic", "boat", "dog"]);
  });

  it("a show gives what it's about and what it's like, not its genre", () => {
    const w = talkFor("urn:entity:tv_show", BLUEY);
    expect(w).toEqual(expect.arrayContaining(["dog", "family", "=basic-friend", "funny"]));
    expect(w.length).toBeLessThanOrEqual(6);
  });

  it("a snack gives its taste and how it's eaten", () => {
    expect(talkFor("urn:entity:brand", CADBURY)).toEqual(["chocolate", "sweet", "share"]);
  });

  it("people and artists get none", () => {
    expect(talkFor("urn:entity:artist", BLUEY)).toEqual([]);
  });

  it("dislikes match words, plurals and names", () => {
    const avoid = avoider(["dogs", "Peppa Pig"]);
    expect(avoid("Dogs allowed")).toBe(true);
    expect(avoid("Peppa Pig: World Adventures")).toBe(true);
    expect(avoid("Bluey")).toBe(false);
  });
});

const profile: Profile = {
  id: "p", displayName: "Leo", ageBand: "24_and_younger", isChild: true, city: "C", primaryLang: "en",
  loves: [{ name: "Bluey", type: "urn:entity:tv_show", qlooId: "bluey" }], family: [],
};
const cand = (id: string, category: Candidate["category"], type: Candidate["entity"]["type"], tags: QTag[], own = false): Candidate => ({
  entity: { id, name: id, type, affinity: 0.9, tags }, category, personal: own ? 1 : 0.9, own, reasons: [],
});
const build = (p: Profile) =>
  assembleBoard({
    id: "b", profile: p, mode: { qloo: "mock", llm: "mock", agent: "scripted" }, trace: [],
    candidates: [
      cand("bluey", "favourites", "urn:entity:tv_show", BLUEY, true),
      cand("park", "places", "urn:entity:place", PARK),
      cand("cadbury", "food", "urn:entity:brand", CADBURY),
      ...Array.from({ length: 10 }, (_, i) => cand(`show${i}`, "favourites", "urn:entity:tv_show", [])),
    ],
  });

describe("talk words on the board", () => {
  const board = build(profile);

  it("links each tile to its words and adds a 'Talk about it' folder", () => {
    expect(board.tiles["t-park"].talk).toEqual(["basic-swing", "talk-slide", "safety-toilet", "talk-picnic", "talk-boat", "talk-dog"]);
    expect(board.tiles["t-bluey"].talk).toContain("talk-dog");
    const folder = board.folders.find((f) => f.id === "talk")!;
    // "dog" comes from both the park and Bluey, so it's first.
    expect(folder.tileIds[0]).toBe("talk-dog");
    expect(board.tiles["talk-dog"].reasons[0].text).toMatch(/Qloo's own tags/);
  });

  it("after tapping the park, its words come first in 'Maybe next'", () => {
    const top = predict(board, "t-park", [], new Date(2026, 9, 31, 13), 6).map((p) => p.tile.id);
    expect(top.slice(0, 4)).toEqual(expect.arrayContaining(["basic-swing", "talk-slide", "safety-toilet"]));
  });

  it("after tapping Bluey, the child can comment on it", () => {
    const top = predict(board, "t-bluey", [], new Date(2026, 9, 31, 18), 6).map((p) => p.tile.id);
    expect(top).toContain("talk-dog");
    expect(top).toContain("talk-funny");
  });

  it("a child just starting gets a smaller board", () => {
    const small = build({ ...profile, communication: "new" });
    const count = (b: typeof board) => Object.keys(b.tiles).length;
    expect(count(small)).toBeLessThan(count(board) - 40);
    expect(small.folders.find((f) => f.id === "favourites")!.tileIds.length).toBeLessThanOrEqual(6);
    // Safety and core words are never cut.
    for (const id of ["safety-help", "safety-pain", "safety-toilet", "core-i", "core-want", "core-no"]) expect(small.tiles[id]).toBeTruthy();
  });
});
