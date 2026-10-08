/**
 * Coverage for the sentence a Moves walk step owes the reader when it fails
 * for a reason the route did not anticipate.
 *
 * Each of the five steps' catch-all arms answered
 * `{ error: "internal_error", message: <raw error text> }`. No client on the
 * walk reads `message`; every reader's ladder ends `detail || error`, so with
 * `detail` absent the screen printed the literal `internal_error` — and the
 * gate submission wrapped that token in "the phase gate is blocked", reporting
 * a crash as a verdict the gate never produced.
 *
 * These cases pin the two halves that could regress independently: that the
 * body carries a `detail` and no raw text, and that each step's sentence says
 * the thing that is true of that step and not of the others.
 */

import { MOVE_UNREADABLE_REFUSAL_DETAIL } from "@/lib/programs/move-unreadable-refusal";
import {
  readUnexpectedWalkStepFailure,
  unexpectedWalkStepDetail,
  unexpectedWalkStepFailureBody,
  type MovesWalkStep,
} from "@/lib/programs/walk-step-unexpected-failure";

const STEPS: MovesWalkStep[] = [
  "phase_capture_save",
  "phase_input_draft",
  "phase_deliverable_build",
  "phase_gate_submission",
  "phase_advance",
];

describe("the body a walk step's catch-all arm answers", () => {
  it.each(STEPS)("carries a detail the readers consume: %s", (step) => {
    const body = unexpectedWalkStepFailureBody(step);
    expect(body.error).toBe("internal_error");
    expect(body.detail).toBe(unexpectedWalkStepDetail(step));
    expect(body.detail.length).toBeGreaterThan(80);
  });

  // The raw error text was the whole of what the old body said, and it reached
  // nobody: no reader declares a `message` field, let alone renders one. It
  // belongs in the server log, which is where the call sites already put it.
  it.each(STEPS)("carries no raw error text: %s", (step) => {
    expect(
      Object.keys(unexpectedWalkStepFailureBody(step)).sort(),
    ).toStrictEqual(["detail", "error"]);
  });

  // The defect being fixed is a machine code presented as prose. A sentence
  // that reintroduces one has not fixed it.
  it.each(STEPS)("states a cause in prose, not a code: %s", (step) => {
    const detail = unexpectedWalkStepDetail(step);
    expect(detail).not.toMatch(/\b[a-z]+(?:_[a-z]+)+\b/);
    expect(detail.trimEnd()).toMatch(/\.$/);
  });

  it("says something different for every step", () => {
    const sentences = STEPS.map((step) => unexpectedWalkStepDetail(step));
    expect(new Set(sentences).size).toBe(STEPS.length);
  });
});

/**
 * The useful half of each sentence is what the reader should do next, and it
 * differs because the steps differ in what they may already have written. A
 * shared template would get at least three of the five wrong, so each claim is
 * asserted against the step it was measured for.
 */
describe("what each step's sentence can honestly claim", () => {
  // `advancePhase` commits, and two awaited calls follow it inside the same
  // `try` with no local catch — the gate decision record and the progress
  // notification. A throw in either answers 500 after the phase has moved, so
  // this sentence must not tell the reader the advance failed.
  it("does not tell an advance reader the phase did not move", () => {
    const detail = unexpectedWalkStepDetail("phase_advance");
    expect(detail).toMatch(/may already have moved/i);
    expect(detail).toMatch(/Reload the Move to see which phase it is on/i);
    expect(detail).not.toMatch(/nothing was recorded|no change was made/i);
  });

  // Without this, the client's own framing reports the crash as a refusal.
  it("denies that a failed gate submission is a gate refusal", () => {
    const detail = unexpectedWalkStepDetail("phase_gate_submission");
    expect(detail).toMatch(/gate was not evaluated/i);
    expect(detail).toMatch(/not a gate refusal/i);
  });

  // The draft route returns proposals and writes no capture value, so the one
  // thing the reader is afraid of did not happen and the sentence should say so.
  it("tells a draft reader their capture is untouched", () => {
    expect(unexpectedWalkStepDetail("phase_input_draft")).toMatch(
      /Nothing in your capture was changed/i,
    );
  });

  // The capture POST wraps the section upsert, so a throw can land either side
  // of it. Committing to either answer would be a guess.
  it("commits to neither answer on a capture save, and names what settles it", () => {
    const detail = unexpectedWalkStepDetail("phase_capture_save");
    expect(detail).toMatch(/may have been recorded and some may not/i);
    expect(detail).toMatch(/Reload this phase/i);
  });

  // The build catch-all sits around the whole enqueue loop, which queues runs
  // one at a time, so a later throw leaves the earlier ones running. A reader
  // told only "it failed" would press the button again.
  it("warns a build reader that runs may already be queued", () => {
    const detail = unexpectedWalkStepDetail("phase_deliverable_build");
    expect(detail).toMatch(/may already have been queued/i);
    expect(detail).toMatch(/before requesting another build/i);
  });
});

