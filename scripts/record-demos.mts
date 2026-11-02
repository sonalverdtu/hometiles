// Records a live board for each demo child into public/demo/<key>.json, so "Try Freddie" opens instantly.
// A live build (about a minute) is only for new boards. Re-run this to refresh the demos:
//   npx tsx scripts/record-demos.mts [freddie kabir rosa]
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { generateBoard } from "../src/lib/agent/run";
import { PERSONAS } from "../src/lib/personas";
import type { DemoRecording } from "../src/lib/board/types";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PERSONAS);
mkdirSync("public/demo", { recursive: true });

for (const key of keys) {
  const t0 = Date.now();
  const steps: DemoRecording["steps"] = [];
  const board = await generateBoard(PERSONAS[key], { step: (text, tool) => steps.push({ text, tool, at: Date.now() - t0 }), trace: () => {} });
  if (board.mode.qloo !== "live") throw new Error(`${key}: Qloo was not live (${JSON.stringify(board.mode)}); check .env.local`);
  const rec: DemoRecording = { key, recordedAt: new Date().toISOString(), ms: Date.now() - t0, steps, board };
  writeFileSync(`public/demo/${key}.json`, JSON.stringify(rec));
  console.log(`${key}: ${Object.keys(board.tiles).length} tiles, ${board.trace.length} Qloo calls, ${Math.round(rec.ms / 1000)}s, mode ${JSON.stringify(board.mode)}`);
}
