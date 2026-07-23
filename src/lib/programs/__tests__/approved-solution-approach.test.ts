import {
  ARCHITECTURE_MODEL_VERSION,
  formatApprovedSolutionApproach,
  parseApprovedSolutionApproach,
  validateArchitectureGenerationLineage,
} from "@/lib/programs/approved-solution-approach";

describe("approved solution approach", () => {
  const structuredData = {
    solutionContextDigest: {
      approach: "Governed agent assist with human approval",
      chosenOption: "Option B",
      tradeoffsAccepted: ["Phased integration", "Human review remains mandatory"],
      options: [
        { id: "A", name: "Option A", summary: "Workflow only" },
        { id: "B", name: "Option B", summary: "Governed agent assist" },
      ],
      decisions: [
        {
          phase: 3,
          decision: "Approved solution option: Option B",
          rationale: "Best balance of value, controls, and time to proof.",
          approvedBy: "u1",
          approvedAt: "2026-07-23T00:00:00.000Z",
        },
      ],
    },
  };

  it("requires a chosen option and its human approval decision", () => {
    expect(parseApprovedSolutionApproach(structuredData)).toEqual(
      expect.objectContaining({ chosenOption: "Option B" }),
    );
    expect(
      parseApprovedSolutionApproach({
        solutionContextDigest: { chosenOption: "Option B", decisions: [] },
      }),
    ).toBeNull();
  });

  it("formats an authoritative prompt block with rejected alternatives", () => {
    const approved = parseApprovedSolutionApproach(structuredData);
    expect(approved).not.toBeNull();
    const block = formatApprovedSolutionApproach(approved!);
    expect(block).toContain("APPROVED SOLUTION APPROACH - AUTHORITATIVE INPUT");
    expect(block).toContain("Chosen option: Option B");
    expect(block).toContain("Rejected alternatives: Option A");
    expect(block).toContain("Do not reopen, blend, or silently replace it");
  });

  it("accepts only the current decision, context snapshot, and architecture model", () => {
    const approved = parseApprovedSolutionApproach(structuredData)!;
    const lineage = {
      decisionHash: approved.decisionHash,
      decisionVersion: approved.decisionVersion,
      approvedOptionId: approved.selectedOptionId,
      approvedOptionVersion: approved.selectedOptionVersion,
      contextSnapshotHash: "context-v3",
      architectureModelVersion: ARCHITECTURE_MODEL_VERSION,
    };
    expect(validateArchitectureGenerationLineage({
      lineage,
      approved,
      currentContextSnapshotHash: "context-v3",
    })).toMatchObject({ ok: true });
    expect(validateArchitectureGenerationLineage({
      lineage: { ...lineage, decisionHash: "stale" },
      approved,
      currentContextSnapshotHash: "context-v3",
    })).toMatchObject({ ok: false });
    expect(validateArchitectureGenerationLineage({
      lineage,
      approved,
      currentContextSnapshotHash: "context-v4",
    })).toMatchObject({ ok: false });
  });
});
