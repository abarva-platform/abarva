/**
 * The phase workspace must not hand a previewed review to a gate.
 *
 * `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` is a
 * server component with no render harness, so this wiring cannot be pinned
 * behaviourally — see the same problem and the same remedy in
 * `program-route-shell-enforcement`. The decision itself is pinned
 * behaviourally in `stage-readiness-review-provenance`, over the real
 * composition; what is asserted here is only that the page still routes
 * through it.
 *
 * It is worth asserting because the page is where the defect was. The
 * restoring of a superseded review's decisions is correct and is shown to the
 * reviewer; projecting that same list into `StageReadinessGateProposal`s made
 * the Charter phase read as having a complete P1-to-P2 workbook review when no
 * review of the proposal set under review existed. Removing either call below
 * reinstates that, and every other suite stays green.
 */

import fs from "node:fs";
import path from "node:path";

const PHASE_PAGE =
  "src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx";

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

describe("phase workspace keeps a previewed review out of the gate", () => {
  const src = read(PHASE_PAGE);

  it("imports both halves of the provenance reading", () => {
    expect(src).toContain(
      'from "@/lib/programs/stage-readiness-workbooks/review-provenance"',
    );
    expect(src).toContain("seedProposalsFromReviewPreview");
    expect(src).toContain("recordedDispositionsOnly");
  });

  it("seeds the previewed dispositions through the marking helper", () => {
    // Marking provenance is not optional plumbing: a hand-written `.map` that
    // copies the disposition and not where it came from is exactly the shape
    // that shipped the defect.
    expect(src).toMatch(
      /const seeded = seedProposalsFromReviewPreview\(\{\s*proposals: parsedProposals,\s*preview: reviewPreview,\s*\}\);/,
    );
  });

  it("projects gate proposals from recorded dispositions only", () => {
    expect(src).toMatch(
      /recordedDispositionsOnly\(\s*initialStageReadinessPreview\?\.proposalSet\?\.proposals,\s*\)\.map\(/,
    );
  });

  it("does not read the seeded proposal list straight into the gate projection", () => {
    // The pre-fix expression. Pinning its ABSENCE is what makes the pin above
    // more than decorative: a reader could otherwise add the helper call
    // somewhere harmless and restore the direct read beside it.
    expect(src).not.toMatch(
      /\(initialStageReadinessPreview\?\.proposalSet\?\.proposals \?\? \[\]\)\.map\(\s*\(proposal\): StageReadinessGateProposal/,
    );
  });
});
