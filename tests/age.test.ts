import { describe, expect, it } from "vitest";
import { ageGroupOf, isMinor, ratingOk, screenRatings } from "../src/lib/board/age";

describe("age groups", () => {
  it("treats older boards by isChild, and teens as minors", () => {
    expect(ageGroupOf({ isChild: true })).toBe("child");
    expect(ageGroupOf({ isChild: false })).toBe("adult");
    expect(ageGroupOf({ isChild: false, ageGroup: "teen" })).toBe("teen");
    expect(isMinor("teen")).toBe(true);
    expect(isMinor("adult")).toBe(false);
  });

  it("drops TV-PG for under-8s and allows TV-14 only from teens", () => {
    expect(screenRatings("young")).not.toContain("TV-PG");
    expect(screenRatings("child")).toContain("TV-PG");
    expect(screenRatings("child")).not.toContain("TV-14");
    expect(screenRatings("teen")).toContain("TV-14");
    expect(screenRatings("adult")).toBeUndefined();
  });

  it("screens game ratings Qloo's own filter lets through", () => {
    expect(ratingOk("child", "M", "game")).toBe(false); // Borderlands 3 for a 10-year-old
    expect(ratingOk("child", "T", "game")).toBe(false);
    expect(ratingOk("child", "E10+", "game")).toBe(true);
    expect(ratingOk("teen", "T", "game")).toBe(true);
    expect(ratingOk("teen", "ESRB M", "game")).toBe(false);
    expect(ratingOk("adult", "M", "game")).toBe(true);
    // Missing or unknown ratings pass: many good kids' titles have none.
    expect(ratingOk("young", undefined, "game")).toBe(true);
    expect(ratingOk("young", "PEGI 7", "game")).toBe(true);
    expect(ratingOk("young", "TV-PG", "screen")).toBe(false);
  });
});
