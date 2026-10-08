// The browser used to stop following a phase build batch fifteen minutes after
// it started, measured once for the whole batch. That bound is shorter than the
// server's own guarantees for the SAME runs (`runs-repository.ts`: a silent
// running run is reclaimed at 15 minutes PER RUN, a queued run is explicitly not
// stuck and is only abandoned after 6 hours, because "a backlog ... can
// legitimately sit queued far longer ... before a serial worker reaches it").
//
// These cases pin both halves of the replacement: a run the server still
// considers alive keeps being followed, and when the browser does stop it says
// so rather than leaving a row claiming to be queued.

import {
  deliverableRunObservationKey,
  DELIVERABLE_RUN_POLL_BACKOFF_AFTER_MS,
  DELIVERABLE_RUN_POLL_CEILING_MS,
  DELIVERABLE_RUN_POLL_INTERVAL_MS,
  DELIVERABLE_RUN_POLL_MAX_INTERVAL_MS,
  describeDeliverableRunHandOff,
  planDeliverableRunPoll,
} from "@/lib/programs/deliverable-run-poll-plan";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

describe("planDeliverableRunPoll", () => {
  it("keeps following a run past the old fifteen-minute batch budget", () => {
    const plan = planDeliverableRunPoll({
      elapsedMs: FIFTEEN_MINUTES_MS + 1,
      unchangedMs: 0,
    });
    expect(plan).toEqual({
      kind: "poll_again",
      delayMs: DELIVERABLE_RUN_POLL_INTERVAL_MS,
    });
  });

  it("covers the server's own worst case for a six-document phase", () => {
    // Six documents, a worker that claims one run at a time, and a 15-minute
    // per-run running deadline. Anything short of that gives up on work the
    // server still considers alive.
    expect(DELIVERABLE_RUN_POLL_CEILING_MS).toBe(6 * FIFTEEN_MINUTES_MS);
    const plan = planDeliverableRunPoll({
      elapsedMs: DELIVERABLE_RUN_POLL_CEILING_MS - 1,
      unchangedMs: 0,
    });
    expect(plan.kind).toBe("poll_again");
  });

  it("polls at the base interval while a run is still visibly moving", () => {
    expect(
      planDeliverableRunPoll({
        elapsedMs: 5 * 60 * 1000,
        unchangedMs: DELIVERABLE_RUN_POLL_BACKOFF_AFTER_MS - 1,
      }),
    ).toEqual({
      kind: "poll_again",
      delayMs: DELIVERABLE_RUN_POLL_INTERVAL_MS,
    });
  });

  it("backs off a run that has not changed, rather than giving up on it", () => {
    expect(
      planDeliverableRunPoll({
        elapsedMs: 40 * 60 * 1000,
        unchangedMs: DELIVERABLE_RUN_POLL_BACKOFF_AFTER_MS,
      }),
    ).toEqual({
      kind: "poll_again",
      delayMs: DELIVERABLE_RUN_POLL_MAX_INTERVAL_MS,
    });
    expect(DELIVERABLE_RUN_POLL_MAX_INTERVAL_MS).toBeGreaterThan(
      DELIVERABLE_RUN_POLL_INTERVAL_MS,
    );
  });

  it("treats a failed READ of a run as a reason to back off once, never to stop", () => {
    const moving = planDeliverableRunPoll({
      elapsedMs: 60_000,
      unchangedMs: 0,
      lastPollFailed: true,
    });
    expect(moving).toEqual({
      kind: "poll_again",
      delayMs: DELIVERABLE_RUN_POLL_INTERVAL_MS * 2,
    });
    const stalled = planDeliverableRunPoll({
      elapsedMs: 60_000,
      unchangedMs: DELIVERABLE_RUN_POLL_BACKOFF_AFTER_MS,
      lastPollFailed: true,
    });
    expect(stalled).toEqual({
      kind: "poll_again",
      delayMs: DELIVERABLE_RUN_POLL_MAX_INTERVAL_MS * 2,
    });
  });

  it("hands off at the ceiling and never before it", () => {
    expect(
      planDeliverableRunPoll({
        elapsedMs: DELIVERABLE_RUN_POLL_CEILING_MS,
        unchangedMs: 0,
      }),
    ).toEqual({ kind: "hand_off" });
    expect(
      planDeliverableRunPoll({
        elapsedMs: DELIVERABLE_RUN_POLL_CEILING_MS + 60_000,
        unchangedMs: DELIVERABLE_RUN_POLL_BACKOFF_AFTER_MS,
        lastPollFailed: true,
      }),
    ).toEqual({ kind: "hand_off" });
  });

  it("hands off on the batch clock, not on how long one run has sat still", () => {
    // A run can sit unchanged for an hour behind a serial worker and still be
    // healthy. Only the batch clock may end the following.
    expect(
      planDeliverableRunPoll({
        elapsedMs: 60 * 60 * 1000,
        unchangedMs: 60 * 60 * 1000,
      }).kind,
    ).toBe("poll_again");
  });
});

describe("describeDeliverableRunHandOff", () => {
  const sentence = describeDeliverableRunHandOff("P3 Design");

  it("names the phase and says the work continues on the server", () => {
    expect(sentence).toContain("P3 Design");
    expect(sentence).toMatch(/still building on the server/i);
  });

  it("says nothing failed, so the reader does not read it as a build failure", () => {
    expect(sentence).toMatch(/nothing failed/i);
    expect(sentence).toMatch(/nothing was cancelled/i);
  });

  it("says a re-run starts a second batch rather than resuming this one", () => {
    expect(sentence).toMatch(/second batch/i);
    expect(sentence).toMatch(/instead of resuming/i);
  });

  it("states the window it actually stopped after", () => {
    expect(sentence).toContain(
      `${DELIVERABLE_RUN_POLL_CEILING_MS / 60_000} minutes`,
    );
  });
});

describe("deliverableRunObservationKey", () => {
  const base = {
    status: "running" as const,
    progressPct: 40,
    progressLabel: "Drafting sections",
  };

  it("reads two identical observations as no new information", () => {
    expect(deliverableRunObservationKey(base)).toBe(
      deliverableRunObservationKey({ ...base }),
    );
  });

  it("reads a status change as movement", () => {
    expect(
      deliverableRunObservationKey({ ...base, status: "queued" }),
    ).not.toBe(deliverableRunObservationKey(base));
  });

  it("reads a progress percentage change as movement", () => {
    // The case a status-only rule would miss: a run that is advancing would be
    // polled at the slow interval as though it were sitting still.
    expect(deliverableRunObservationKey({ ...base, progressPct: 41 })).not.toBe(
      deliverableRunObservationKey(base),
    );
  });

  it("reads a progress label change as movement", () => {
    expect(
      deliverableRunObservationKey({ ...base, progressLabel: "Validating" }),
    ).not.toBe(deliverableRunObservationKey(base));
  });

  it("treats a missing label as its own value, not as a match for any label", () => {
    expect(
      deliverableRunObservationKey({ ...base, progressLabel: null }),
    ).not.toBe(deliverableRunObservationKey(base));
    expect(deliverableRunObservationKey({ ...base, progressLabel: null })).toBe(
      deliverableRunObservationKey({ ...base, progressLabel: null }),
    );
  });
});
