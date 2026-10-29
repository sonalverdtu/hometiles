// ARASAAC pictograms (CC BY-NC-SA 4.0, Government of Aragón). Fetched at runtime, never stored in the repo.

import { getConfig } from "./config";

const cache = new Map<string, string | null>();

export async function arasaacUrl(keyword: string, lang = "en"): Promise<string | null> {
  if (!getConfig().pictograms) return null;
  const key = `${lang}:${keyword.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch(`https://api.arasaac.org/v1/pictograms/${lang}/search/${encodeURIComponent(keyword)}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(String(res.status));
    const json: unknown = await res.json();
    const first = Array.isArray(json) ? (json[0] as { _id?: number } | undefined) : undefined;
    const url = first?._id ? `https://static.arasaac.org/pictograms/${first._id}/${first._id}_300.png` : null;
    cache.set(key, url);
    return url;
  } catch {
    cache.set(key, null);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
