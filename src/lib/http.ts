// Shared API-route helpers: input validation (zod), size cap and a simple per-IP rate limit (NFR-09).

import { z } from "zod";
import { AGE_BANDS, QLOO_TYPES } from "./qloo/types";
import { LANG_CODES, LOCAL_LANGS, type Lang } from "./i18n";
import { AGE_GROUPS } from "./board/age";
import { TEMPERAMENTS } from "./board/temperament";

const MAX_BODY = 32 * 1024;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

/** Per route and IP: building a board costs dozens of Qloo and LLM calls, so it gets a much lower limit than search. */
export function rateLimited(req: Request, bucket = "api", limit = 30): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
  return recent.length > limit;
}

export async function readJson<T>(
  req: Request,
  schema: z.ZodType<T>,
  rate: { bucket: string; limit: number } = { bucket: "api", limit: 30 },
): Promise<{ ok: true; data: T } | { ok: false; res: Response }> {
  if (rateLimited(req, rate.bucket, rate.limit)) return { ok: false, res: Response.json({ error: "Too many requests, slow down a little." }, { status: 429 }) };
  const text = await req.text();
  if (text.length > MAX_BODY) return { ok: false, res: Response.json({ error: "Request too large" }, { status: 413 }) };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, res: Response.json({ error: "Invalid JSON" }, { status: 400 }) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, res: Response.json({ error: "Invalid input", issues: parsed.error.issues.slice(0, 5) }, { status: 400 }) };
  return { ok: true, data: parsed.data };
}

const Lang = z.enum(LANG_CODES as [Lang, ...Lang[]]);
const EntityRefSchema = z.object({
  qlooId: z.string().max(120).optional(),
  name: z.string().min(1).max(120),
  type: z.enum(QLOO_TYPES),
  image: z.string().url().max(500).optional(),
  nameLocal: z.partialRecord(z.enum(LOCAL_LANGS as [Exclude<Lang, "en">, ...Exclude<Lang, "en">[]]), z.string().max(120)).optional(),
});

export const ProfileSchema = z.object({
  id: z.string().max(80),
  displayName: z.string().min(1).max(40),
  ageBand: z.enum(AGE_BANDS),
  isChild: z.boolean(),
  ageGroup: z.enum(AGE_GROUPS).optional(),
  temperament: z.array(z.enum(TEMPERAMENTS)).max(2).optional(),
  communication: z.enum(["new", "pictures", "words"]).optional(),
  dislikes: z.array(z.string().min(1).max(60)).max(10).optional(),
  access: z.object({ wheelchair: z.boolean().optional(), quiet: z.boolean().optional() }).optional(),
  city: z.string().min(2).max(120),
  home: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }).optional(),
  primaryLang: Lang,
  secondaryLang: Lang.optional(),
  loves: z.array(EntityRefSchema).min(1).max(8),
  family: z
    .array(z.object({ name: z.string().min(1).max(40), relation: z.string().min(1).max(40), loves: z.array(EntityRefSchema).max(6) }))
    .max(6),
});
