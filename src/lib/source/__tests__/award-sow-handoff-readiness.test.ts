import { buildSourceAwardSowHandoffReadiness } from "../award-sow-handoff-readiness";
import type {
  SourceAwardSowArtifactInput,
  SourceAwardSowStageInput,
} from "../award-sow-handoff-readiness-types";

function artifact(
  id: string,
  title: string,
  summary: string,
  status: SourceAwardSowArtifactInput["status"] = "approved",
): SourceAwardSowArtifactInput {
  return { id, title, summary, status, sourceCount: 1 };
}

function stage(
  key: SourceAwardSowStageInput["key"],
  status: SourceAwardSowStageInput["status"] = "complete",
): SourceAwardSowStageInput {
  return {
    key,
    label: key.replaceAll("_", " "),
    status,
    gate: { status: status === "complete" ? "approved" : "ready" },
  };
}

const COMPLETE_STAGES = [
  stage("selection"),
  stage("executive_decision"),
  stage("transition", "active"),
] as const;

const BASE_CONTRACT_FORMATION_ARTIFACTS = [
  artifact(
    "D27-SELECTION",
    "d27_selection_memo",
    "Reviewed selection memo with dissent and evidence lineage.",
  ),
  artifact(
    "PRICING-APPROVED",
    "Approved pricing schedule",
    "Approved pricing exhibit with evidence lineage.",
  ),
  artifact(
    "CLAUSE-LIBRARY",
    "Governed clause library references",
    "Approved clause positions with fallback provenance.",
  ),
  artifact(
    "SOW-SCOPE",
    "SOW scope schedule",
    "Statement of work scope, service boundary, and exclusions.",
  ),
  artifact(
    "APPROVAL-AUTHORITY",
    "Named approval authority",
    "Approval authority by value and sourcing archetype.",
  ),
  artifact(
    "LINEAGE",
    "Evidence lineage packet",
    "Evidence-backed lineage for selection, price, SOW, and clauses.",
  ),
] as const;

const CONTRACT_FORMATION_PROVENANCE_ARTIFACTS = [
  artifact(
    "SLA-PROVENANCE",
    "SLA and service credit provenance",
    "SLA targets, service credits, and measurement basis traced to source evidence.",
  ),
  artifact(
    "EXIT-PROVENANCE",
    "Exit rights and termination provenance",
    "Exit assistance, termination for convenience, data return, and renewal notice provenance.",
  ),
  artifact(
    "CHANGE-CONTROL-PROVENANCE",
    "Change-control provenance",
    "Change order governance, rate-card adjustment, and scope-change approval provenance.",
  ),
] as const;

