import { evaluateP0SourceEvidenceCoverage } from "../p0-source-evidence-contract";

describe("P0 source evidence minimum", () => {
  const source = {
    evidence_id: "evidence-1",
    decision: "approved",
    phase: 0,
    source_ref: { move_artifact_id: "artifact-1", filename: "intake.md" },
  };
  const parsedFile = {
    id: "evidence-1",
    phase: 0,
    title: "intake.md",
    extracted_text: "A source-backed intake statement for this Move.",
  };

  it("accepts one phase-scoped, reviewed source file with parsed content", () => {
    expect(evaluateP0SourceEvidenceCoverage([source], [parsedFile])).toEqual({
      approvedSourceFileCount: 1,
      pendingReviewCount: 0,
      evidenceTitles: ["intake.md"],
    });
  });

  it("does not count an approved evidence row that is not linked to an uploaded file", () => {
    expect(
      evaluateP0SourceEvidenceCoverage(
        [{ ...source, source_ref: {} }],
        [parsedFile],
      ).approvedSourceFileCount,
    ).toBe(0);
  });

  it("does not count prior-phase, pending, or unparsed evidence", () => {
    expect(
      evaluateP0SourceEvidenceCoverage(
        [{ ...source, phase: 1 }],
        [parsedFile],
      ).approvedSourceFileCount,
    ).toBe(0);
    expect(
      evaluateP0SourceEvidenceCoverage(
        [{ ...source, decision: "pending" }],
        [parsedFile],
      ),
    ).toMatchObject({ approvedSourceFileCount: 0, pendingReviewCount: 1 });
    expect(
      evaluateP0SourceEvidenceCoverage([source], [
        { ...parsedFile, extracted_text: null, summary: null },
      ]).approvedSourceFileCount,
    ).toBe(0);
    expect(
      evaluateP0SourceEvidenceCoverage([source], [
        { ...parsedFile, extracted_text: null, summary: "Generated summary only." },
      ]).approvedSourceFileCount,
    ).toBe(0);
  });

  it("does not report pending review for a non-file or unparsed record", () => {
    expect(
      evaluateP0SourceEvidenceCoverage(
        [
          { ...source, decision: "pending", source_ref: {} },
          { ...source, decision: "pending", evidence_id: "evidence-2" },
        ],
        [parsedFile, { ...parsedFile, id: "evidence-2", extracted_text: null }],
      ).pendingReviewCount,
    ).toBe(0);
  });

  it("counts distinct uploaded files rather than duplicate review rows", () => {
    const duplicateReview = { ...source, evidence_id: "evidence-2" };
    expect(
      evaluateP0SourceEvidenceCoverage(
        [source, duplicateReview],
        [parsedFile, { ...parsedFile, id: "evidence-2" }],
      ).approvedSourceFileCount,
    ).toBe(1);
  });
});
