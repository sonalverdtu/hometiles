import { beforeAll, describe, expect, it } from "vitest";
import { PERSONAS } from "../src/lib/personas";

beforeAll(() => {
  process.env.QLOO_MODE = "mock";
  process.env.LLM_MODE = "mock";
  process.env.AGENT_MODE = "scripted";
});

const post = async (body: unknown) => {
  const { POST } = await import("../src/app/api/refresh/route");
  const res = await POST(new Request("http://test/api/refresh", { method: "POST", body: JSON.stringify(body), headers: { "x-forwarded-for": `t${Math.random()}` } }));
  return { status: res.status, json: await res.json() };
};

const anon = { ...PERSONAS.leo, id: "anon", displayName: "Child", family: [] };
const tiles = [{ id: "t-x", folder: "food", qlooId: "x", type: "urn:entity:brand", label: "Snack", locked: false }];

describe("weekly refresh API", () => {
  it("suggests nothing when there are no taps yet", async () => {
    const { status, json } = await post({ profile: anon, tiles, counts: {} });
    expect(status).toBe(200);
    expect(json.suggestions).toEqual([]);
  });

  it("rejects an unknown entity type", async () => {
    const { status } = await post({ profile: anon, tiles: [{ ...tiles[0], type: "urn:entity:spaceship" }], counts: { "t-x": 3 } });
    expect(status).toBe(400);
  });
});
