/**
 * A corrected re-upload must not cost the whole review.
 *
 * `buildProposal` hashes `uploadedWorkbookSha256` into every `proposalId`, and
 * `buildStageReadinessProposalSet` folds those ids into `proposalSetId`. So a
 * re-uploaded workbook shares no id with its predecessor, not even for the rows
 * nobody touched, and the stored review stops belonging to the current set.
 * Completing one blank required cell therefore returned every other response to
 * `pending` — up to 55 required answers re-judged to fix one, at the widest
 * archetype in the catalog.
 *
 * These cases live in `src/lib/programs/__tests__` because that directory is
 * directory-swept by a required status check; the module's own siblings in
 * `stage-readiness-workbooks/__tests__` are not.
 */

import {
  carryForwardStageReadinessDecisions,
  stageReadinessAnswerIdentity,
} from "@/lib/programs/stage-readiness-workbooks/review-carry-forward";

type Proposal = Parameters<
  typeof carryForwardStageReadinessDecisions
>[0]["proposals"][number];

function proposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    proposalId: "new-row-1",
    questionId: "q_data_quality_confirm_currency",
    response: "Yes, current as of the September extract.",
    context: "",
    evidenceOrSource: "Existing evidence: 4b1e",
    answerState: "answered",
    ...overrides,
  };
}

describe("stageReadinessAnswerIdentity", () => {
  it("is the same answer across uploads, because it reads none of the upload's identity", () => {
    // The four fields a human judged. `proposalId`, the sheet, the row number
    // and the file hash are all absent by design — they are facts about the
    // file, not about the answer.
    expect(stageReadinessAnswerIdentity(proposal({ proposalId: "a" }))).toBe(
      stageReadinessAnswerIdentity(proposal({ proposalId: "b" })),
    );
  });

  it("tolerates the whitespace an Excel round trip adds or drops", () => {
    expect(
      stageReadinessAnswerIdentity(
        proposal({ response: "  Yes, current as of   the September extract.\n" }),
      ),
    ).toBe(stageReadinessAnswerIdentity(proposal()));
  });

  it.each([
    ["response", { response: "No longer current." }],
    ["context", { context: "Measured against the October extract." }],
    ["evidenceOrSource", { evidenceOrSource: "Interview record, 3 October" }],
    ["questionId", { questionId: "q_data_quality_name_owner" }],
  ])("treats an edit to %s as a different answer", (_field, overrides) => {
    expect(stageReadinessAnswerIdentity(proposal(overrides))).not.toBe(
      stageReadinessAnswerIdentity(proposal()),
    );
  });

  it("is null for a row that names no question, which can be matched to nothing", () => {
    expect(stageReadinessAnswerIdentity(proposal({ questionId: "" }))).toBeNull();
    expect(stageReadinessAnswerIdentity(null)).toBeNull();
  });
});

