// Builds a demo child's board against live Qloo with the scripted agent and prints what landed where.
// Run: npx tsx --env-file=.env.local scripts/live-check.ts leo [--llm]
// Never prints keys.

import { generateBoard } from "../src/lib/agent/run";
import { PERSONAS } from "../src/lib/personas";

process.env.AGENT_MODE = "scripted";
// --llm keeps the LLM steps (labels, local snack proposals) live; the agent itself stays scripted.
if (!process.argv.includes("--llm")) process.env.LLM_MODE = "mock";

async function main() {
  const id = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "leo";
  const t0 = Date.now();
  const errors: string[] = [];
  const board = await generateBoard(structuredClone(PERSONAS[id]), {
    step: () => {},
    trace: (e) => e.status !== 200 && errors.push(`${e.tool} ${e.endpoint}: ${e.note ?? e.status}`),
  });
  console.log(`${id}: ${board.mode.qloo} Qloo, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  for (const f of board.folders) {
    if (["core", "safety", "people"].includes(f.id)) continue;
    const tiles = f.tileIds.map((t) => board.tiles[t]);
    console.log(`\n[${f.id}]`);
    for (const t of tiles) console.log(`  ${t.entity?.name ?? t.label.en}${t.entity?.distanceM ? ` (${t.entity.distanceM} m)` : ""} · ${t.reasons.map((r) => r.kind).join(",")}`);
  }
  if (board.notes?.length) console.log(`\nnotes:\n  ${board.notes.join("\n  ")}`);
  if (errors.length) console.log(`\nnon-200 calls:\n  ${errors.join("\n  ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
