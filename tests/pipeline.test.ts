import { beforeAll, describe, expect, it } from "vitest";
import type { Board } from "../src/lib/board/types";
import { PERSONAS } from "../src/lib/personas";

// Whole pipeline in mock mode (scripted agent, synthetic catalogue): no keys, no network.
beforeAll(() => {
  process.env.QLOO_MODE = "mock";
  process.env.LLM_MODE = "mock";
  process.env.AGENT_MODE = "scripted";
  process.env.PICTOGRAMS = "off";
});

async function build(id: keyof typeof PERSONAS, patch: Partial<(typeof PERSONAS)[string]> = {}): Promise<{ board: Board; tools: string[] }> {
  const { generateBoard } = await import("../src/lib/agent/run");
  const tools: string[] = [];
  const profile = structuredClone({ ...PERSONAS[id], ...patch });
  const board = await generateBoard(profile, { step: (_t, tool) => tool && tools.push(tool), trace: () => {} });
  return { board, tools };
}

describe("board pipeline (mock)", () => {
  it("uses the temperament as Qloo tags and keeps every safety word", async () => {
    const { board, tools } = await build("leo");
    expect(tools).toContain("match_temperament");
    const reasons = Object.values(board.tiles).flatMap((t) => t.reasons.map((r) => r.kind));
    expect(reasons).toContain("temperament");
    for (const k of ["help", "pain", "toilet", "tired", "scared", "unwell"]) expect(board.tiles[`safety-${k}`]).toBeTruthy();
  });

  it("skips the temperament step when none is given", async () => {
    const { tools } = await build("leo", { temperament: undefined });
    expect(tools).not.toContain("match_temperament");
  });

  it("never puts energy drinks or adult places on a child's board", async () => {
    for (const id of Object.keys(PERSONAS)) {
      const { board } = await build(id);
      const names = Object.values(board.tiles).map((t) => t.entity?.name ?? t.label.en);
      expect(names.filter((n) => /\b(red bull|g fuel|beer|wine|bar|pub)\b/i.test(n))).toEqual([]);
    }
  });
});
