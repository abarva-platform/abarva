// Board-grade artifact render memo cache.
//
// The eight `/api/v1/moves/board-grade-*` routes are `force-dynamic` with
// `cache-control: no-store`, so every request RECOMPUTES the whole artifact —
// rebuilding the Expert Kernel case and re-rendering the full HTML string, or,
// for the PPTX path, re-running `@resvg/resvg-js` SVG→PNG rasterisation, which
// is heavy.
//
// But the renderer functions are PURE deterministic functions of a single
// input — `generatedOn`, a `YYYY-MM-DD` date string. No request data, no
// tenant, no DB. For a given day the output is byte-identical on every
// request.
//
// This module is a deterministic in-process memo. `cachedRender` /
// `cachedRenderAsync` wrap a renderer CALL SITE: the first call for a given
// key computes and stores the result; subsequent calls with the same key
// return the stored value. The key includes the artifact id, the format, and
// `generatedOn`, so a date rollover naturally produces a fresh entry and the
// previous day's entry ages out.
//
// This is correct precisely because the renderers are pure and the key is
// fully determined by their inputs — the memo is an optimisation, not a
// behaviour change. The bytes served stay identical; they are simply computed
// once per day instead of once per request.
//
// The cache is bounded with simple FIFO eviction so it cannot grow unbounded
// as the date rolls over. A handful of HTML strings and PPTX buffers per day
// is tiny, but the bound is enforced anyway.
//
// Pure module: no I/O, no React. Module-level `Map`, in-process only.

/** Maximum number of entries retained before FIFO eviction kicks in. */
const MAX_ENTRIES = 32;

/**
 * Module-level memo store. Insertion order is meaningful: the oldest key is
 * the first key returned by `Map.prototype.keys()`, which is what FIFO
 * eviction removes.
 */
const store = new Map<string, unknown>();

/** Evict the oldest entry until the store is within `MAX_ENTRIES`. */
function evictToBound(): void {
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

/**
 * Memoise a PURE, synchronous `compute` keyed by `key`.
 *
 * The first call for a key runs `compute`, stores the result, and returns it;
 * later calls with the same key return the stored value without re-running
 * `compute`. Only successful renders are cached — if `compute` throws, nothing
 * is stored and the error propagates, so the next call retries.
 *
 * @param key     Fully-determining cache key, e.g.
 *                `costed-business-case:html:2026-05-20`.
 * @param compute Pure renderer call. Must depend only on inputs reflected in
 *                `key`.
 */
export function cachedRender<T>(key: string, compute: () => T): T {
  if (store.has(key)) {
    return store.get(key) as T;
  }
  // Compute OUTSIDE the store — a throw must not leave a partial entry.
  const value = compute();
  store.set(key, value);
  evictToBound();
  return value;
}

/**
 * Async variant of {@link cachedRender} for renderers that return a
 * `Promise` — e.g. the PPTX path, which rasterises SVG exhibits.
 *
 * The resolved value is cached, not the pending promise: if `compute` rejects,
 * nothing is stored and the rejection propagates, so the next call retries.
 *
 * @param key     Fully-determining cache key, e.g.
 *                `costed-business-case:pptx:2026-05-20`.
 * @param compute Pure async renderer call. Must depend only on inputs
 *                reflected in `key`.
 */
export async function cachedRenderAsync<T>(
  key: string,
  compute: () => Promise<T>,
): Promise<T> {
  if (store.has(key)) {
    return store.get(key) as T;
  }
  // Await OUTSIDE the store — a rejection must not leave a partial entry.
  const value = await compute();
  store.set(key, value);
  evictToBound();
  return value;
}

/**
 * Test-only hook: clear the memo store so tests can assert compute counts
 * without cross-test contamination. Not used by production code.
 */
export function __resetRenderCacheForTests(): void {
  store.clear();
}
