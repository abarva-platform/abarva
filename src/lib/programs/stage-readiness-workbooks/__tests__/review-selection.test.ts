import {
  isWorkbookProposalAcceptable,
  isWorkbookProposalOpenForReview,
  selectableWorkbookProposalIds,
  type ReviewableWorkbookProposal,
} from "../review-selection";
import { buildStageReadinessProposalReview } from "../proposals";
import type { ProgramCore, TenancyCtx } from "@/lib/programs/types.db";

function proposal(
  overrides: Partial<ReviewableWorkbookProposal> = {},
): ReviewableWorkbookProposal {
  return {
    proposalId: "p-1",
    answerState: "answered",
    response: "Baseline is 41 days.",
    disposition: "pending",
    ...overrides,
  };
}

describe("isWorkbookProposalAcceptable", () => {
  it("accepts an answered response that carries text", () => {
    expect(isWorkbookProposalAcceptable(proposal())).toBe(true);
  });

  it("refuses a response the parser classified as blank", () => {
    expect(
      isWorkbookProposalAcceptable(proposal({ answerState: "blank", response: "" })),
    ).toBe(false);
  });

  it("refuses an empty or whitespace-only Response cell whatever the answer state", () => {
    expect(isWorkbookProposalAcceptable(proposal({ response: "" }))).toBe(false);
    expect(isWorkbookProposalAcceptable(proposal({ response: "   \n\t " }))).toBe(
      false,
    );
  });

  it("refuses a missing Response cell", () => {
    expect(isWorkbookProposalAcceptable(proposal({ response: null }))).toBe(false);
    expect(isWorkbookProposalAcceptable(proposal({ response: undefined }))).toBe(
      false,
    );
  });

  it("accepts an explicit unknown or insufficient-evidence answer, which is a real reviewed answer", () => {
    expect(
      isWorkbookProposalAcceptable(
        proposal({ answerState: "unknown", response: "Unknown" }),
      ),
    ).toBe(true);
    expect(
      isWorkbookProposalAcceptable(
        proposal({
          answerState: "insufficient_evidence",
          response: "Insufficient evidence",
        }),
      ),
    ).toBe(true);
  });

  it("refuses a response the stored set marks blank even though the cell still holds text", () => {
    // `classifyAnswerState` returns "blank" when the row carried no user input,
    // which is not the same question as whether the cell is empty: a prefilled
    // suggestion leaves text behind. The review writer refuses on either
    // condition (`answerState === "blank" || !response.trim()`), so this
    // predicate has to refuse on either one too, or it selects a row the
    // server will reject and lose the whole batch over.
    expect(
      isWorkbookProposalAcceptable(
        proposal({ answerState: "blank", response: "Available evidence: ev-1" }),
      ),
    ).toBe(false);
  });

  it("refuses a missing proposal rather than throwing", () => {
    expect(isWorkbookProposalAcceptable(null)).toBe(false);
    expect(isWorkbookProposalAcceptable(undefined)).toBe(false);
  });
});

describe("isWorkbookProposalOpenForReview", () => {
  it("is open while the decision is pending", () => {
    expect(isWorkbookProposalOpenForReview(proposal())).toBe(true);
  });

  it("is open when a prior review sent it back for validation", () => {
    expect(
      isWorkbookProposalOpenForReview(
        proposal({ disposition: "needs_validation" }),
      ),
    ).toBe(true);
  });

  it("is closed once accepted or rejected", () => {
    expect(
      isWorkbookProposalOpenForReview(proposal({ disposition: "accepted" })),
    ).toBe(false);
    expect(
      isWorkbookProposalOpenForReview(proposal({ disposition: "rejected" })),
    ).toBe(false);
  });

  it("is closed for a blank response even while pending, because accepting it is refused", () => {
    expect(
      isWorkbookProposalOpenForReview(
        proposal({ answerState: "blank", response: "" }),
      ),
    ).toBe(false);
  });
});

