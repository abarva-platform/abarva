/**
 * A restoration the reviewer cannot see is, to them, a loss.
 *
 * `carryForwardStageReadinessDecisions` keeps the decisions a human already
 * made when a corrected workbook is uploaded again — but only at submit time.
 * The phase workspace seeds a stored review onto the screen only when that
 * review belongs to the current proposal set, and a re-upload mints a new one,
 * so the reviewer opens the page to every response undecided and re-judges all
 * of them. These cases pin the reading that shows the restoration first.
 *
 * These cases live in `src/lib/programs/__tests__` because that directory is
 * directory-swept by a required status check; the module's own siblings in
 * `stage-readiness-workbooks/__tests__` are not.
 */

/** Exactly the shape the reading consumes, which is less than the loader returns. */
type StoredReview = NonNullable<
  Parameters<typeof previewStageReadinessStoredReview>[0]["storedReview"]
>;
import { readFileSync } from "node:fs";

import {
  previewStageReadinessStoredReview,
  type StageReadinessPreviewProposal,
} from "@/lib/programs/stage-readiness-workbooks/review-preview";

function proposal(
  overrides: Partial<StageReadinessPreviewProposal> = {},
): StageReadinessPreviewProposal {
  return {
    proposalId: "second-upload-row-1",
    questionId: "q_data_quality_confirm_currency",
    response: "Yes, current as of the September extract.",
    context: "Checked with the data owner.",
    evidenceOrSource: "Existing evidence: 4b1e",
    answerState: "answered",
    ...overrides,
  };
}

/** A stored review of an EARLIER upload: same answer text, different ids. */
function supersededReview(
  overrides: Record<string, unknown> = {},
): StoredReview {
  return {
    kind: "superseded_set",
    proposals: [
      {
        proposalId: "first-upload-row-1",
        disposition: "accepted",
        questionId: "q_data_quality_confirm_currency",
        response: "Yes, current as of the September extract.",
        context: "Checked with the data owner.",
        evidenceOrSource: "Existing evidence: 4b1e",
        ...overrides,
      },
    ],
  };
}

