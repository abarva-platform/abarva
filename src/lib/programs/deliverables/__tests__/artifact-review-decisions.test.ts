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
  blob_path: "moves/lakeshore/p2.html",
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

  it("extracts a P2 sponsor-review packet from evidence-bound artifact text", () => {
    const packet = buildP2ReviewPacket({
      artifact,
      artifactHtml: `
        <html><body>
          <p>1,872 monthly exceptions and 2,345 manual touch hours per month.</p>
          <p>Average resolution takes 7.4 days. Payment hold and duplicate-payment controls are implicated.</p>
          <p>AI can assist triage, classification, routing, and duplicate detection, with human approval.</p>
        </body></html>
      `,
    });

    expect(packet.quantifiedFacts).toEqual(
      expect.arrayContaining([
        "1,872 monthly invoice exceptions",
        "2,345 manual touch hours per month",
        "7.4 average resolution days",
      ]),
    );
    expect(packet.knownLimitations.join(" ")).toContain("not final");
    expect(packet.approvalOptions.map((option) => option.decision)).toEqual([
      "approve_for_p3_draft",
      "request_revisions",
      "hold_for_evidence",
    ]);
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
