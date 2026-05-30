/**
 * Per-actor invite rate limit — PRE-W4-PR-1.
 *
 * In-memory sliding-window limiter that caps a single actor at
 * 10 invitations per 60 seconds. Defense against accidental spam
 * (someone holding down "Send"), automated runs, and a compromised
 * session firing a burst of organization invitations before the
 * incident is detected.
 *
 * Storage: module-local Map. This is per-process, so behind a
 * multi-instance deploy (Vercel / Fluid) the limit applies per
 * function instance, not globally. That is intentional for PRE-W4:
 *
 *   - Worst case: 10 × N instances allowed before the limit fires.
 *   - Clerk has its own backend rate limit that catches the global
 *     case. The Clerk API throws `Too Many Requests` once the upstream
 *     ceiling is hit — the server action surfaces that error to the
 *     dialog as `rate_limited`.
 *   - A global limit (Redis / a `rate_limit` table) is the right
 *     next step. Tracked as TODO below.
 *
 * NEVER swap the in-memory store with a persistent table until the
 * write path is also audited — accidentally giving every invite path
 * write access to a new `rate_limit` table would erode the broker
 * boundary.
 *
 * TODO(W5+): replace with a `rate_limit` table or Redis-backed
 * sliding window once the broker layer exposes a sanctioned key/value
 * store. The current sentinel return shape is forward-compatible.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

/**
 * actorUserId → timestamps of recent invitation calls (ms). Trimmed on
 * every lookup; entries older than `WINDOW_MS` are evicted.
 */
const RECENT_INVITES = new Map<string, number[]>();

export interface RateLimitDecision {
  allowed: boolean;
  /** Remaining invitations the actor can fire in this window. */
  remaining: number;
  /** ms until the oldest tracked invite ages out of the window. 0 when allowed. */
  retryInMs: number;
}

/**
 * Returns `allowed: false` once the actor has fired
 * `MAX_PER_WINDOW` invites in the trailing `WINDOW_MS`. On `allowed:
 * true` the timestamp is recorded; on `allowed: false` it is not — the
 * blocked call does not extend the rate-limit window.
 */
export function checkInviteRateLimit(actorUserId: string): RateLimitDecision {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const prev = RECENT_INVITES.get(actorUserId) ?? [];
  const trimmed = prev.filter((t) => t > cutoff);

  if (trimmed.length >= MAX_PER_WINDOW) {
    const oldest = trimmed[0]!;
    RECENT_INVITES.set(actorUserId, trimmed);
    return {
      allowed: false,
      remaining: 0,
      retryInMs: Math.max(0, oldest + WINDOW_MS - now),
    };
  }

  trimmed.push(now);
  RECENT_INVITES.set(actorUserId, trimmed);
  return {
    allowed: true,
    remaining: MAX_PER_WINDOW - trimmed.length,
    retryInMs: 0,
  };
}

/**
 * Test-only helper. Resets the in-memory store so tests don't bleed
 * counters across cases. NEVER call from production code paths.
 */
export function __resetInviteRateLimitForTests(): void {
  RECENT_INVITES.clear();
}
