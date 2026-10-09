// The sentence a phase build owes the reader when nothing reached the queue.
//
// The defect these pin is an ABSENCE: the `queued === 0` exit of
// `POST /api/v1/deliverables/generate-phase` carried no `error` and no
// `detail`, so `PhaseApproveAndBuild`'s ladder
// (`describeRequiredEvidenceRefusal ?? detail ?? error ?? "HTTP " + status`)
// printed `HTTP 500`. So these assert what the reader is TOLD, not only that a
// refusal happened — the route's own pre-existing case for this exit asserted
// `res.status === 500` and nothing else, which is why the absence survived.

import {
  PHASE_BUILD_ENQUEUE_OUTCOMES,
  PHASE_BUILD_ENQUEUE_WRITE_STATE,
  PHASE_BUILD_NOT_QUEUED_ERROR,
  phaseBuildNotQueuedRefusal,
  type PhaseBuildEnqueueOutcome,
} from "@/lib/programs/phase-build-enqueue-refusal";

// The ladder `PhaseApproveAndBuild` runs on a non-OK build response. Written
// out here rather than imported, because reading it off the component under
// proof would let the component drop `detail` and stay green.
function whatTheReaderSees(
  status: number,
  body: { detail?: string; error?: string },
): string {
  return body.detail ?? body.error ?? `HTTP ${status}`;
}

describe("the refusal every enqueue outcome produces", () => {
  it("covers both declared outcomes and no others", () => {
    expect([...PHASE_BUILD_ENQUEUE_OUTCOMES].sort()).toEqual([
      "accepted_without_runs",
      "every_attempt_failed",
    ]);
    // The write-state map is a Record over the union, so these two rosters
    // cannot drift apart without a compile error.
    expect(Object.keys(PHASE_BUILD_ENQUEUE_WRITE_STATE).sort()).toEqual(
      [...PHASE_BUILD_ENQUEUE_OUTCOMES].sort(),
    );
  });

  it.each(PHASE_BUILD_ENQUEUE_OUTCOMES)(
    "gives %s a sentence the reader's ladder reaches before HTTP 500",
    (outcome) => {
      const body = phaseBuildNotQueuedRefusal({
        phase: 2,
        attempted: 4,
        outcome,
      });
      expect(body.error).toBe(PHASE_BUILD_NOT_QUEUED_ERROR);
      const seen = whatTheReaderSees(500, body);
      expect(seen).toBe(body.detail);
      expect(seen).not.toBe("HTTP 500");
      // Neither the machine code nor a bare status may be what gets rendered.
      expect(seen).not.toContain(PHASE_BUILD_NOT_QUEUED_ERROR);
      expect(seen).not.toMatch(/HTTP \d/);
      // A sentence, not a token.
      expect(seen.split(" ").length).toBeGreaterThan(12);
    },
  );

  it("names the number of documents it tried, per outcome", () => {
    for (const outcome of PHASE_BUILD_ENQUEUE_OUTCOMES) {
      expect(
        phaseBuildNotQueuedRefusal({ phase: 4, attempted: 6, outcome }).detail,
      ).toContain("6 documents");
      const one = phaseBuildNotQueuedRefusal({
        phase: 4,
        attempted: 1,
        outcome,
      }).detail;
      expect(one).toContain("1 document");
      expect(one).not.toContain("1 documents");
    }
  });

  it("names the phase it refused, per outcome", () => {
    for (const outcome of PHASE_BUILD_ENQUEUE_OUTCOMES) {
      expect(
        phaseBuildNotQueuedRefusal({ phase: 5, attempted: 2, outcome }).detail,
      ).toContain("P5");
      expect(
        phaseBuildNotQueuedRefusal({ phase: 1, attempted: 2, outcome }).detail,
      ).not.toContain("P5");
    }
  });
});

describe("each outcome claims only what its own path can have written", () => {
  const detailFor = (outcome: PhaseBuildEnqueueOutcome) =>
    phaseBuildNotQueuedRefusal({ phase: 3, attempted: 4, outcome }).detail;

  it("says nothing landed only where the writes are known not to have landed", () => {
    // Every per-document insert threw, so no run row exists: the reader may
    // safely press the control again.
    expect(PHASE_BUILD_ENQUEUE_WRITE_STATE.every_attempt_failed).toBe(
      "nothing_landed",
    );
    const detail = detailFor("every_attempt_failed");
    expect(detail).toContain("Nothing was generated and nothing is running");
    expect(detail).toContain("cannot duplicate work");
    expect(detail).toContain("Run Approve & Build once more");
  });

  it("does not claim nothing landed where the batch reported success", () => {
    // The batch call returned WITHOUT throwing and still yielded no run, so
    // rows may exist. Claiming "nothing was queued" here invites a second
    // batch on top of a running one.
    expect(PHASE_BUILD_ENQUEUE_WRITE_STATE.accepted_without_runs).toBe(
      "cannot_know",
    );
    const detail = detailFor("accepted_without_runs");
    expect(detail).toContain("cannot be read from here");
    expect(detail).toContain("check its document list before running");
    expect(detail).not.toContain("Nothing was generated");
    expect(detail).not.toContain("cannot duplicate work");
  });

  it("gives the two paths different sentences and different remedies", () => {
    const failed = detailFor("every_attempt_failed");
    const accepted = detailFor("accepted_without_runs");
    expect(failed).not.toBe(accepted);
    // The separating instruction: retry straight away vs. look first.
    expect(failed).toMatch(/once more/);
    expect(accepted).toMatch(/Reload this phase/);
    expect(failed).not.toMatch(/Reload this phase/);
  });

  it("sends nobody back into the capture it cannot fix", () => {
    // Every OTHER refusal this route gives names something the reader controls
    // — capture, evidence, an unapproved option — so "go and edit the Move" is
    // the trained next move and the wrong one here.
    expect(detailFor("every_attempt_failed")).toContain(
      "nothing in the capture needs changing",
    );
    for (const outcome of PHASE_BUILD_ENQUEUE_OUTCOMES) {
      expect(detailFor(outcome)).not.toMatch(
        /upload|approve the extraction|answer the remaining/i,
      );
    }
  });
});
