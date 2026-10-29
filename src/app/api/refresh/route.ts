// Weekly refresh (FR-402): tap counts in → suggestions out. Only entity IDs and counts arrive here,
// never sentences or raw tap logs (NFR-06). Changes apply only after parent approval (client side).

import { z } from "zod";
import { refreshCandidates } from "@/lib/agent/run";
import { planRefresh } from "@/lib/board/engine";
import type { Board, Category, Tile } from "@/lib/board/types";
import { ProfileSchema, readJson } from "@/lib/http";
import type { TraceEntry } from "@/lib/qloo/trace";

export const maxDuration = 60;

const Body = z.object({
  profile: ProfileSchema,
  tiles: z
    .array(
      z.object({
        id: z.string().max(160),
        folder: z.enum(["food", "places", "favourites", "fun", "together", "new"]),
        qlooId: z.string().max(120).optional(),
        label: z.string().max(160),
        moved: z.boolean().optional(),
        locked: z.boolean(),
      }),
    )
    .max(80),
  counts: z.record(z.string().max(160), z.number().int().min(0).max(100000)),
});

export async function POST(req: Request) {
  const body = await readJson(req, Body);
  if (!body.ok) return body.res;
  const { profile, tiles, counts } = body.data;

  const top = tiles
    .filter((t) => t.qlooId && t.folder !== "fun" && (counts[t.id] ?? 0) > 0)
    .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
    .slice(0, 4)
    .map((t) => ({ id: t.qlooId!, name: t.label }));

  const trace: TraceEntry[] = [];
  const { candidates } = await refreshCandidates(profile, top, { step: () => {}, trace: (e) => trace.push(e) });

  // Lightweight board view: only the rotating tiles the client sent.
  const folders = new Map<Category, string[]>();
  const boardTiles: Record<string, Tile> = {};
  for (const t of tiles) {
    folders.set(t.folder, [...(folders.get(t.folder) ?? []), t.id]);
    boardTiles[t.id] = {
      id: t.id,
      kind: "rotating",
      category: t.folder,
      label: { en: t.label },
      speak: { en: t.label },
      emoji: "",
      locked: t.locked,
      moved: t.moved,
      reasons: [],
      entity: t.qlooId ? { qlooId: t.qlooId, name: t.label, type: "urn:entity:brand" } : undefined,
    };
  }
  const view = {
    tiles: boardTiles,
    folders: [...folders.entries()].map(([id, tileIds]) => ({ id, tileIds, title: { en: id }, emoji: "" })),
  } as unknown as Board;

  const topNames = top.map((t) => t.name);
  const suggestions = planRefresh(view, counts, candidates).map((s) =>
    s.action === "add" && topNames.length ? { ...s, reason: `${s.reason}. Seeded by this week's most-tapped: ${topNames.slice(0, 2).join(", ")}` } : s,
  );
  return Response.json({ suggestions, trace, seededBy: topNames });
}
