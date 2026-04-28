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
 */

const RESOLVED: Set<string> = new Set();

/**
 * Mark a contradiction id as resolved. Subsequent calls with the same id
 * are idempotent.
 */
export function markResolved(id: string): void {
  if (typeof id !== 'string' || id.length === 0) return;
  RESOLVED.add(id);
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
  return Array.from(RESOLVED);
}

/**
 * Test-only: clear the resolved set. Not part of the public surface.
 */
export function _resetForTests(): void {
  RESOLVED.clear();
}