describe("carryForwardStageReadinessDecisions", () => {
  it("restores an acceptance for a re-uploaded answer that did not change", () => {
    const result = carryForwardStageReadinessDecisions({
      proposals: [proposal()],
      priorReviewProposals: [
        { ...proposal({ proposalId: "superseded-row-1" }), disposition: "accepted" },
      ],
      decisions: [],
    });

    expect(result.carriedForwardCount).toBe(1);
    expect(result.decisions).toEqual([
      {
        proposalId: "new-row-1",
        disposition: "accepted",
        note: expect.stringContaining("previous upload"),
      },
    ]);
  });

  it.each(["accepted", "rejected", "needs_validation"] as const)(
    "restores a recorded %s decision",
    (disposition) => {
      const result = carryForwardStageReadinessDecisions({
        proposals: [proposal()],
        priorReviewProposals: [
          { ...proposal({ proposalId: "superseded-row-1" }), disposition },
        ],
        decisions: [],
      });
      expect(result.decisions.map((d) => d.disposition)).toEqual([disposition]);
    },
  );

  it("withholds every decision when the answer was edited, so it is judged again", () => {
    const result = carryForwardStageReadinessDecisions({
      proposals: [proposal({ response: "Superseded by the October extract." })],
      priorReviewProposals: [
        { ...proposal({ proposalId: "superseded-row-1" }), disposition: "accepted" },
      ],
      decisions: [],
    });

    expect(result.carriedForwardCount).toBe(0);
    expect(result.decisions).toEqual([]);
  });

  it("does not restore `pending`, which is the absence of a decision", () => {
    const result = carryForwardStageReadinessDecisions({
      proposals: [proposal()],
      priorReviewProposals: [
        { ...proposal({ proposalId: "superseded-row-1" }), disposition: "pending" },
      ],
      decisions: [],
    });
    expect(result.decisions).toEqual([]);
  });

  it("leaves a decision taken in this batch untouched and does not duplicate it", () => {
    // Incoming decisions win and are passed through first, so an id this
    // reading does not recognise still reaches the review builder's refusal.
    const result = carryForwardStageReadinessDecisions({
      proposals: [proposal()],
      priorReviewProposals: [
        { ...proposal({ proposalId: "superseded-row-1" }), disposition: "accepted" },
      ],
      decisions: [{ proposalId: "new-row-1", disposition: "rejected" }],
    });

    expect(result.carriedForwardCount).toBe(0);
    expect(result.decisions).toEqual([
      { proposalId: "new-row-1", disposition: "rejected" },
    ]);
  });

  it("carries nothing when the same answer was reviewed to opposite conclusions", () => {
    // Two stored rows, identical text, conflicting decisions. Picking either
    // would be this module inventing a verdict, so the response is judged
    // again instead.
    const result = carryForwardStageReadinessDecisions({
      proposals: [proposal()],
      priorReviewProposals: [
        { ...proposal({ proposalId: "superseded-a" }), disposition: "accepted" },
        { ...proposal({ proposalId: "superseded-b" }), disposition: "rejected" },
      ],
      decisions: [],
    });

    expect(result.decisions).toEqual([]);
  });

  it("restores a decision recorded twice to the same conclusion", () => {
    const result = carryForwardStageReadinessDecisions({
      proposals: [proposal()],
      priorReviewProposals: [
        { ...proposal({ proposalId: "superseded-a" }), disposition: "accepted" },
        { ...proposal({ proposalId: "superseded-b" }), disposition: "accepted" },
      ],
      decisions: [],
    });

    expect(result.decisions.map((d) => d.disposition)).toEqual(["accepted"]);
  });

  it.each([
    ["a blank answer state", { answerState: "blank" as const }],
    ["an empty Response cell", { response: "   " }],
  ])(
    "never restores an acceptance onto %s, which the review builder would throw on",
    (_label, overrides) => {
      // `buildStageReadinessProposalReview` throws on an accepted blank, which
      // would hard-block the transition rather than hold it.
      const current = proposal(overrides);
      const result = carryForwardStageReadinessDecisions({
        proposals: [current],
        priorReviewProposals: [
          { ...current, proposalId: "superseded-row-1", disposition: "accepted" },
        ],
        decisions: [],
      });
      expect(result.decisions).toEqual([]);
    },
  );

  it("restores nothing when there is no superseded review", () => {
    expect(
      carryForwardStageReadinessDecisions({
        proposals: [proposal()],
        priorReviewProposals: null,
        decisions: [],
      }),
    ).toEqual({ decisions: [], carriedForwardCount: 0 });
  });

  it("restores the untouched rows of a partly corrected workbook", () => {
    // The shape of the real case: one cell was fixed, the rest came back
    // identical. Only the fixed row needs a fresh decision.
    const unchanged = [1, 2, 3].map((n) =>
      proposal({
        proposalId: `new-row-${n}`,
        questionId: `q_family_${n}`,
      }),
    );
    const corrected = proposal({
      proposalId: "new-row-4",
      questionId: "q_family_4",
      response: "Completed on the second pass.",
    });

    const result = carryForwardStageReadinessDecisions({
      proposals: [...unchanged, corrected],
      priorReviewProposals: [
        ...unchanged.map((p, index) => ({
          ...p,
          proposalId: `superseded-${index}`,
          disposition: "accepted",
        })),
        {
          ...proposal({
            proposalId: "superseded-blank",
            questionId: "q_family_4",
            response: "",
            answerState: "blank",
          }),
          disposition: "pending",
        },
      ],
      decisions: [{ proposalId: "new-row-4", disposition: "accepted" }],
    });

    expect(result.carriedForwardCount).toBe(3);
    expect(result.decisions.map((d) => d.proposalId)).toEqual([
      "new-row-4",
      "new-row-1",
      "new-row-2",
      "new-row-3",
    ]);
  });
});
