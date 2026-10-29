// In-memory LRU cache for Qloo responses. Server-side only; never persisted to git (Qloo terms).

const MAX_ENTRIES = 500;
const TTL_MS = 24 * 60 * 60 * 1000;

const store = new Map<string, { at: number; value: unknown }>();

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > TTL_MS) {
    store.delete(key);
    return undefined;
  }
  store.delete(key);
  store.set(key, hit);
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown) {
  store.set(key, { at: Date.now(), value });
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}
