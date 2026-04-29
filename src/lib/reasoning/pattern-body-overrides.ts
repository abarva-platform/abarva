/**
 * Pattern body overrides — local in-memory store.
 *
 * Lets operators preview and iterate on the `body` markdown of any
 * `PatternSeed` without editing source files. Values are stored in a
 * module-level Map and wiped on server restart (persistence is
 * intentionally out of scope).
 *
 * Override semantics:
 *   - When an override is present for `patternId`, consumers receive the
 *     overridden body text instead of the seed-authored baseline.
 *   - Calling `clearPatternBodyOverride` reverts to the baseline.
 */

// ─── Internal state ───────────────────────────────────────────────────────────

const patternOverrides: Map<string, string> = new Map();

// ─── Public surface ───────────────────────────────────────────────────────────

/**
 * Set (or replace) the body override for the given `patternId`.
 */
export function setPatternBodyOverride(patternId: string, body: string): void {
  if (!patternId) return;
  patternOverrides.set(patternId, body);
}

/**
 * Returns the overridden body for the given `patternId`, or `null` if none
 * has been recorded.
 */
export function getPatternBodyOverride(patternId: string): string | null {
  return patternOverrides.get(patternId) ?? null;
}

/**
 * Returns `true` if an override has been recorded for the given `patternId`.
 */
export function hasPatternBodyOverride(patternId: string): boolean {
  return patternOverrides.has(patternId);
}

/**
 * Remove the override for the given `patternId`. No-op when none exists.
 */
export function clearPatternBodyOverride(patternId: string): void {
  patternOverrides.delete(patternId);
}

/**
 * Remove all recorded overrides.
 */
export function clearAllPatternBodyOverrides(): void {
  patternOverrides.clear();
}

/**
 * Test-only: reset the store.
 */
export function _resetForTests(): void {
  patternOverrides.clear();
}
