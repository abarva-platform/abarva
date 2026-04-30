// EXPORT-4 · In-memory spec cache.
//
// When the agent completes a `compose_artifact` step it has produced a
// `DeliverableSpec`. The reactive panel needs to render a download chip
// the user can click to fetch the rendered binary. Two paths considered
// (see DELIVERABLE_EXPORT_DESIGN.md §6 / EXPORT-4 doctrine):
//
//   (a) Inline the spec in the artifact payload — self-contained, but
//       artifacts should stay <2 KB. Charter specs blow that budget.
//   (b) Store the spec server-side keyed by an ephemeral id; the
//       artifact carries the id, the download POST sends `{ specId }`,
//       and the route loads → renders → serves.
//
// We pick (b). For pilot velocity we use a single-process in-memory
// `Map<specId, { spec, expiresAt }>` with a 1-hour TTL. The persistent
// `program_deliverable_drafts` table is tracked as
// **OV2-EXPORT-4-EXTEND** (CB-7) and ships when we move beyond
// single-process deployments.
//
// Single-process limitation: each Vercel function instance has its own
// Map. If a download lands on a different lambda than the one that
// stored the spec the cache miss returns null and the route falls back
// to `{ spec }`-shaped POST bodies (the agent can re-send the full
// spec inline as a degraded path). For pilot deployments the warm
// instance absorbs both the store and the fetch, so the cache hits
// almost always.
//
// No imports of `server-only` so the cache module can be unit-tested
// in jest's node environment without `server-only` complaining about
// the test runner. The agent-side caller is always server-side; this
// module never ships to the client.

import { randomUUID } from 'node:crypto';

import type { DeliverableSpec } from './types';

/** TTL for cached specs — 1 hour. */
export const SPEC_CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  spec: DeliverableSpec;
  expiresAt: number;
}

/**
 * Module-level Map. Survives between requests on the same lambda
 * instance; resets on cold start. Tests reset by calling
 * `__resetSpecCacheForTests()` (exported under that exact name so it
 * doesn't show up in production callsites by accident).
 */
const cache = new Map<string, CacheEntry>();

/** Drop expired entries to prevent unbounded growth on a long-lived process. */
function evictExpired(now: number): void {
  for (const [id, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(id);
    }
  }
}

/**
 * Store a spec, returning a fresh id. The id is opaque (UUID); callers
 * must NOT rely on its shape. Use `getSpec(id)` to retrieve.
 *
 * The agent calls this when a `compose_artifact` step completes and
 * just before emitting the `deliverable-ready` artifact carrying the
 * returned id. The export route resolves the id back to the spec.
 *
 * Synchronous — no I/O. Eviction of expired entries happens inline so
 * a hot cache doesn't grow without bound.
 */
export function storeSpec(spec: DeliverableSpec): string {
  const now = Date.now();
  evictExpired(now);
  const id = randomUUID();
  cache.set(id, { spec, expiresAt: now + SPEC_CACHE_TTL_MS });
  return id;
}

/**
 * Retrieve a spec by id. Returns null if the id is unknown or the
 * entry has expired. Expired entries are removed on access so
 * subsequent reads of the same id return null cleanly.
 *
 * Read-only — does NOT extend TTL. The cached binding represents
 * "the spec the agent finalized at compose time"; download attempts
 * should hit the renderer with the same payload regardless of how
 * many times the user clicks.
 */
export function getSpec(id: string): DeliverableSpec | null {
  const now = Date.now();
  const entry = cache.get(id);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    cache.delete(id);
    return null;
  }
  return entry.spec;
}

/**
 * Test-only · clear the cache between tests. Exported under a
 * deliberately ugly name so no production callsite uses it by accident.
 */
export function __resetSpecCacheForTests(): void {
  cache.clear();
}
