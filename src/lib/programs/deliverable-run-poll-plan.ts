// deliverable-run-poll-plan.ts
//
// Decide, for ONE in-flight deliverable run, whether the browser should poll it
// again — and what to say if it stops.
//
// Why this is its own module rather than two comparisons inside the phase build
// component: the component used to hold a single `MAX_MS = 15 minutes` budget,
// started once per batch, and silently stopped rescheduling every still-pending
// run once it expired. That bound contradicts the server's own run model, which
// the queue repository documents directly:
//
//   • a claimed run is only reclaimed when its heartbeat goes quiet for the
//     RUNNING deadline (15 minutes PER RUN — `sweepStaleDeliverableRuns`), and
//   • a queued run is explicitly NOT treated as stuck. `runs-repository.ts` says
//     a backlog "can legitimately sit queued far longer than deadlineMinutes
//     before a serial worker reaches it", and only abandons it after 6 hours.
//
// So the server guarantees every run reaches a terminal status, on bounds far
// longer than fifteen minutes — and a phase batch routinely needs them. P3 and
// P4 each declare six documents, P3's are enqueued as a strict dependency chain
// (`createSequentialDeliverableRunBatch`), and the worker claims ONE run at a
// time, so the sixth document cannot start until the first five have persisted.
// A batch-wide fifteen-minute budget therefore expires mid-build in the normal
// case, not the pathological one.
//
// Stopping early is not a harmless economy: the component's pending rows freeze
// reading "Queued", its settle effect never fires (so the phase gate approval
// the batch exists to feed is never submitted), and its in-flight guard keeps
// fresh server artifacts from repairing the view. The budget must therefore
// (a) be generous enough to cover the server's own worst case for a phase, and
// (b) when it IS reached, hand off honestly instead of leaving a row claiming to
// be queued under a status line that says to keep the page open.

/** Base interval while a run is still visibly moving. */
export const DELIVERABLE_RUN_POLL_INTERVAL_MS = 4_000;

/**
 * Ceiling interval for a run that has not changed. A run can legitimately sit
 * queued for a long time behind a serial worker; polling it every four seconds
 * for an hour is ~900 requests for no new information.
 */
export const DELIVERABLE_RUN_POLL_MAX_INTERVAL_MS = 20_000;

/** Unchanged for this long ⇒ poll at the ceiling interval. */
export const DELIVERABLE_RUN_POLL_BACKOFF_AFTER_MS = 60_000;

/**
 * How long the browser follows a batch before handing it back to the server.
 *
 * Derived from the server's numbers rather than guessed: a phase declares at
 * most six documents (`PHASE_CANONICAL_KEYS` P3/P4), the worker runs them one at
 * a time, and a single run is only given up on after the 15-minute RUNNING
 * deadline. Six times that deadline is the server's own worst case for a phase
 * batch, so anything shorter gives up on work the server still considers alive.
 */
export const DELIVERABLE_RUN_POLL_CEILING_MS = 6 * 15 * 60 * 1000;

/** The part of a run's status response that says whether anything has moved. */
export type DeliverableRunObservation = {
  status: "queued" | "running";
  progressPct: number;
  progressLabel: string | null;
};

/**
 * Fingerprint of what a poll observed. Two consecutive polls with the same
 * fingerprint told the browser nothing new, which is what the back-off keys on —
 * so the rule for "did anything move" lives here rather than inline at the call
 * site, where a half-rule (status only, say) would read as a working back-off
 * while a run that is advancing its percentage gets polled at the slow interval.
 */
export function deliverableRunObservationKey(
  observation: DeliverableRunObservation,
): string {
  return [
    observation.status,
    observation.progressPct,
    observation.progressLabel ?? "",
  ].join("|");
}

export type DeliverableRunPollPlan =
  | { kind: "poll_again"; delayMs: number }
  | { kind: "hand_off" };

/**
 * The hand-off sentence. It has to say three true things, because each one is a
 * decision the reader cannot make without it: the build did not fail, it is
 * still the server's work, and re-running starts a second batch rather than
 * resuming this one (the enqueue route mints a fresh attempt id per request).
 */
export function describeDeliverableRunHandOff(phaseLabel: string): string {
  return (
    `${phaseLabel} is still building on the server. This page stopped following it ` +
    `after ${Math.round(DELIVERABLE_RUN_POLL_CEILING_MS / 60_000)} minutes — ` +
    `nothing failed and nothing was cancelled. Reopen the phase to pick up the ` +
    `finished documents. Re-running the build starts a second batch instead of ` +
    `resuming this one.`
  );
}

export function planDeliverableRunPoll(args: {
  /** Time since this batch was started. */
  elapsedMs: number;
  /** Time since this run's observable state (status/progress/label) changed. */
  unchangedMs: number;
  /**
   * The previous poll did not return a usable status (network/5xx). Back off
   * once rather than hammering, but never treat it as a reason to stop: the run
   * itself is unaffected by a failed read of it.
   */
  lastPollFailed?: boolean;
}): DeliverableRunPollPlan {
  if (args.elapsedMs >= DELIVERABLE_RUN_POLL_CEILING_MS) {
    return { kind: "hand_off" };
  }
  const base =
    args.unchangedMs >= DELIVERABLE_RUN_POLL_BACKOFF_AFTER_MS
      ? DELIVERABLE_RUN_POLL_MAX_INTERVAL_MS
      : DELIVERABLE_RUN_POLL_INTERVAL_MS;
  return {
    kind: "poll_again",
    delayMs: args.lastPollFailed ? base * 2 : base,
  };
}
