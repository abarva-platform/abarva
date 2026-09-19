/**
 * Backlog item 63. `validateAiDecisionEvidencePacket` checks the decision
 * owner, attestation, banner, watermark, evidence ids, assumptions, missing
 * inputs, override capture, high-risk escalation and autonomous language —
 * every field the product writes, and not the one field a human writes.
 *
 * The rationale minimum was enforced at the two Moves builders instead
 * (`requireAuditableHumanRationale`), so the rule is per-surface: the next
 * surface that records a human decision has to remember to enforce its own
 * minimum, and nothing tells it otherwise.
 *
 * These cases drive the shared validator, not a Moves wrapper, because the
 * shared validator is what a new surface would call.
 */
import {
  DEFAULT_CLIENT_AI_DECISION_POLICY,
  HUMAN_DECISION_RATIONALE_MIN_CHARS,
  buildAiDecisionEvidencePacket,
  validateAiDecisionEvidencePacket,
  type AiDecisionEvidencePacketInput,
} from "../human-decision-controls";
import { buildAtlasProgramPressureBrief } from "@/lib/tower/program-pressure-view";
import {
  buildTenantProgramControlTowerSignals,
  summarizeProgramControlTowerSignals,
} from "@/lib/programs/programs-control-tower-signals";
import { buildAllProgramsSeedPlan } from "@/lib/programs/enhancement-seed-planner";

const DECISION_OWNER = {
  name: "Example Decision Owner",
  title: "CIO",
  tenantName: "Example Industrials",
  userId: "user-example",
} as const;

/**
 * A packet with every non-rationale requirement satisfied, so the only thing a
 * failure can be attributed to is the rationale.
 */
function buildDecisionPacket(
  overrides: Partial<AiDecisionEvidencePacketInput> = {},
) {
  return buildAiDecisionEvidencePacket({
    recommendationId: "new-surface:example-01:award",
    surface: "A surface that did not exist when item 63 was written",
    agentName: "Sentinel",
    tenantName: "Example Industrials",
    decisionOwner: DECISION_OWNER,
    recommendationText: "Award the managed-services renewal to the incumbent.",
    evidenceIds: ["evidence-1"],
    missingInputs: ["final supplier concession"],
    assumptions: ["Current run-rate remains stable."],
    alternativesConsidered: ["Rebid", "Renegotiate"],
    humanRationale:
      "I reviewed the cited evidence and accept responsibility for this award.",
    overrideDisposition: "accepted",
    riskDomains: ["procurement", "financial_commitment"],
    ...overrides,
  });
}

describe("shared evidence packet — human rationale", () => {
  it("fails a human-decision packet whose rationale is too short to audit", () => {
    const packet = buildDecisionPacket({ humanRationale: "ok" });

    const validation = validateAiDecisionEvidencePacket(packet);

    expect(validation.passed).toBe(false);
    expect(validation.failures).toContain("insufficient_human_rationale");
  });

  it("fails a human-decision packet with no rationale at all", () => {
    const packet = buildDecisionPacket({ humanRationale: null });

    const validation = validateAiDecisionEvidencePacket(
      packet,
      DEFAULT_CLIENT_AI_DECISION_POLICY,
    );

    expect(validation.passed).toBe(false);
    expect(validation.failures).toContain("missing_human_rationale");
  });

  it("counts a whitespace-only rationale as no rationale", () => {
    const packet = buildDecisionPacket({ humanRationale: "   \n\t  " });

    expect(validateAiDecisionEvidencePacket(packet).failures).toContain(
      "missing_human_rationale",
    );
  });

  it("treats a packet that names a decision owner as recording a human decision, without being told", () => {
    // The default has to lean towards enforcement: a new surface that forgets
    // the flag is exactly the case item 63 describes.
    const packet = buildDecisionPacket({
      recordsHumanDecision: undefined,
      humanRationale: "fine",
    });

    expect(packet.recordsHumanDecision).toBe(true);
    expect(validateAiDecisionEvidencePacket(packet).failures).toContain(
      "insufficient_human_rationale",
    );
  });

  it("does not let an explicit brief declaration bypass decision markers", () => {
    const packet = buildDecisionPacket({
      recordsHumanDecision: false,
      humanRationale: "fine",
    });

    expect(packet.recordsHumanDecision).toBe(true);
    expect(validateAiDecisionEvidencePacket(packet).failures).toContain(
      "insufficient_human_rationale",
    );
  });

  it("passes a human-decision packet with an auditable rationale", () => {
    const packet = buildDecisionPacket();

    expect(packet.recordsHumanDecision).toBe(true);
    expect(packet.humanRationale?.length).toBeGreaterThanOrEqual(
      HUMAN_DECISION_RATIONALE_MIN_CHARS,
    );
    expect(validateAiDecisionEvidencePacket(packet)).toEqual({
      passed: true,
      failures: [],
    });
  });

  it("does not require a rationale of a brief, which records no human decision", () => {
    const brief = buildAiDecisionEvidencePacket({
      recommendationId: "tower-atlas-program-pressure-example-industrials",
      surface: "Tower / Atlas program pressure brief",
      agentName: "Atlas",
      tenantName: "Example Industrials",
      recordsHumanDecision: false,
      recommendationText: "Three programs are carrying unresolved delivery pressure.",
      evidenceIds: ["deterministic_seed:no_program_pressure_signals"],
      missingInputs: ["No additional missing inputs were recorded."],
      assumptions: ["Composed from deterministic Tower read-model signals."],
      alternativesConsidered: ["Wait for additional evidence."],
      riskDomains: ["general_business"],
    });

    expect(brief.recordsHumanDecision).toBe(false);
    expect(brief.humanRationale).toBeNull();
    expect(validateAiDecisionEvidencePacket(brief).failures).not.toContain(
      "missing_human_rationale",
    );
    expect(validateAiDecisionEvidencePacket(brief).failures).not.toContain(
      "insufficient_human_rationale",
    );
  });

  it("keeps the real Tower pressure brief buildable, rationale-free", () => {
    // The live brief is the reason a shared requirement cannot simply be
    // unconditional: it legitimately records no human decision, and a shared
    // requirement would refuse it.
    const tenant = buildAllProgramsSeedPlan().tenants.find(
      (candidate) => candidate.programs.length > 0,
    );
    expect(tenant).toBeDefined();
    const signals = buildTenantProgramControlTowerSignals(tenant!);
    const brief = buildAtlasProgramPressureBrief(
      tenant!,
      signals,
      summarizeProgramControlTowerSignals(signals),
    );

    expect(brief.accountability.humanApprovalRequired).toContain(
      "Human approval required",
    );
    expect(brief.accountability.sanitizedRecommendation.length).toBeGreaterThan(0);
  });
});
