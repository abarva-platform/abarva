/**
 * Alert acknowledgment state — local in-memory acknowledgment / dismissal log.
 *
 * Holds user-driven status changes for portfolio alerts produced by
 * `buildPortfolioAlerts()`. Alert ids are caller-defined strings and follow
 * the convention `${kind}::${instanceId}[::${sourceId}]` — the same shape
 * produced by the alert builder so the same key round-trips through the API.
 *
 * Persistence is intentionally out of scope for the in-memory default: a
 * server restart wipes the map, and the client UI accepts that a page reload
 * may bring a previously dismissed alert back into view. This mirrors the
 * pattern used by `mission-state-store` and `contradiction-resolution-state`.
 *
 * Each entry stores the ISO-8601 timestamp at which it was first marked, so a
 * "Recently acknowledged/dismissed" subsection can show *when* an alert was
 * actioned. Re-marking the same id with the same status is idempotent and
 * does NOT update the original timestamp; re-marking with a *different*
 * status overwrites both status and timestamp (so a user can flip a
 * dismissal to an acknowledgment, or vice-versa).
 *
 * Pure module: no side effects on import, no I/O. Safe to call from server
 * routes and from tests (use `_resetForTests()` to clear state between cases).
 */

export type AlertStatus = 'acknowledged' | 'dismissed';

export interface AlertStateEntry {
  readonly status: AlertStatus;
  readonly timestamp: string;
  readonly note?: string;
}

interface InternalEntry {
  status: AlertStatus;
  timestamp: string;
  note?: string;
}

const STATE: Map<string, InternalEntry> = new Map();

/**
 * Pluggable persistence backend. Implementations should treat both methods
 * as write-only and idempotent — callers do not await them and do not surface
 * errors. The default (no backend installed) preserves the in-memory-only
 * behavior the module ships with.
 */
export interface AlertAcknowledgmentBackend {
  /** Persist a freshly-marked alert state. */
  write(state: {
    id: string;
    status: AlertStatus;
    timestamp: string;
    note?: string;
  }): Promise<void>;
  /** Persist a clear/delete for an alert id. */
  clear(id: string): Promise<void>;
}

let activeBackend: AlertAcknowledgmentBackend | null = null;

/**
 * Install a write-through backend for alert-acknowledgment persistence. Pass
 * `null` to restore the default in-memory-only behavior.
 */
export function setAlertAcknowledgmentBackend(
  backend: AlertAcknowledgmentBackend | null,
): void {
  activeBackend = backend;
}

/** Read the currently-installed backend (mostly for tests + diagnostics). */
export function getAlertAcknowledgmentBackend(): AlertAcknowledgmentBackend | null {
  return activeBackend;
}

/**
 * Mark an alert id with a status. Subsequent calls with the same id and same
 * status are idempotent and preserve the original timestamp. Re-marking with
 * a different status overwrites the entry (status, timestamp, note).
 */
export function setAlertState(
  id: string,
  status: AlertStatus,
  note?: string,
): void {
  if (typeof id !== 'string' || id.length === 0) return;
  if (status !== 'acknowledged' && status !== 'dismissed') return;
  const existing = STATE.get(id);
  if (existing && existing.status === status) {
    // Idempotent: keep the original timestamp; only refresh the note when a
    // non-empty new note is supplied.
    if (typeof note === 'string' && note.length > 0) {
      existing.note = note;
      if (activeBackend) {
        const payload = {
          id,
          status: existing.status,
          timestamp: existing.timestamp,
          note: existing.note,
        };
        void activeBackend.write(payload).catch(() => {});
      }
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
  if (activeBackend) {
    const payload: {
      id: string;
      status: AlertStatus;
      timestamp: string;
      note?: string;
    } = {
      id,
      status: entry.status,
      timestamp: entry.timestamp,
    };
    if (entry.note !== undefined) {
      payload.note = entry.note;
    }
    void activeBackend.write(payload).catch(() => {});
  }
}

/**
 * Returns the recorded state for an alert id, or `null` if the alert has not
 * been actioned. The returned object is a fresh copy — callers cannot mutate
 * the internal state.
 */
export function getAlertState(id: string): AlertStateEntry | null {
  const entry = STATE.get(id);
  if (!entry) return null;
  const copy: AlertStateEntry = entry.note !== undefined
    ? { status: entry.status, timestamp: entry.timestamp, note: entry.note }
    : { status: entry.status, timestamp: entry.timestamp };
  return copy;
}

/** Remove any recorded state for an alert id. No-op if not present. */
export function clearAlertState(id: string): void {
  if (typeof id !== 'string' || id.length === 0) return;
  STATE.delete(id);
  if (activeBackend) {
    void activeBackend.clear(id).catch(() => {});
  }
}

/**
 * Returns the most-recently-actioned alerts across every instance, sorted
 * newest first. `limit` defaults to 3.
 */
export function getRecentAlertStates(
  limit: number = 3,
): Array<{ id: string; status: AlertStatus; timestamp: string; note?: string }> {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) return [];
  const matches: Array<{
    id: string;
    status: AlertStatus;
    timestamp: string;
    note?: string;
  }> = [];
  for (const [id, entry] of STATE.entries()) {
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
 * Test-only helper: clear every recorded alert state and remove any installed
 * backend. Exposed because Jest reuses the module across test cases.
 */
export function _resetForTests(): void {
  STATE.clear();
  activeBackend = null;
}
