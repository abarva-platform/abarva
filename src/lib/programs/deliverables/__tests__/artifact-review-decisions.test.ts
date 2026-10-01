import {
  buildReviewPackageFromArtifacts,
  buildP2ReviewPacket,
  readinessForDecision,
} from "../artifact-review-decisions";
import type { MoveArtifactRow } from "../move-artifacts";

const artifact: MoveArtifactRow = {
  artifact_id: "47a2fc51-c703-4dd9-bfbe-73073b8ddfb0",
  move_id: "6f91c9a9-119c-46db-adae-9dfdf29b8dda",
  phase: 2,
  artifact_type: "discovery_report",
  artifact_family: "generated_deliverable",
  title: "P2 Current Work Diagnostic",
  file_name: "p2.html",
  file_format: "html",
  blob_container: "context-drops",
  blob_path: "moves/test-tenant/p2.html",
  file_size: 42000,
  version: 7,
  status: "review_required",
  generated_by: "agent",
  generated_at: "2026-06-28T00:00:00.000Z",
  quality_score: 96,
  unsupported_claims_count: 0,
  lifecycle_state: "current",
  created_at: "2026-06-28T00:00:00.000Z",
  metadata: {
    openItems: ["Sponsor/signoff gates remain unresolved."],
  },
};

describe("artifact review decisions", () => {
  it("binds both HTML visual companion and DOCX editable record to a review package", () => {
    const docxArtifact: MoveArtifactRow = {
      ...artifact,
      artifact_id: "docx-artifact",
      file_format: "docx",
      artifact_type: "discovery_report_editable_docx",
      metadata: {
        outputRole: "docx_editable_phase_record",
        pairedVisualCompanionArtifactId: artifact.artifact_id,
      },
    };

    expect(
      buildReviewPackageFromArtifacts({
        artifact,
        pairedArtifact: docxArtifact,
      }),
    ).toEqual({
      reviewedArtifactId: artifact.artifact_id,
      htmlVisualCompanionArtifactId: artifact.artifact_id,
      docxEditableArtifactId: "docx-artifact",
      reviewedArtifactIds: [artifact.artifact_id, "docx-artifact"],
    });
  });

  it("uses only explicitly supplied review facts and evidence metadata", () => {
    const operationalArtifact: MoveArtifactRow = {
      ...artifact,
      title: "Operational Throughput Diagnostic",
      metadata: {
        ...artifact.metadata,
        diagnosticThesis: "A throughput gap is driving manual handling.",
        quantifiedFacts: [
          "1,872 monthly work items",
          "2,345 manual touch hours per month",
          "7.4 average processing days",
        ],
        strongestEvidence: ["The cited work extract covers the review period."],
        missingEvidence: ["Operations owner confirmation"],
      },
    };
    const packet = buildP2ReviewPacket({ artifact: operationalArtifact });

    expect(packet.quantifiedFacts).toEqual([
      "1,872 monthly work items",
      "2,345 manual touch hours per month",
      "7.4 average processing days",
    ]);
    expect(packet.strongestEvidence).toEqual([
      "The cited work extract covers the review period.",
    ]);
    expect(packet.diagnosticThesis).toBe("A throughput gap is driving manual handling.");
    expect(packet.knownLimitations.join(" ")).toContain(
      "does not satisfy final P2 sponsor sign-off",
    );
    expect(packet.approvalOptions.map((option) => option.decision)).toEqual([
      "approve_for_p3_draft",
      "request_revisions",
      "hold_for_evidence",
    ]);
  });

  it("does not inject another use case's facts, risks, or evidence requests", () => {
    const memberServiceArtifact: MoveArtifactRow = {
      ...artifact,
      title: "Service Operations Diagnostic",
      metadata: {
        openItems: ["Production interface validation remains open."],
      },
    };

    const packet = buildP2ReviewPacket({ artifact: memberServiceArtifact });

    expect(packet.diagnosticThesis).toContain(memberServiceArtifact.title);
    expect(packet.quantifiedFacts).toEqual([]);
    expect(packet.missingEvidence).toContain(
      "Production interface validation remains open.",
    );
    expect(packet.missingEvidence.join(" ").toLowerCase()).not.toMatch(
      /payment|invoice|accounts payable/,
    );
    expect(
      [packet.diagnosticThesis, ...packet.strongestEvidence, ...packet.knownLimitations]
        .join(" ")
        .toLowerCase(),
    ).not.toMatch(/payment|invoice|accounts payable|duplicate-payment/);
  });

  it("approves only P3 draft readiness, not P2 final or P3 final", () => {
    expect(readinessForDecision("approve_for_p3_draft")).toMatchObject({
      readyForP3Draft: true,
      readyForP3Final: false,
      p2FinalApproved: false,
      allowedNextAction: "generate_p3_draft",
    });
  });

  it("keeps P3 blocked for revision or evidence hold decisions", () => {
    expect(readinessForDecision("request_revisions").readyForP3Draft).toBe(false);
    expect(readinessForDecision("hold_for_evidence").readyForP3Draft).toBe(false);
  });
});
