import { z } from "zod";
import { readJson } from "@/lib/http";
import { Qloo } from "@/lib/qloo";
import { Tracer } from "@/lib/qloo/trace";
import { QLOO_TYPES } from "@/lib/qloo/types";

const Body = z.object({ query: z.string().min(2).max(80), types: z.array(z.enum(QLOO_TYPES)).max(4).optional() });

export async function POST(req: Request) {
  const body = await readJson(req, Body);
  if (!body.ok) return body.res;
  const qloo = new Qloo(new Tracer());
  try {
    const results = await qloo.search(body.data.query, body.data.types, 6);
    return Response.json({
      mode: qloo.mode,
      results: results.map((e) => ({ qlooId: e.id, name: e.name, type: e.type, image: e.image, nameLocal: e.nameLocal })),
    });
  } catch (err) {
    return Response.json({ mode: qloo.mode, results: [], error: (err as Error).message.slice(0, 120) }, { status: 502 });
  }
}
