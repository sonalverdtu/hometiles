import { z } from "zod";
import { baselineTiles } from "@/lib/agent/baseline";
import { ProfileSchema, readJson } from "@/lib/http";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await readJson(req, z.object({ profile: ProfileSchema }), { bucket: "baseline", limit: 4 });
  if (!body.ok) return body.res;
  return Response.json(await baselineTiles(body.data.profile));
}
