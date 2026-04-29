/**
 * Contradiction resolution state — local in-memory ring buffer
 *
 * Holds the set of contradiction ids that have been "marked resolved" by a
 * user from a Source or Programs detail page. Persistence is intentionally
 * out of scope for this iteration: a server restart wipes the set, and the
 * client UI accepts that a page reload may bring a previously dismissed
 * contradiction back into view.
 *
 * Contradiction ids are caller-defined strings. The convention used by the
 * UI wiring is `{instanceId}::{templateId}` so the same template detected on
 * two instances can be resolved independently.
 *
 * Each resolution also stores the ISO-8601 timestamp at which it was first
 * marked, so the per-instance event timeline can show *when* a contradiction
 * was resolved. Re-marking the same id is idempotent and does NOT update
 * the original timestamp — the first resolution wins.
 */

const RESOLVED: Map<string, string> = new Map();

/**
 * Pluggable persistence backend. Implementations are write-only and
 * best-effort — callers do not await them and failures are swallowed by the
 * dispatch site. The default (no backend installed) preserves the original
 * in-memory-only semantics.
 */
export interface ContradictionResolutionBackend {
  /** Persist that a contradiction id was marked resolved at the given ts. */
  mark(id: string, timestamp: string): Promise<void>;
  /** Persist a clear of all resolved-state rows (test-only / admin use). */
  clearAll(): Promise<void>;
}

let activeBackend: ContradictionResolutionBackend | null = null;

/**
 * Install a write-through backend for contradiction resolution persistence.
 * Pass `null` to restore the default in-memory-only behavior.
 */
export function setContradictionResolutionBackend(
  backend: ContradictionResolutionBackend | null,
): void {
  activeBackend = backend;
}

/** Read the currently-installed backend (mostly for tests + diagnostics). */
export function getContradictionResolutionBackend(): ContradictionResolutionBackend | null {
  return activeBackend;
}

/**
 * Mark a contradiction id as resolved. Subsequent calls with the same id
 * are idempotent and preserve the original resolution timestamp.
 */
export function markResolved(id: string): void {
  if (typeof id !== 'string' || id.length === 0) return;
  if (RESOLVED.has(id)) return;
  const timestamp = new Date().toISOString();
  RESOLVED.set(id, timestamp);
  if (activeBackend) {
    void activeBackend.mark(id, timestamp).catch(() => {});
  }
}

/**
 * Returns true if the contradiction id has been marked resolved.
 */
export function isResolved(id: string): boolean {
  return RESOLVED.has(id);
}

/**
 * Returns a snapshot of all currently-resolved contradiction ids in the
 * order they were inserted.
 */
export function getResolved(): string[] {
  return Array.from(RESOLVED.keys());
}

/**
 * Returns the ISO-8601 timestamp at which the given id was first marked
 * resolved, or `undefined` if it is not in the resolved set.
 */
export function getResolvedAt(id: string): string | undefined {
  return RESOLVED.get(id);
}

/**
 * Returns a snapshot of every resolved id paired with its resolution
 * timestamp, in insertion order. Returns a fresh array so callers cannot
 * mutate the internal state.
 */
export function getResolvedEntries(): ReadonlyArray<{ id: string; resolvedAt: string }> {
  return Array.from(RESOLVED.entries()).map(([id, resolvedAt]) => ({ id, resolvedAt }));
}

/**
 * Test-only: clear the resolved set. Not part of the public surface.
 */
export function _resetForTests(): void {
  RESOLVED.clear();
  activeBackend = null;
}
