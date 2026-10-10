import 'server-only';

// Source vendor portal — sign-in backoff.
//
// THIS MODULE DELIBERATELY CANNOT LOCK AN ACCOUNT.
//
// The credential is shared by everyone working the bid at one vendor. A lockout
// on repeated failures would let one person's typo — or a competitor who learned
// a username — remove a bidder from a live, time-boxed procurement. Exclusion by
// accident is a fairness failure, and it is worse than a slow retry.
//
// So: delay grows, access never closes, and sustained failure raises an internal
// alert instead of a door.

export interface AttemptState {
  failures: number;
  firstFailureAt: number;
  lastFailureAt: number;
}

/** Delay before the next attempt is accepted, in milliseconds. Capped. */
export function backoffMs(failures: number): number {
  if (failures <= 3) return 0;
  const step = Math.min(failures - 3, 8);
  return Math.min(2 ** step * 250, 30_000);
}

/** Failure count at which we tell OURSELVES something is wrong. Never blocks the vendor. */
export const ALERT_AFTER_FAILURES = 12;

export function shouldAlertInternally(state: AttemptState): boolean {
  return state.failures >= ALERT_AFTER_FAILURES;
}

export function nextAttemptAllowedAt(state: AttemptState): number {
  return state.lastFailureAt + backoffMs(state.failures);
}

export function isThrottled(state: AttemptState, now: number = Date.now()): boolean {
  return now < nextAttemptAllowedAt(state);
}

export function recordFailure(prev: AttemptState | null, now: number = Date.now()): AttemptState {
  if (!prev) return { failures: 1, firstFailureAt: now, lastFailureAt: now };
  // A long quiet period resets the window — a vendor returning the next morning
  // should not inherit yesterday's backoff.
  if (now - prev.lastFailureAt > 3_600_000) {
    return { failures: 1, firstFailureAt: now, lastFailureAt: now };
  }
  return { failures: prev.failures + 1, firstFailureAt: prev.firstFailureAt, lastFailureAt: now };
}
