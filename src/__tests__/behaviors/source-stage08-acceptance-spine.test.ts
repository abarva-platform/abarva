/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { SourceAwardSowHandoffReadinessPanel } from "@/components/source/SourceAwardSowHandoffReadinessPanel";
import type { SourceAwardSowArtifactInput } from "@/lib/source/award-sow-handoff-readiness-types";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence/mve-profile";
import { buildScorecardAuthorityView } from "@/lib/source/proposal-intelligence/scorecard-authority";
import { buildSourceStage08AcceptanceSpine } from "@/lib/source/stage08-acceptance-spine";
import type { SourceVendorSelectionReadiness } from "@/lib/source/vendor-selection-readiness-types";

function approvedArtifact(
  id: string,
  title: string,
  summary: string,
  status: SourceAwardSowArtifactInput["status"] = "approved",
): SourceAwardSowArtifactInput {
  return { id, title, summary, status, sourceCount: 1 };
}

describe("Source Stage 08 executable acceptance spine", () => {
  it("connects Evaluation/BAFO evidence to canonical contract handoff and Optimize route identity without writes", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "client-a-test-event",
      code: "CLIENT-A-LAKE-AMS-OUTSOURCING-2026",
      name: "Client A AMS Outsourcing RFP",
      accountName: "Client A",
    });
    if (!profileSet) throw new Error("expected test profile set");

    const challengeIntelligence = buildVendorChallengeIntelligence(profileSet);
    const bafoPack = buildVendorBafoInstructionPack(challengeIntelligence);
    const decisionView = buildVendorEvaluationDecisionView(
      profileSet,
      challengeIntelligence,
      bafoPack,
    );
    if (!decisionView) throw new Error("expected decision view");

    const scorecardAuthorityView = buildScorecardAuthorityView({
      tenantKey: profileSet.tenantKey,
      sourceEventId: profileSet.sourceEventId,
      criteria: [
        {
          tenantKey: profileSet.tenantKey,
          sourceEventId: profileSet.sourceEventId,
          criterionId: "transition",
          criterionVersion: "criteria-v1",
          label: "Transition certainty",
          weight: 100,
          weightsFrozen: true,
          approvedCriterionVersion: "criteria-v1",
          approvedBy: "named-procurement-lead",
          approvedAt: "2026-09-21T18:00:00Z",
        },
      ],
      scores: profileSet.profiles.map((profile) => ({
        tenantKey: profileSet.tenantKey,
        sourceEventId: profileSet.sourceEventId,
        vendorId: profile.vendorId,
        vendorName: profile.vendorName,
        criterionId: "transition",
        criterionVersion: "criteria-v1",
        evaluatorId: "eval-1",
        evaluatorName: "Named Evaluator",
        evaluatorScore: 8,
        evidenceReference: `EVID-SCORE-${profile.vendorId}`,
        overrideReason: null,
        overrideReasonRequired: false,
        lockState: "locked" as const,
        lockedBy: "eval-1",
        lockedAt: "2026-09-21T18:30:00Z",
      })),
    });
    const selectedVendor =
      decisionView.vendorSummaries.find(
        (summary) => summary.vendorId === decisionView.leadingVendorId,
      ) ?? decisionView.vendorSummaries[0];
    const selectionReadiness: SourceVendorSelectionReadiness = {
      eventId: profileSet.sourceEventId,
      eventName: profileSet.eventName,
      generatedAt: profileSet.generatedAt,
      readinessStatus: "ready_for_selection_review",
      selectionPosture: "ready_for_selection_review",
      selectionReviewReady: true,
      viableVendors: [selectedVendor.vendorName],
      blockedVendors: [],
      unresolvedCommercialIssues: [],
      unresolvedEvidenceIssues: [],
      unresolvedGateIssues: [],
      requiredArtifacts: [],
      requiredApprovals: [],
      requiredApprovalsForSelection: [],
      recommendedNextAction:
        "Proceed to named human selection review after BAFO conditions are recorded.",
      nexusRecommendation:
        "Use the named selection memo as evidence for Stage 08 readiness.",
      sentinelCautions: [],
      stewardGateNotes: [],
      atlasExecutiveImplication:
        "Selection review can proceed only as named human evidence, not as an automated award.",
      sourceModulesUsed: ["synthetic-acceptance-spine"],
      rationale:
        "Synthetic read-only fixture proves a completed named selection posture without invoking tenant writes.",
    };

    const spine = buildSourceStage08AcceptanceSpine({
      evaluation: {
        profileSet,
        challengeIntelligence,
        bafoInstructionPack: bafoPack,
        decisionView,
        scorecardAuthorityView,
      },
      handoff: {
        event: {
          id: profileSet.sourceEventId,
          name: profileSet.eventName,
          currentStageKey: "transition",
          currentStageLabel: "Transition",
          stages: [
            {
              key: "selection",
              label: "Selection",
              status: "complete",
              gate: { status: "approved" },
            },
            {
              key: "executive_decision",
              label: "Executive Decision",
              status: "complete",
              gate: { status: "approved" },
            },
            {
              key: "transition",
              label: "Transition",
              status: "active",
              gate: { status: "ready" },
            },
          ],
          artifacts: [
            approvedArtifact(
              "D27-SELECTION-MEMO",
              "d27_selection_memo",
              `Reviewed selection memo names ${selectedVendor.vendorName}, named approval authority, and evidence lineage.`,
              "locked",
            ),
            approvedArtifact(
              "PRICING-APPROVED",
              "Approved pricing schedule",
              "Approved pricing exhibit with evidence lineage.",
              "locked",
            ),
            approvedArtifact(
              "CLAUSE-LIBRARY",
              "Governed clause library references",
              "Approved clause positions with fallback provenance.",
              "locked",
            ),
            approvedArtifact(
              "SOW-SCOPE",
              "SOW scope schedule",
              "Statement of work scope, service boundary, and exclusions.",
              "locked",
            ),
            approvedArtifact(
              "APPROVAL-AUTHORITY",
              "Named approval authority",
              "Approval authority by value and sourcing archetype.",
              "locked",
            ),
            approvedArtifact(
              "LINEAGE",
              "Evidence lineage packet",
              "Evidence-backed lineage for selection, price, SOW, and clauses.",
              "locked",
            ),
            approvedArtifact(
              "SLA-PROVENANCE",
              "SLA and service credit provenance",
              "SLA targets, service credits, and measurement basis traced to source evidence.",
              "locked",
            ),
            approvedArtifact(
              "EXIT-PROVENANCE",
              "Exit rights and termination provenance",
              "Exit assistance, termination for convenience, data return, and renewal notice provenance.",
              "locked",
            ),
            approvedArtifact(
              "CHANGE-CONTROL-PROVENANCE",
              "Change-control provenance",
              "Change order governance, rate-card adjustment, and scope-change approval provenance.",
              "locked",
            ),
            approvedArtifact(
              "EXECUTED-MSA-SOW",
              "Executed agreement and SOW",
              "Signed agreement and executed SOW accepted as evidence, with named signature authority and document hash recorded.",
              "locked",
            ),
          ],
        },
        selectionReadiness,
      },
    });

    expect(spine.status).toBe("passed_read_only_acceptance");
    expect(spine.steps.map((step) => step.key)).toEqual([
      "normalized_response_questions",
      "evaluator_scorecard",
      "pricing_tco_comparison",
      "clarification_bafo_round",
      "named_human_selection_evidence",
      "award_sow_formation_readiness",
      "canonical_contract_handoff",
      "optimize_route_identity",
    ]);
    expect(spine.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "normalized_response_questions",
          status: "passed",
          evidence: expect.arrayContaining([
            expect.stringContaining("section-7"),
          ]),
        }),
        expect.objectContaining({
          key: "evaluator_scorecard",
          status: "passed",
          evidence: expect.arrayContaining([
            expect.stringContaining("Named Evaluator"),
          ]),
        }),
        expect.objectContaining({
          key: "pricing_tco_comparison",
          status: "passed",
          evidence: expect.arrayContaining([expect.stringContaining("$96.4M")]),
        }),
        expect.objectContaining({
          key: "clarification_bafo_round",
          status: "passed",
          evidence: expect.arrayContaining([
            expect.stringContaining("BAFO Round 1"),
          ]),
        }),
        expect.objectContaining({
          key: "named_human_selection_evidence",
          status: "passed",
          evidence: expect.arrayContaining([
            expect.stringContaining(selectedVendor.vendorName),
          ]),
        }),
        expect.objectContaining({
          key: "award_sow_formation_readiness",
          status: "passed",
          evidence: expect.arrayContaining(["ready_for_contract360_handoff"]),
        }),
        expect.objectContaining({
          key: "canonical_contract_handoff",
          status: "passed",
          evidence: expect.arrayContaining([
            expect.stringContaining(
              "pending_canonical_contract:client-a-test-event:EXECUTED-MSA-SOW",
            ),
          ]),
        }),
        expect.objectContaining({
          key: "optimize_route_identity",
          status: "passed",
          evidence: expect.arrayContaining(["/source/optimize"]),
        }),
      ]),
    );
    expect(spine.writeAuthority).toEqual({
      tenantWriteAuthorized: false,
      canonicalContractWriteAllowed: false,
      contract360PublicationAllowed: false,
      optimizeLaunchAllowed: false,
      supplierContactAuthorized: false,
      awardApproved: false,
      signatureFabricated: false,
    });
    expect(JSON.stringify(spine)).not.toMatch(
      /supplier contacted|award approved|signature fabricated|realized savings/i,
    );

    const { container } = render(
      React.createElement(SourceAwardSowHandoffReadinessPanel, {
        readiness: spine.handoffReadiness,
        acceptanceSpine: spine,
      }),
    );
    expect(
      screen.getByText("Acceptance spine: passed read only acceptance"),
    ).toBeTruthy();
    expect(
      container
        .querySelector("[data-stage08-acceptance-status]")
        ?.getAttribute("data-stage08-acceptance-status"),
    ).toBe("passed_read_only_acceptance");
  });
});
