import { readFileSync } from "node:fs";
import path from "node:path";

import {
  FIRST_PHASE_READING_PRECEDING_TRANSITION,
  LAST_PHASE_READING_PRECEDING_TRANSITION,
  phaseReadsPrecedingTransitionReview,
} from "../stage-readiness-prompt-window";

const REPO_ROOT = path.resolve(__dirname, "../../../..");
const ROUTE_PATH = path.join(
  REPO_ROOT,
  "src/app/api/v1/deliverables/generate-phase/route.ts",
);
const ACCEPTED_CONTEXT_PATH = path.join(
  REPO_ROOT,
  "src/lib/programs/stage-readiness-workbooks/accepted-context.ts",
);

function routeSource(): string {
  return readFileSync(ROUTE_PATH, "utf8");
}

describe("phaseReadsPrecedingTransitionReview", () => {
  // The regression this module exists for. P1 Charter is the first
  // deliverable-generating phase, and its preceding transition is the P0 to P1
  // workbook the P0 screen offers. A window starting at P2 dropped every
  // accepted answer on it from the charter build.
  it("reads the preceding transition at P1, the first generating phase", () => {
    expect(phaseReadsPrecedingTransitionReview(1)).toBe(true);
  });

  it("pins the first reading phase at 1 rather than 2", () => {
    expect(FIRST_PHASE_READING_PRECEDING_TRANSITION).toBe(1);
    expect(FIRST_PHASE_READING_PRECEDING_TRANSITION).not.toBe(2);
  });

  // P0 has no preceding transition at all: its review would sit at
  // sourcePhase -1, which the artifact lookup refuses. Excluding it is correct,
  // not an off-by-one in the other direction.
  it("does not read a preceding transition at P0", () => {
    expect(phaseReadsPrecedingTransitionReview(0)).toBe(false);
  });

  it("still reads every transition P2 through P5", () => {
    for (const phase of [2, 3, 4, 5]) {
      expect(phaseReadsPrecedingTransitionReview(phase)).toBe(true);
    }
  });

  it("stops above the last Moves phase", () => {
    expect(LAST_PHASE_READING_PRECEDING_TRANSITION).toBe(5);
    expect(phaseReadsPrecedingTransitionReview(6)).toBe(false);
    expect(phaseReadsPrecedingTransitionReview(12)).toBe(false);
  });

  it("refuses a negative or non-integer phase", () => {
    for (const phase of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(phaseReadsPrecedingTransitionReview(phase)).toBe(false);
    }
  });

  // Non-vacuity: a predicate that answered the same thing for every phase would
  // satisfy any one case above. Assert it actually discriminates.
  it("discriminates across the phase range", () => {
    const answers = [0, 1, 2, 3, 4, 5, 6].map((phase) =>
      phaseReadsPrecedingTransitionReview(phase),
    );
    expect(answers.filter(Boolean).length).toBeGreaterThan(0);
    expect(answers.filter((answer) => !answer).length).toBeGreaterThan(0);
  });

  // The window's lower bound is only correct if the review it names is actually
  // loadable. `findStageReadinessReviewArtifact` derives sourcePhase =
  // targetPhase - 1 and refuses a negative one, so the first reading phase must
  // leave a non-negative source phase.
  it("names a transition whose source phase the artifact lookup accepts", () => {
    const sourcePhase = FIRST_PHASE_READING_PRECEDING_TRANSITION - 1;
    expect(sourcePhase).toBeGreaterThanOrEqual(0);
    expect(readFileSync(ACCEPTED_CONTEXT_PATH, "utf8")).toContain(
      "if (sourcePhase < 0) return null",
    );
  });
});

describe("the generate-phase route's prompt window", () => {
  // The wiring hop. The module can be correct and unused: the orchestrated
  // build path has exactly one stage-readiness prompt injection, and if the
  // route keeps its own literal window this fix changes nothing on the live
  // path. Anchored on the exported NAME so nothing re-types the comparison.
  it("is decided by the shared predicate", () => {
    const source = routeSource();
    expect(source).toContain(
      'from "@/lib/programs/stage-readiness-prompt-window"',
    );
    expect(source).toContain("phaseReadsPrecedingTransitionReview(phase)");
  });

  it("no longer carries its own phase-2 lower bound", () => {
    expect(routeSource()).not.toContain("phase >= 2 && phase <= 5");
  });
});
