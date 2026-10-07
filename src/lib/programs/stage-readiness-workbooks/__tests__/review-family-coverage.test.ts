import type { StageReadinessGateProposal } from "../gate-readiness";
import {
  charterReviewMissingFamiliesNextAction,
  familyNotInReviewNextAction,
  stageReadinessReviewHasDecidedRequiredResponse,
  uncoveredRequiredFamilyIds,
} from "../review-family-coverage";

function proposal(
  overrides: Partial<StageReadinessGateProposal> = {},
): StageReadinessGateProposal {
  return {
    questionId: "q_a",
    dimensionId: "family_a",
    requirement: "required",
    answerState: "answered",
    disposition: "accepted",
    evidenceOrSource: "a.csv",
    ...overrides,
  };
}

describe("stage readiness review family coverage", () => {
  it("counts a family as covered only when the review asks a required question about it", () => {
    expect(
      uncoveredRequiredFamilyIds({
        requiredFamilyIds: ["family_a", "family_b"],
        proposals: [
          proposal(),
          proposal({ dimensionId: "family_b", requirement: "recommended" }),
        ],
      }),
    ).toEqual(["family_b"]);
  });

  it("treats a family whose only questions were recommended as uncovered", () => {
    // This is the drift the module exists for: the family was optional when the
    // workbook was built and is required now, so an optional response cannot
    // stand in for the required one that was never asked.
    expect(
      uncoveredRequiredFamilyIds({
        requiredFamilyIds: ["family_b"],
        proposals: [proposal({ dimensionId: "family_b", requirement: "recommended" })],
      }),
    ).toEqual(["family_b"]);
  });

  it("reports an uncovered family regardless of the disposition of the covered ones", () => {
    expect(
      uncoveredRequiredFamilyIds({
        requiredFamilyIds: ["family_a", "family_b"],
        proposals: [proposal({ disposition: "accepted" })],
      }),
    ).toEqual(["family_b"]);
  });

  it("reports nothing when every required family is covered", () => {
    expect(
      uncoveredRequiredFamilyIds({
        requiredFamilyIds: ["family_a", "family_b"],
        proposals: [proposal(), proposal({ dimensionId: "family_b" })],
      }),
    ).toEqual([]);
  });

  it("names a family once even when two packets declare it", () => {
    expect(
      uncoveredRequiredFamilyIds({
        requiredFamilyIds: ["family_b", "family_b"],
        proposals: [proposal()],
      }),
    ).toEqual(["family_b"]);
  });

  it("treats every required family as uncovered when there is no review at all", () => {
    expect(
      uncoveredRequiredFamilyIds({
        requiredFamilyIds: ["family_a"],
        proposals: null,
      }),
    ).toEqual(["family_a"]);
  });

  it("separates a review nobody has acted on from one that has been worked", () => {
    expect(
      stageReadinessReviewHasDecidedRequiredResponse([
        proposal({ disposition: "pending" }),
      ]),
    ).toBe(false);
    expect(
      stageReadinessReviewHasDecidedRequiredResponse([
        proposal({ disposition: "rejected" }),
      ]),
    ).toBe(true);
    // A decided RECOMMENDED response is not a worked required review.
    expect(
      stageReadinessReviewHasDecidedRequiredResponse([
        proposal({ requirement: "recommended", disposition: "accepted" }),
      ]),
    ).toBe(false);
  });

  it("tells the reviewer to download a workbook rather than to complete the one on file", () => {
    const action = familyNotInReviewNextAction(2, "Provider directory baseline");

    expect(action).toContain("P2 to P3");
    expect(action).toContain("Provider directory baseline");
    expect(action).toMatch(/download the current workbook/i);
    // The unperformable instruction this replaced.
    expect(action).not.toMatch(/complete the P2 to P3 readiness workbook/i);
  });

  it("names the uncovered families in the charter instruction", () => {
    const action = charterReviewMissingFamiliesNextAction([
      "Provider directory baseline",
      "PHI minimum-necessary controls",
    ]);

    expect(action).toContain("Provider directory baseline");
    expect(action).toContain("PHI minimum-necessary controls");
    expect(action).toMatch(/download the current workbook/i);
  });
});
