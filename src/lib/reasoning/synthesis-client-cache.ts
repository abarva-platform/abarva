// Client-side module-level cache for synthesis ETag → text bodies.
//
// On first stream of a synthesis we capture the response's ETag header and
// the accumulated streamed text. On subsequent renders (same surface + key)
// we send `If-None-Match: <etag>`; if the server replies 304 we re-use the
// cached body instead of re-streaming.
//
// Process-local module state — fine for a single browser session. Swap to
// sessionStorage if cross-tab persistence is ever required.

interface CachedBody {
  etag: string;
  text: string;
}

const cache = new Map<string, CachedBody>();

export function readSynthesisCache(cacheKey: string): CachedBody | undefined {
  return cache.get(cacheKey);
}

export function writeSynthesisCache(
  cacheKey: string,
  etag: string,
  text: string,
): void {
  cache.set(cacheKey, { etag, text });
}