describe("selectableWorkbookProposalIds", () => {
  it("selects the answered pending responses and leaves the blanks out", () => {
    const ids = selectableWorkbookProposalIds([
      proposal({ proposalId: "answered-1" }),
      proposal({ proposalId: "blank-1", answerState: "blank", response: "" }),
      proposal({ proposalId: "answered-2", response: "Confirmed." }),
      proposal({ proposalId: "blank-2", response: "  " }),
    ]);
    expect([...ids].sort()).toEqual(["answered-1", "answered-2"]);
  });

  it("leaves out an already-decided response so a second review is a no-op on it", () => {
    const ids = selectableWorkbookProposalIds([
      proposal({ proposalId: "accepted-1", disposition: "accepted" }),
      proposal({ proposalId: "open-1" }),
    ]);
    expect([...ids]).toEqual(["open-1"]);
  });

  it("drops a proposal with no id, which cannot be submitted", () => {
    const ids = selectableWorkbookProposalIds([
      proposal({ proposalId: "" }),
      proposal({ proposalId: null }),
      proposal({ proposalId: "real-1" }),
    ]);
    expect([...ids]).toEqual(["real-1"]);
  });

  it("returns an empty set for a missing or empty proposal list", () => {
    expect(selectableWorkbookProposalIds(null).size).toBe(0);
    expect(selectableWorkbookProposalIds(undefined).size).toBe(0);
    expect(selectableWorkbookProposalIds([]).size).toBe(0);
  });

  it("returns an empty set when every response is still blank, so no review is offered", () => {
    expect(
      selectableWorkbookProposalIds([
        proposal({ proposalId: "b-1", answerState: "blank", response: "" }),
        proposal({ proposalId: "b-2", response: "" }),
      ]).size,
    ).toBe(0);
  });
});

/**
 * The point of the predicate is that a selection built from it is one the
 * review writer will actually accept. Assert that against the writer itself,
 * not against a restatement of its rule.
 */
describe("a selection built from the predicate is one the review writer accepts", () => {
  const proposals = [
    {
      proposalId: "answered-1",
      questionId: "q_baseline_confirm",
      dimensionId: "baseline_metrics",
      requirement: "required" as const,
      sourceClass: "client_fact" as const,
      question: "Confirm the baseline.",
      response: "41 days, measured.",
      context: "",
      evidenceOrSource: "Existing evidence: ev-1",
      owner: "Ops lead",
      workbookLocation: { sheet: "Performance & Value", row: 4 },
      answerState: "answered" as const,
      disposition: "pending" as const,
    },
    {
      proposalId: "blank-1",
      questionId: "q_change_owner",
      dimensionId: "change_adoption_owner",
      requirement: "required" as const,
      sourceClass: "evidence_gap" as const,
      question: "Who owns adoption?",
      response: "",
      context: "",
      evidenceOrSource: "",
      owner: "Change lead",
      workbookLocation: { sheet: "People & Change", row: 4 },
      answerState: "blank" as const,
      disposition: "pending" as const,
    },
  ];

  const ctx = {
    clientId: "tenant-1",
    clientKey: "tenant-key",
    userId: "user-1",
    email: "reviewer@example.com",
  } as TenancyCtx;

  const program = {
    id: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
    clientId: "tenant-1",
    name: "Move",
    currentPhase: 1,
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-08-20T12:00:00.000Z",
  } as ProgramCore;

  function reviewOf(
    rows: readonly unknown[],
    acceptIds: readonly string[],
  ): ReturnType<typeof buildStageReadinessProposalReview> {
    return buildStageReadinessProposalReview({
      ctx,
      program,
      proposalSet: { proposals: rows } as unknown as Parameters<
        typeof buildStageReadinessProposalReview
      >[0]["proposalSet"],
      sourceProposalSetArtifactId: "proposal-artifact-1",
      sourceProposalSetArtifactVersion: 4,
      decisions: acceptIds.map((proposalId) => ({
        proposalId,
        disposition: "accepted" as const,
      })),
      reviewedAt: "2026-10-07T00:00:00.000Z",
    });
  }

  it("saves the review when only the predicate's ids are accepted", () => {
    const ids = [...selectableWorkbookProposalIds(proposals)];
    expect(ids).toEqual(["answered-1"]);

    const review = reviewOf(proposals, ids);

    expect(review.summary.acceptedCount).toBe(1);
    expect(review.acceptedResponses.map((r) => r.proposalId)).toEqual([
      "answered-1",
    ]);
  });

  it("refuses the review for a blank-marked response whose cell still holds prefilled text, which is why the predicate checks both", () => {
    const prefilledButUnanswered = {
      ...proposals[1],
      proposalId: "prefilled-1",
      response: "Available evidence: ev-7",
      answerState: "blank" as const,
    };
    expect(
      selectableWorkbookProposalIds([prefilledButUnanswered]).size,
    ).toBe(0);
    expect(() =>
      reviewOf([prefilledButUnanswered], ["prefilled-1"]),
    ).toThrow(/Blank workbook response cannot be accepted/);
  });

  it("refuses the whole review when a blank id is accepted alongside the answered one", () => {
    expect(() =>
      reviewOf(
        proposals,
        proposals.map((row) => row.proposalId),
      ),
    ).toThrow(/Blank workbook response cannot be accepted/);
  });
});
