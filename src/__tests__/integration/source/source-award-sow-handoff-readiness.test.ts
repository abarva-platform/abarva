import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildSourceAwardSowHandoffReadiness,
  formatSourceAwardSowHandoffReadinessAsMarkdown,
} from "@/lib/source/award-sow-handoff-readiness";
import type { SourceArtifactStatus, SourceStageKey } from "@/lib/source/types";
import type { SourceVendorSelectionReadiness } from "@/lib/source/vendor-selection-readiness-types";

const GENERATED_AT = "2026-04-26T00:00:00.000Z";

function selectionReadiness(
  overrides: Partial<SourceVendorSelectionReadiness> = {},
): SourceVendorSelectionReadiness {
  return {
    eventId: "event-stage08",
    eventName: "Stage 08 Test Event",
    generatedAt: GENERATED_AT,
    readinessStatus: "ready_for_selection_review",
    selectionPosture: "ready_for_selection_review",
    selectionReviewReady: true,
    viableVendors: ["Candidate A"],
    blockedVendors: [],
    unresolvedCommercialIssues: [],
    unresolvedEvidenceIssues: [],
    unresolvedGateIssues: [],
    requiredArtifacts: [],
    requiredApprovals: [],
    requiredApprovalsForSelection: [],
    recommendedNextAction: "Proceed to selection review.",
    nexusRecommendation: "Hold selection review.",
    sentinelCautions: [],
    stewardGateNotes: [],
    atlasExecutiveImplication: "Ready for review.",
    sourceModulesUsed: ["test"],
    rationale: "Test fixture.",
    ...overrides,
  };
}

function stage(key: SourceStageKey, status: string, gateStatus = "approved") {
  return {
    key,
    label: key,
    status,
    gate: {
      status: gateStatus,
      requiredArtifacts: [],
      blocker: gateStatus === "blocked" ? `${key} gate blocker` : null,
    },
  };
}

function artifact(
  id: string,
  title: string,
  status: SourceArtifactStatus,
  summary = title,
) {
  return {
    id,
    title,
    status,
    summary,
    sourceCount: 1,
  };
}