describe("reading an unexpected failure back off a response", () => {
  it("recognises the body its own builder produces", () => {
    expect(
      readUnexpectedWalkStepFailure(
        500,
        unexpectedWalkStepFailureBody("phase_gate_submission"),
      ),
    ).toBe(unexpectedWalkStepDetail("phase_gate_submission"));
  });

  // The predicate cannot be "has a detail": every named refusal carries one,
  // and treating those as crashes would strip the remedies they do prescribe.
  it("does not claim a named refusal, which also carries a detail", () => {
    expect(
      readUnexpectedWalkStepFailure(404, {
        error: "not_found",
        detail: MOVE_UNREADABLE_REFUSAL_DETAIL,
      }),
    ).toBeNull();
    expect(
      readUnexpectedWalkStepFailure(409, {
        error: "gate_blocked",
        detail: "A hard gate criterion is open.",
      }),
    ).toBeNull();
  });

  // A 500 from somewhere else in the stack, and a named 500 refusal that the
  // caller's own ladder already describes better than this helper could.
  it("leaves a 500 that is not this body to the caller's ladder", () => {
    expect(
      readUnexpectedWalkStepFailure(500, {
        error: "phase_build_set_unresolvable",
        detail: "Two keys in the P3 build set resolve to no spec.",
      }),
    ).toBeNull();
    expect(readUnexpectedWalkStepFailure(500, null)).toBeNull();
    expect(readUnexpectedWalkStepFailure(500, undefined)).toBeNull();
    expect(readUnexpectedWalkStepFailure(500, {})).toBeNull();
  });

  // A route still answering the old shape must not make the client render the
  // string "null" or an empty banner; `null` sends it back to its own ladder,
  // which prints the code — no worse than before this module existed.
  it("declines a 500 internal_error that carries no sentence", () => {
    expect(
      readUnexpectedWalkStepFailure(500, { error: "internal_error" }),
    ).toBeNull();
  });

  // The fixture has to carry a `detail` as well as the code, or it is answered
  // by the `detail ?? null` fallback and says nothing about the status check.
  it("does not read a success body as a failure", () => {
    const succeeded = unexpectedWalkStepFailureBody("phase_capture_save");
    expect(readUnexpectedWalkStepFailure(200, succeeded)).toBeNull();
    expect(readUnexpectedWalkStepFailure(202, succeeded)).toBeNull();
  });
});

/**
 * A source guard for the two arms that have no route harness.
 *
 * `POST .../phase-capture` and `POST .../phase-input-draft` have no
 * `__tests__` directory, and standing one up for either means mocking the
 * route's full dependency set — more than this change earns. The other three
 * arms are driven through their real routes in their own suites; these two are
 * held by shape instead, and that is weaker: it proves the defective body is
 * gone and the module is reached, not that the arm runs.
 *
 * The anchor is the DEFECT's own shape, `{ error: "internal_error", message`,
 * which the fix cannot satisfy — the new body has no `message` key at all — so
 * this cannot pass by matching its own instrumentation.
 */
describe("the walk's catch-all arms", () => {
  const ROUTES = [
    "src/app/api/v1/programs/[programId]/phase-capture/route.ts",
    "src/app/api/v1/programs/[programId]/phase-input-draft/route.ts",
    "src/app/api/v1/programs/[programId]/advance/route.ts",
    "src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts",
    "src/app/api/v1/deliverables/generate-phase/route.ts",
  ];

  function source(route: string): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs") as typeof import("node:fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("node:path") as typeof import("node:path");
    const file = path.join(process.cwd(), route);
    // A moved or renamed route would otherwise make every assertion below
    // vacuous, so fail on the read rather than on an empty string.
    expect(fs.existsSync(file)).toBe(true);
    const text = fs.readFileSync(file, "utf8");
    expect(text.length).toBeGreaterThan(0);
    return text;
  }

  it.each(ROUTES)("no longer answers with raw error text: %s", (route) => {
    expect(source(route)).not.toMatch(/error:\s*"internal_error",\s*message/);
  });

  it.each(ROUTES)("reaches the module that names the cause: %s", (route) => {
    expect(source(route)).toContain(
      "@/lib/programs/walk-step-unexpected-failure",
    );
  });
});
