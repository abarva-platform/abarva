import {
  MOVES_HUMAN_RATIONALE_MIN_CHARS,
  appendMovesDecisionSupportToSnapshot,
  buildMovesGateApprovalEvidencePacket,
  buildMovesPhaseDecisionAuditRefs,
  buildMovesPhaseDecisionEvidencePacket,
  validateMovesHumanRationale,
} from "../moves-ai-liability";
import {
  AI_DECISION_SUPPORT_WATERMARK,
  HUMAN_DECISION_ATTESTATION_TEXT,
} from "@/lib/ai-liability/human-decision-controls";

const owner = {
  name: "Maya Patel",
  title: "CFO",
  tenantName: "Apex Retail",
  userId: "user_1",
};

describe("moves-ai-liability", () => {
  it("requires a human rationale long enough to be auditable", () => {
    expect(validateMovesHumanRationale("too short")).toContain(
      `${MOVES_HUMAN_RATIONALE_MIN_CHARS} characters`,
    );
    expect(
      validateMovesHumanRationale(
        "Reviewed evidence and approved the gate advance for the next phase.",
      ),
    ).toBeNull();
  });

  it("builds a valid evidence packet for a Moves phase gate decision", () => {
    const packet = buildMovesPhaseDecisionEvidencePacket({
      programId: "APX-01",
      tenantName: "Apex Retail",
      fromPhase: 2,
      toPhase: 3,
      gateCriterion: "Design evidence reviewed",
      humanRationale:
        "I reviewed the design evidence, open assumptions, and sponsor readiness before approving.",
      decisionOwner: owner,
    });

    expect(packet.recommendationId).toBe("moves-phase-gate:APX-01:P2->P3");
    expect(packet.decisionOwner).toEqual(owner);
    expect(packet.humanRationale).toContain("design evidence");
    expect(packet.exportWatermark).toBe(AI_DECISION_SUPPORT_WATERMARK);
    expect(packet.attestationText).toBe(HUMAN_DECISION_ATTESTATION_TEXT);
    expect(packet.evidenceIds).toContain("program:APX-01");
    expect(packet.assumptions.length).toBeGreaterThan(0);
    expect(packet.missingInputs.length).toBeGreaterThan(0);
  });

  it("adds decision-support evidence to the phase snapshot and audit refs", () => {
    const packet = buildMovesPhaseDecisionEvidencePacket({
      programId: "APX-01",
      tenantName: "Apex Retail",
      fromPhase: 1,
      toPhase: 2,
      gateCriterion: "Sponsor commitment ready",
      humanRationale:
        "Sponsor commitment and value evidence were reviewed before approving this advance.",
      decisionOwner: owner,
      evidenceIds: ["evidence:charter"],
    });

    expect(buildMovesPhaseDecisionAuditRefs(packet)).toEqual([
      "moves-phase-gate:APX-01:P1->P2",
      "evidence:charter",
    ]);
    expect(
      appendMovesDecisionSupportToSnapshot({ advancedAt: "now" }, packet),
    ).toMatchObject({
      advancedAt: "now",
      humanRationale: packet.humanRationale,
      humanDecisionControlsVersion: packet.version,
      aiDecisionSupportWatermark: AI_DECISION_SUPPORT_WATERMARK,
      humanDecisionAttestation: HUMAN_DECISION_ATTESTATION_TEXT,
    });
  });

  it("builds a criterion-level gate approval evidence bundle", () => {
    const packet = buildMovesGateApprovalEvidencePacket({
      instanceId: "APX-01",
      tenantName: "Apex Retail",
      criterionId: "sponsor-readiness",
      action: "approve",
      humanRationale:
        "I reviewed sponsor evidence and accept this gate criterion for approval.",
      decisionOwner: owner,
    });

    expect(packet.recommendationId).toBe(
      "moves-gate-approval:APX-01:sponsor-readiness:approve",
    );
    expect(packet.surface).toBe("Moves gate approval");
    expect(packet.humanRationale).toContain("sponsor evidence");
    expect(packet.evidenceIds).toContain("reasoning-gate:APX-01:sponsor-readiness");
    expect(packet.overrideDisposition).toBe("accepted");
  });
});
