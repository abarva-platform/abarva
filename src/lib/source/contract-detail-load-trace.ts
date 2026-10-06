/**
 * Timing for the contract-detail read, per stage.
 *
 * Contract detail has been observed taking 50–90 seconds signed in (backlog
 * A9), and the only thing named "performance" in this area tests string
 * formatting. So the load had no instrument at all, and A9 asks for one first:
 * *measured p50/p95, budget agreed and met*. A budget cannot be agreed against
 * a number nobody has.
 *
 * The read resolves a contract through a six-rung fallback ladder, each rung
 * guarded on the previous one finding nothing. A contract present on the
 * primary read costs one round trip; a contract missing from it pays for every
 * rung, and the third rung loads the whole portfolio to resolve one header.
 * Which rung answered therefore matters as much as the total, because the same
 * endpoint has two very different cost profiles and an average over both
 * describes neither.
 *
 * This records durations and which rung answered. It changes no resolution
 * behaviour and carries no tenant data: span names are fixed literals chosen
 * by the caller, and the values are milliseconds.
 */
export type LoadSpan = { name: string; ms: number };

export type LoadTraceSummary = {
  totalMs: number;
  resolvedBy: string | null;
  spans: readonly LoadSpan[];
};

export type LoadTrace = {
  /** Times `run` and records it under `name`, returning whatever it returns. */
  step<T>(name: string, run: () => Promise<T>): Promise<T>;
  /** Records which stage actually produced the contract. */
  resolved(name: string): void;
  spans(): readonly LoadSpan[];
  resolvedBy(): string | null;
  totalMs(): number;
  /**
   * A `Server-Timing` header value, so a signed-in walk can read the profile
   * off the response it already fetches rather than needing a profiler.
   */
  serverTiming(): string;
  summary(): LoadTraceSummary;
};

/**
 * `Server-Timing` names are tokens: no spaces, no separators. A name that
 * needed sanitising would otherwise emit a header the browser drops silently,
 * which is a measurement that reports nothing while appearing to work.
 */
function timingToken(name: string): string {
  const token = name.replace(/[^A-Za-z0-9_-]/g, "-").replace(/-{2,}/g, "-");
  return token.length > 0 ? token : "span";
}

const round = (ms: number): number => Math.round(ms * 10) / 10;

export function createLoadTrace(
  now: () => number = () => performance.now(),
): LoadTrace {
  const spans: LoadSpan[] = [];
  let resolvedBy: string | null = null;

  return {
    async step<T>(name: string, run: () => Promise<T>): Promise<T> {
      const started = now();
      try {
        return await run();
      } finally {
        // Recorded in `finally`, so a stage that throws still reports what it
        // spent. A stage whose cost vanishes on failure is the one you most
        // want to see.
        spans.push({ name, ms: round(now() - started) });
      }
    },
    resolved(name: string) {
      // First writer wins: the ladder stops at the rung that answers, and a
      // later mark would overwrite the true answer with a subsequent stage.
      if (resolvedBy === null) resolvedBy = name;
    },
    spans: () => spans.slice(),
    resolvedBy: () => resolvedBy,
    totalMs: () => round(spans.reduce((sum, span) => sum + span.ms, 0)),
    serverTiming() {
      const parts = spans.map(
        (span) => `${timingToken(span.name)};dur=${span.ms}`,
      );
      if (resolvedBy) parts.push(`resolved-by-${timingToken(resolvedBy)};dur=0`);
      return parts.join(", ");
    },
    summary() {
      return {
        totalMs: this.totalMs(),
        resolvedBy,
        spans: spans.slice(),
      };
    },
  };
}