describe("buildSourceAwardSowHandoffReadiness", () => {
  it("discriminates signature-ready draft packages from accepted executed evidence", () => {
    const readiness = buildSourceAwardSowHandoffReadiness({
      event: {
        id: "SRC-STAGE08-DRAFT",
        name: "Stage 08 draft package",
        currentStageKey: "transition",
        currentStageLabel: "Transition",
        stages: COMPLETE_STAGES,
        artifacts: [
          ...BASE_CONTRACT_FORMATION_ARTIFACTS,
          ...CONTRACT_FORMATION_PROVENANCE_ARTIFACTS,
          artifact(
            "SIGNATURE-PACKET-DRAFT",
            "Signature packet ready for e-signature",
            "Contract-ready pending signature. Named signature authority is listed, but no signed or executed agreement has been accepted.",
          ),
        ],
      },
    });

    expect(readiness.contractFormationState).toBe("pending_signature");
    expect(readiness.readinessStatus).toBe("blocked_executed_agreement_sow");
    expect(readiness.publicationPlanner.state).toBe(
      "blocked_no_accepted_executed_evidence",
    );
    expect(readiness.publicationPlanner.acceptedExecutedEvidence).toEqual([]);
    expect(readiness.publicationPlanner.publicationAllowed).toBe(false);
  });

  it("requires clause, SOW, pricing, SLA, exit, and change-control provenance before the package is governed", () => {
    const readiness = buildSourceAwardSowHandoffReadiness({
      event: {
        id: "SRC-STAGE08-PROVENANCE",
        name: "Stage 08 provenance package",
        currentStageKey: "transition",
        currentStageLabel: "Transition",
        stages: COMPLETE_STAGES,
        artifacts: BASE_CONTRACT_FORMATION_ARTIFACTS,
      },
    });

    expect(readiness.contractFormationState).toBe("draft");
    expect(readiness.contractFormationPackage.missingComponents).toEqual(
      expect.arrayContaining([
        "sla_service_level_provenance",
        "exit_rights_provenance",
        "change_control_provenance",
      ]),
    );
    expect(readiness.blockers).toEqual(
      expect.arrayContaining([
        "SLA/service-level provenance is missing from the contract-formation package.",
        "Exit-rights provenance is missing from the contract-formation package.",
        "Change-control provenance is missing from the contract-formation package.",
      ]),
    );
  });

  it("plans a fail-closed Contract 360 publication review from accepted executed evidence without writing canonical rows", () => {
    const readiness = buildSourceAwardSowHandoffReadiness({
      event: {
        id: "SRC-STAGE08-EXECUTED",
        name: "Stage 08 executed package",
        currentStageKey: "transition",
        currentStageLabel: "Transition",
        stages: COMPLETE_STAGES,
        artifacts: [
          ...BASE_CONTRACT_FORMATION_ARTIFACTS,
          ...CONTRACT_FORMATION_PROVENANCE_ARTIFACTS,
          artifact(
            "EXECUTED-MSA-SOW",
            "Executed agreement and SOW",
            "Signed agreement and executed SOW accepted as evidence, with named signature authority and document hash recorded.",
            "locked",
          ),
        ],
      },
    });

    expect(readiness.readyForContract360Handoff).toBe(true);
    expect(readiness.publicationPlanner).toMatchObject({
      state: "ready_for_publication_review",
      publicationAllowed: false,
      target: "canonical_contract_and_contract360",
      blockedWrites: [
        "canonical_contract_row",
        "contract360_projection_row",
        "supplier_notification",
      ],
    });
    expect(readiness.publicationPlanner.plannedReviewSteps).toEqual([
      "Map accepted executed evidence to the existing canonical contract identity.",
      "Review clause, SOW, pricing, SLA, exit, and change-control provenance before publication.",
      "Require a human-approved canonical writer or data-build job before any Contract 360 row is created.",
    ]);
  });

  it("projects a canonical-contract identity and Optimize path only as a blocked human-review plan", () => {
    const readiness = buildSourceAwardSowHandoffReadiness({
      event: {
        id: "SRC-STAGE08-OPTIMIZE",
        name: "Stage 08 Optimize handoff package",
        currentStageKey: "transition",
        currentStageLabel: "Transition",
        stages: COMPLETE_STAGES,
        artifacts: [
          ...BASE_CONTRACT_FORMATION_ARTIFACTS,
          ...CONTRACT_FORMATION_PROVENANCE_ARTIFACTS,
          artifact(
            "EXECUTED-MSA-SOW",
            "Executed agreement and SOW",
            "Signed agreement and executed SOW accepted as evidence, with named signature authority and document hash recorded.",
            "locked",
          ),
        ],
      },
    });

    expect(readiness).toMatchObject({
      canonicalContractProjection: {
        state: "ready_for_identity_review",
        candidateIdentityKey:
          "pending_canonical_contract:SRC-STAGE08-OPTIMIZE:EXECUTED-MSA-SOW",
        writeAllowed: false,
        blockedWrites: [
          "canonical_contract_identity",
          "contract360_projection_row",
          "optimize_case",
        ],
      },
      optimizePath: {
        state: "ready_for_optimize_review",
        launchAllowed: false,
        route: "/source/optimize",
        prefillContractId: null,
      },
    });
    expect(readiness.canonicalContractProjection.reviewSteps).toEqual([
      "Human reviewer confirms the candidate canonical contract identity against executed evidence.",
      "Approved canonical writer or data-build job creates the contract identity and Contract 360 projection.",
      "Optimize intake may prefill only after the canonical contract identity exists.",
    ]);
    expect(readiness.optimizePath.blockers).toContain(
      "Optimize cannot be launched from Stage 08 until a human-approved canonical contract identity exists.",
    );
  });
});