describe("previewStageReadinessStoredReview", () => {
  it("shows nothing when no review is stored", () => {
    expect(
      previewStageReadinessStoredReview({
        proposals: [proposal()],
        storedReview: null,
      }),
    ).toEqual({
      dispositionByProposalId: {},
      restoredFromPriorUploadCount: 0,
      source: "none",
    });
  });

  it("treats a review holding no decisions as no review at all", () => {
    // Otherwise the surface reports "review recorded · 0 accepted" for an
    // artifact that recorded nothing, and the reviewer is told their workbook
    // was judged when it was not.
    expect(
      previewStageReadinessStoredReview({
        proposals: [proposal()],
        storedReview: { kind: "current_set", proposals: [] },
      }).source,
    ).toBe("none");
  });

  it("seeds a review of the current set by proposal id, and calls none of it restored", () => {
    // This is the reading the surface already had. It must not start
    // announcing a restoration for decisions it has always displayed.
    const preview = previewStageReadinessStoredReview({
      proposals: [proposal({ proposalId: "row-1" })],
      storedReview: {
        kind: "current_set",
        proposals: [{ proposalId: "row-1", disposition: "needs_validation" }],
      },
    });
    expect(preview.dispositionByProposalId).toEqual({
      "row-1": "needs_validation",
    });
    expect(preview.restoredFromPriorUploadCount).toBe(0);
    expect(preview.source).toBe("current_set");
  });

  it("restores a decision from an earlier upload onto the row that carries the same answer", () => {
    // The whole point: no id is shared across uploads, so an id-keyed reading
    // finds nothing here and the reviewer is shown an undecided row.
    const preview = previewStageReadinessStoredReview({
      proposals: [proposal()],
      storedReview: supersededReview(),
    });
    expect(preview.dispositionByProposalId).toEqual({
      "second-upload-row-1": "accepted",
    });
    expect(preview.restoredFromPriorUploadCount).toBe(1);
    expect(preview.source).toBe("prior_upload");
  });

  it.each([
    ["the response", { response: "No longer current." }],
    ["the context", { context: "Re-checked against the October extract." }],
    ["the named source", { evidenceOrSource: "Interview record, 3 October" }],
    ["the question", { questionId: "q_data_quality_name_owner" }],
  ])("withholds the decision when %s changed", (_label, overrides) => {
    // An edited answer is a new answer and must be judged again. `context` is
    // in this list on purpose: it is a column a human fills in, and a caller
    // that drops it would restore decisions against text nobody reviewed.
    const preview = previewStageReadinessStoredReview({
      proposals: [proposal(overrides)],
      storedReview: supersededReview(),
    });
    expect(preview.dispositionByProposalId).toEqual({});
    expect(preview.source).toBe("none");
  });

  it("restores nothing when the same answer was judged two different ways", () => {
    const preview = previewStageReadinessStoredReview({
      proposals: [proposal()],
      storedReview: {
        kind: "superseded_set",
        proposals: [
          ...supersededReview().proposals,
          ...supersededReview({
            proposalId: "first-upload-row-9",
            disposition: "rejected",
          }).proposals,
        ],
      },
    });
    expect(preview.dispositionByProposalId).toEqual({});
    expect(preview.restoredFromPriorUploadCount).toBe(0);
  });

  it("withholds a restored acceptance of a response this upload reports blank", () => {
    // The surface must not promise a restoration the route would refuse:
    // `buildStageReadinessProposalReview` throws on an accepted blank.
    const preview = previewStageReadinessStoredReview({
      proposals: [proposal({ response: "", answerState: "blank" })],
      storedReview: supersededReview({ response: "" }),
    });
    expect(preview.dispositionByProposalId).toEqual({});
    expect(preview.source).toBe("none");
  });

  it("reports no restoration rather than a restoration of nothing", () => {
    // `source` drives the line the surface shows a reviewer. A superseded
    // review that carries nothing forward must not announce itself.
    const preview = previewStageReadinessStoredReview({
      proposals: [proposal({ questionId: "q_unrelated" })],
      storedReview: supersededReview(),
    });
    expect(preview.source).toBe("none");
    expect(preview.restoredFromPriorUploadCount).toBe(0);
  });

  it("restores only the rows that still carry the same answer", () => {
    const preview = previewStageReadinessStoredReview({
      proposals: [
        proposal({ proposalId: "kept" }),
        proposal({ proposalId: "edited", response: "Rewritten answer." }),
      ],
      storedReview: supersededReview(),
    });
    expect(preview.dispositionByProposalId).toEqual({ kept: "accepted" });
    expect(preview.restoredFromPriorUploadCount).toBe(1);
  });
});

/**
 * The phase workspace is a server component with no test harness, so the
 * reading above can be correct and still reach no screen. These cases read its
 * source, which is the same thing `program-route-shell-enforcement` does for
 * the routes it guards. They exist because the two ways this wiring fails are
 * both silent: calling none of it, and calling it with a field dropped.
 */
describe("the phase workspace is wired to the reading", () => {
  const page = readFileSync(
    "src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx",
    "utf-8",
  );

  it("loads the stored review once and asks it for the preview", () => {
    expect(page).toContain("loadStageReadinessStoredReview(");
    expect(page).toContain("previewStageReadinessStoredReview({");
  });

  it("carries `context` out of the stored proposal set", () => {
    // `stageReadinessAnswerIdentity` keys on the context column. A parser that
    // drops it restores nothing on every row a human wrote context into, and
    // nothing anywhere would fail.
    expect(page).toMatch(/context:\s*\n?\s*typeof proposal\.context === "string"/);
    expect(page).toMatch(/context: proposal\.context \?\? ""/);
  });

  it("reports the restored count to the surface", () => {
    expect(page).toContain("carriedForwardFromPriorUpload:");
    expect(page).toContain("reviewPreview.restoredFromPriorUploadCount");
  });

  it("keeps the P1 gate status answering only for a review of this set", () => {
    // A superseded review has not cleared the transition, so it must not be
    // allowed to speak for the P1->P2 gate.
    expect(page).toMatch(
      /readinessWorkbookPhase === 1 && !fromPriorUpload/,
    );
  });
});