describe("Source Stage 08 Award & SOW handoff readiness", () => {
  it("distinguishes candidate selection, approval, agreement/SOW, and Contract 360 handoff", () => {
    const readiness = buildSourceAwardSowHandoffReadiness({
      generatedAt: GENERATED_AT,
      selectionReadiness: selectionReadiness(),
      event: {
        id: "event-stage08",
        name: "Stage 08 Test Event",
        currentStageKey: "transition",
        currentStageLabel: "Transition",
        stages: [
          stage("executive_decision", "complete"),
          stage("selection", "complete"),
          stage("transition", "active", "ready"),
        ],
        artifacts: [
          artifact("d27_selection_memo", "Selection memo", "approved"),
          artifact(
            "d24_decision_brief",
            "Executive decision brief",
            "approved",
          ),
          artifact(
            "d28_contract_record",
            "Signed contract record and SOW reference",
            "locked",
          ),
          artifact(
            "d29_transition_plan",
            "Transition plan handoff checklist",
            "approved",
          ),
        ],
      },
    });

    expect(readiness.readyForContract360Handoff).toBe(true);
    expect(readiness.readinessStatus).toBe("ready_for_contract360_handoff");
    expect(readiness.checkpoints.map((checkpoint) => checkpoint.key)).toEqual([
      "candidate_selection",
      "approval_readiness",
      "executed_agreement_sow",
      "contract360_handoff",
    ]);
    expect(
      readiness.checkpoints.every(
        (checkpoint) => checkpoint.blockers.length === 0,
      ),
    ).toBe(true);
    expect(readiness.recommendedNextAction).toBe(
      "Open Contract 360 handoff review and confirm the canonical contract record mapping.",
    );
  });

  it("blocks before handoff when executed agreement or SOW evidence is missing", () => {
    const readiness = buildSourceAwardSowHandoffReadiness({
      generatedAt: GENERATED_AT,
      selectionReadiness: selectionReadiness(),
      event: {
        id: "event-stage08-missing-sow",
        name: "Missing SOW Test Event",
        currentStageKey: "transition",
        currentStageLabel: "Transition",
        stages: [
          stage("executive_decision", "complete"),
          stage("selection", "complete"),
          stage("transition", "active", "ready"),
        ],
        artifacts: [
          artifact("d27_selection_memo", "Selection memo", "approved"),
          artifact(
            "d24_decision_brief",
            "Executive decision brief",
            "approved",
          ),
        ],
      },
    });

    expect(readiness.readyForContract360Handoff).toBe(false);
    expect(readiness.readinessStatus).toBe("blocked_executed_agreement_sow");
    expect(readiness.blockers).toContain(
      "Executed agreement or SOW evidence is not approved/locked in the event artifact record.",
    );
    expect(readiness.recommendedNextAction).toBe(readiness.blockers[0]);
  });

  it("does not treat a pending-signature contract record as executed agreement or SOW evidence", () => {
    const readiness = buildSourceAwardSowHandoffReadiness({
      generatedAt: GENERATED_AT,
      selectionReadiness: selectionReadiness(),
      event: {
        id: "event-stage08-pending-signature",
        name: "Pending Signature Test Event",
        currentStageKey: "transition",
        currentStageLabel: "Transition",
        stages: [
          stage("executive_decision", "complete"),
          stage("selection", "complete"),
          stage("transition", "active", "ready"),
        ],
        artifacts: [
          artifact("d27_selection_memo", "Selection memo", "approved"),
          artifact(
            "d24_decision_brief",
            "Executive decision brief",
            "approved",
          ),
          artifact(
            "d28_contract_record",
            "Contract record pending signature gap log",
            "locked",
            "Contract-ready pending signature; signed contract not uploaded; final SOW missing.",
          ),
        ],
      },
    });

    expect(readiness.readyForContract360Handoff).toBe(false);
    expect(readiness.readinessStatus).toBe("blocked_executed_agreement_sow");
    expect(
      readiness.checkpoints.find(
        (checkpoint) => checkpoint.key === "executed_agreement_sow",
      )?.status,
    ).toBe("blocked");
    expect(readiness.blockers).toContain(
      "Executed agreement or SOW evidence is not approved/locked in the event artifact record.",
    );
  });

  it("does not treat stage position as approval when selection readiness is blocked", () => {
    const readiness = buildSourceAwardSowHandoffReadiness({
      generatedAt: GENERATED_AT,
      selectionReadiness: selectionReadiness({
        readinessStatus: "blocked_gate_not_ready",
        selectionPosture: "blocked_gate_not_ready",
        selectionReviewReady: false,
        unresolvedGateIssues: ["Selection gate is still in review."],
      }),
      event: {
        id: "event-stage08-selection-blocked",
        name: "Selection Blocked Test Event",
        currentStageKey: "selection",
        currentStageLabel: "Selection",
        stages: [
          stage("executive_decision", "complete"),
          stage("selection", "active", "in_review"),
        ],
        artifacts: [
          artifact(
            "d24_decision_brief",
            "Executive decision brief",
            "approved",
          ),
          artifact(
            "d28_contract_record",
            "Signed contract record and SOW reference",
            "locked",
          ),
        ],
      },
    });

    expect(readiness.readinessStatus).toBe("blocked_candidate_selection");
    expect(readiness.checkpoints[0]?.blockers).toContain(
      "Selection gate is still in review.",
    );
    expect(readiness.readyForContract360Handoff).toBe(false);
  });

  it("returns stable markdown and keeps the verdict authority singular", () => {
    const readiness = buildSourceAwardSowHandoffReadiness({
      generatedAt: GENERATED_AT,
      selectionReadiness: selectionReadiness(),
      event: {
        id: "event-stage08",
        name: "Stage 08 Test Event",
        currentStageKey: "transition",
        currentStageLabel: "Transition",
        stages: [
          stage("executive_decision", "complete"),
          stage("selection", "complete"),
          stage("transition", "active", "ready"),
        ],
        artifacts: [
          artifact(
            "d28_contract_record",
            "Signed contract record and SOW reference",
            "locked",
          ),
        ],
      },
    });

    const markdown = formatSourceAwardSowHandoffReadinessAsMarkdown(readiness);
    expect(readiness.authority).toBe("source-award-sow-handoff-readiness");
    expect(markdown).toContain(
      "# Source Stage 08 Award & SOW Handoff Readiness",
    );
    expect(markdown).toContain("Candidate selection");
    expect(markdown).toContain("- Recommended next action:");
  });

  it("keeps Stage 08 readiness free from model, upload, database, and workflow writes", () => {
    const sources = [
      "src/lib/source/award-sow-handoff-readiness.ts",
      "src/lib/source/award-sow-handoff-readiness-types.ts",
      "src/components/source/SourceAwardSowHandoffReadinessPanel.tsx",
      "src/__tests__/integration/source/source-award-sow-handoff-readiness.test.ts",
    ]
      .map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"))
      .join("\n");

    expect(sources).not.toMatch(
      /from ['\"][^'\"]*(openai|anthropic|ai\/react|@anthropic-ai\/sdk)['\"]/i,
    );
    expect(sources).not.toMatch(
      /from ['\"][^'\"]*(upload|parser|parsing|artifact-drawer|workflow-engine|approval-engine)['\"]/i,
    );
    expect(sources).not.toMatch(
      /from ['\"][^'\"]*(database|supabase|migrations)['\"]/i,
    );
    expect(sources).not.toMatch(/\bfetch\(/i);
  });
});
