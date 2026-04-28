/**
 * Mission state store — local in-memory completion / dismissal log.
 *
 * Holds user-driven status changes for missions derived by
 * `deriveMissionsFromInstance`. Mission ids are caller-defined and follow the
 * convention `${instanceId}:${criterionId}` — the same shape produced by the
 * derivation module so the same key round-trips through the API.
 *
 * Persistence is intentionally out of scope for this iteration: a server
 * restart wipes the map, and the client UI accepts that a page reload may
 * bring a previously completed mission back into view. This mirrors the
 * pattern used by `evidence-ingestion-store` and
 * `contradiction-resolution-state`.
 *
 * Each entry stores the ISO-8601 timestamp at which it was first marked, so
 * the per-instance "Recently completed" subsection can show *when* a mission
 * was actioned. Re-marking the same id with the same status is idempotent
 * and does NOT update the original timestamp; re-marking with a *different*
 * status overwrites both status and timestamp (so a user can flip a
 * dismissal to a completion, or vice-versa).
 *
 * Pure module: no side effects on import, no I/O. Safe to call from server
 * routes and from tests (use `_resetForTests()` to clear state between cases).
 */

export type MissionStatus = 'complete' | 'dismissed';

export interface MissionStateEntry {
  readonly status: MissionStatus;
  readonly timestamp: string;
  readonly note?: string;
}

interface InternalEntry {
  status: MissionStatus;
  timestamp: string;
  note?: string;
}

const STATE: Map<string, InternalEntry> = new Map();

/**
 * Mark a mission id with a status. Subsequent calls with the same id and
 * same status are idempotent and preserve the original timestamp. Re-marking
 * with a different status overwrites the entry (status, timestamp, note).
 */
export function setMissionState(
  id: string,
  status: MissionStatus,
  note?: string,
): void {
  if (typeof id !== 'string' || id.length === 0) return;
  if (status !== 'complete' && status !== 'dismissed') return;
  const existing = STATE.get(id);
  if (existing && existing.status === status) {
    // Idempotent: keep the original timestamp; only refresh the note when a
    // non-empty new note is supplied.
    if (typeof note === 'string' && note.length > 0) {
      existing.note = note;
    }
    return;
  }
  const entry: InternalEntry = {
    status,
    timestamp: new Date().toISOString(),
  };
  if (typeof note === 'string' && note.length > 0) {
    entry.note = note;
  }
  STATE.set(id, entry);
}

/**
 * Returns the recorded state for a mission id, or `null` if the mission has
 * not been marked. The returned object is a fresh copy — callers cannot
 * mutate the internal state.
 */
export function getMissionState(id: string): MissionStateEntry | null {
  const entry = STATE.get(id);
  if (!entry) return null;
  const copy: MissionStateEntry = entry.note !== undefined
    ? { status: entry.status, timestamp: entry.timestamp, note: entry.note }
    : { status: entry.status, timestamp: entry.timestamp };
  return copy;
}

/** Remove any recorded state for a mission id. No-op if not present. */
export function clearMissionState(id: string): void {
  STATE.delete(id);
}

/**
 * Returns the recently-actioned missions whose id starts with
 * `${instanceId}:` — i.e. those derived from the given instance — sorted
 * newest first. `limit` defaults to 3.
 */
export function getRecentMissionStates(
  instanceId: string,
  limit: number = 3,
): Array<{ id: string; status: MissionStatus; timestamp: string; note?: string }> {
  if (typeof instanceId !== 'string' || instanceId.length === 0) return [];
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) return [];
  const prefix = `${instanceId}:`;
  const matches: Array<{
    id: string;
    status: MissionStatus;
    timestamp: string;
    note?: string;
  }> = [];
  for (const [id, entry] of STATE.entries()) {
    if (!id.startsWith(prefix)) continue;
    matches.push(
      entry.note !== undefined
        ? { id, status: entry.status, timestamp: entry.timestamp, note: entry.note }
        : { id, status: entry.status, timestamp: entry.timestamp },
    );
  }
  matches.sort((a, b) => {
    if (a.timestamp === b.timestamp) {
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    }
    return a.timestamp < b.timestamp ? 1 : -1;
  });
  return matches.slice(0, safeLimit);
}

/**
 * Test-only helper: clear every recorded mission state.
 * Exposed because Jest reuses the module across test cases.
 */
export function _resetForTests(): void {
  STATE.clear();
}
