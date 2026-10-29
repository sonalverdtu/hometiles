// Quick end-to-end check of board generation (mock mode unless keys are set).
import { generateBoard } from "../src/lib/agent/run";
import { PERSONAS } from "../src/lib/personas";
import { pick } from "../src/lib/board/vocab";

const name = process.argv[2] ?? "aarav";
const t0 = Date.now();
const board = await generateBoard(PERSONAS[name], { step: (s) => console.log("  ·", s), trace: () => {} });
console.log(`\nmode=${JSON.stringify(board.mode)} in ${Date.now() - t0} ms, trace calls=${board.trace.length}`);
for (const f of board.folders) {
  console.log(`\n[${f.title.en}] ${f.tileIds.length}`);
  for (const id of f.tileIds.slice(0, 10)) {
    const t = board.tiles[id];
    console.log(`  ${t.emoji} ${pick(t.label, board.profile.primaryLang)} | "${pick(t.speak, board.profile.primaryLang)}" | ${t.partner ?? ""} | ${t.reasons.map((r) => r.text).join(" ; ").slice(0, 150)}`);
  }
}
console.log("\nnotes:", board.notes);
console.log("errors/fallbacks:", board.trace.filter((e) => e.status !== 200).map((e) => `${e.endpoint}: ${e.note}`));
