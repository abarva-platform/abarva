// Internal registry that lets the diagnostic /api/reasoning/synthesis-cache/info
// route see what each per-route in-memory synthesis cache currently holds.
//
// Each synthesis route still owns its own Map<string, string> (the actual cache
// for streamed responses). Routes call `registerSynthesisCache(surface, cache,
// createdAt)` at module load time so the diagnostic endpoint can iterate over
// every surface without import cycles.
//
// Note: this is process-local — fine for the in-memory cache layer, which is
// itself process-local. In production a Redis-backed cache would surface its
// own diagnostic API.

import { createHash } from 'node:crypto';

export type SynthesisSurface = 'source' | 'programs' | 'tower';

interface RegisteredCache {
  cache: Map<string, string>;
  createdAt: Map<string, number>;
}

const registry = new Map<SynthesisSurface, RegisteredCache>();

export function registerSynthesisCache(
  surface: SynthesisSurface,
  cache: Map<string, string>,
  createdAt: Map<string, number>,
): void {
  registry.set(surface, { cache, createdAt });
}

export interface SynthesisCacheEntryInfo {
  surface: SynthesisSurface;
  key: string;
  hashedKey: string;
  ageSeconds: number;
}

/**
 * Snapshot every registered cache for diagnostic display.
 * Keys are returned both raw and SHA-1 hashed (so an admin UI can show a short
 * deterministic identifier without leaking full instance state hashes).
 */
export function snapshotSynthesisCaches(now: number = Date.now()): SynthesisCacheEntryInfo[] {
  const entries: SynthesisCacheEntryInfo[] = [];
  for (const [surface, { cache, createdAt }] of registry) {
    for (const key of cache.keys()) {
      const ts = createdAt.get(key) ?? now;
      entries.push({
        surface,
        key,
        hashedKey: createHash('sha1').update(key).digest('hex'),
        ageSeconds: Math.max(0, Math.floor((now - ts) / 1000)),
      });
    }
  }
  return entries;
}
