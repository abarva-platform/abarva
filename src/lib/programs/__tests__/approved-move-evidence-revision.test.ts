import {
  approvedMoveEvidenceRevision,
  type ApprovedMoveEvidenceRevisionRow,
} from "../approved-move-evidence-revision";

const evidenceRow: ApprovedMoveEvidenceRevisionRow = {
  id: "evidence-1",
  phase: 2,
  evidenceType: "workshop_notes",
  attachmentId: "attachment-1",
  createdAt: "2026-09-28T12:00:00.000Z",
  reviewUpdatedAt: "2026-09-28T12:30:00.000Z",
  title: "Workshop notes",
  confidence: 0.9,
  summary: "Human-reviewed notes.",
  extractedText: "Baseline and process details.",
  extractedStructured: { metrics: { cycleTime: "18 days" }, risks: [] },
  reviewedExtraction: {
    version: 1,
    summary: "Confirmed baseline and process details.",
    structured: {
      decisions: [],
      risks: [],
      baselineCandidates: ["18 days"],
      actionItems: [],
      observations: [],
      assumptions: [],
      openQuestions: [],
      citations: [],
    },
  },
};

function revision(rows: readonly ApprovedMoveEvidenceRevisionRow[]) {
  return approvedMoveEvidenceRevision({
    tenantKey: "tenant-a",
    moveId: "move-a",
    rows,
  });
}

describe("approved Move evidence revision", () => {
  it("is independent of database row ordering and object key ordering", () => {
    const reordered: ApprovedMoveEvidenceRevisionRow = {
      ...evidenceRow,
      extractedStructured: { risks: [], metrics: { cycleTime: "18 days" } },
      reviewedExtraction: {
        version: 1,
        summary: "Confirmed baseline and process details.",
        structured: {
          decisions: [],
          risks: [],
          baselineCandidates: ["18 days"],
          actionItems: [],
          observations: [],
          assumptions: [],
          openQuestions: [],
          citations: [],
        },
      },
    };

    expect(revision([evidenceRow, { ...evidenceRow, id: "evidence-2" }])).toBe(
      revision([{ ...reordered, id: "evidence-2" }, reordered]),
    );
  });

  it("changes when a reviewer changes an approved fact", () => {
    const updated = {
      ...evidenceRow,
      reviewUpdatedAt: "2026-09-28T12:45:00.000Z",
      reviewedExtraction: {
        ...evidenceRow.reviewedExtraction!,
        structured: {
          decisions: [],
          risks: [],
          baselineCandidates: ["21 days"],
          actionItems: [],
          observations: [],
          assumptions: [],
          openQuestions: [],
          citations: [],
        },
      },
    };

    expect(revision([updated])).not.toBe(revision([evidenceRow]));
  });

  it("changes when evidence is added or removed", () => {
    expect(revision([evidenceRow])).not.toBe(revision([]));
    expect(
      revision([evidenceRow, { ...evidenceRow, id: "evidence-2" }]),
    ).not.toBe(revision([evidenceRow]));
  });
});
