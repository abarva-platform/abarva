/**
 * Save-preferences in-process rate limit · W4-PR-4
 *
 * Lives outside the `'use server'` file so the synchronous reset
 * helper can be exported without violating the
 * "server actions must be async functions" Turbopack build rule.
 *
 * Keeps a per-actor sliding window of save timestamps. The action
 * rejects the (30 + 1)th save in any 60s window. Cleared between
 * tests via `__resetSavePreferencesRateLimitForTests`.
 */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;
const rateWindow = new Map<string, number[]>();

export function passRateLimit(userId: string): boolean {
  const now = Date.now();
  const arr = rateWindow.get(userId) ?? [];
  const fresh = arr.filter((t) => now - t < RATE_WINDOW_MS);
  fresh.push(now);
  rateWindow.set(userId, fresh);
  return fresh.length <= RATE_MAX;
}

export function __resetSavePreferencesRateLimitForTests(): void {
  rateWindow.clear();
}
