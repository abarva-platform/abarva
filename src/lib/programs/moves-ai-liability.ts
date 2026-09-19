import {
  AI_DECISION_SUPPORT_WATERMARK,
  HUMAN_DECISION_ATTESTATION_TEXT,
  HUMAN_DECISION_RATIONALE_MIN_CHARS,
  buildAiDecisionEvidencePacket,
  validateAiDecisionEvidencePacket,
  type AiDecisionEvidencePacket,
  type AiDecisionOwner,
} from "@/lib/ai-liability/human-decision-controls";

/**
 * Moves states the minimum its UI counts against; the number itself is the
 * shared one, so the surface and the shared validator cannot drift apart.
 */
export const MOVES_HUMAN_RATIONALE_MIN_CHARS = HUMAN_DECISION_RATIONALE_MIN_CHARS;

export interface MovesPhaseDecisionInput {
  readonly programId: string;
  readonly tenantName: string;
  readonly fromPhase: number;
  readonly toPhase: number;
  readonly gateCriterion: string;
  readonly humanRationale: string;
  readonly decisionOwner: AiDecisionOwner;
  readonly evidenceIds?: readonly string[];
  readonly missingInputs?: readonly string[];
  readonly assumptions?: readonly string[];
  readonly alternativesConsidered?: readonly string[];
  readonly overrideDisposition?:
    | "accepted"
    | "modified"
    | "rejected"
    | "more_evidence_requested";
}

export interface MovesGateApprovalDecisionInput {
  readonly instanceId: string;
  readonly tenantName: string;
  readonly criterionId: string;
  readonly humanRationale: string;
  readonly action: "approve" | "reject";
  readonly decisionOwner: AiDecisionOwner;
  readonly evidenceIds?: readonly string[];
  readonly missingInputs?: readonly string[];
  readonly assumptions?: readonly string[];
  readonly alternativesConsidered?: readonly string[];
}

export function normalizeMovesHumanRationale(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function validateMovesHumanRationale(value: unknown): string | null {
  const rationale = normalizeMovesHumanRationale(value);
  if (rationale.length < MOVES_HUMAN_RATIONALE_MIN_CHARS) {
    return `Human rationale must be at least ${MOVES_HUMAN_RATIONALE_MIN_CHARS} characters.`;
  }
  return null;
}

/**
 * The rationale is the only part of an evidence packet a human wrote. Every UI
 * and route that builds one already refuses a rationale too short to audit.
 * `validateAiDecisionEvidencePacket` now reads the field too, for any packet
 * that records a human decision, so this throw is the earlier and more
 * specific of two checks rather than the only one. It is kept because it names
 * the surface in the error and fails at assembly, before a packet exists.
 */
function requireAuditableHumanRationale(value: unknown, context: string): string {
  const rationale = normalizeMovesHumanRationale(value);
  const error = validateMovesHumanRationale(rationale);
  if (error) {
    throw new Error(`${context} failed validation: ${error}`);
  }
  return rationale;
}

export function coerceDecisionSupportList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildMovesPhaseDecisionEvidencePacket(
  input: MovesPhaseDecisionInput,
): AiDecisionEvidencePacket {
  const transitionLabel = `P${input.fromPhase}->P${input.toPhase}`;
  const evidenceIds = input.evidenceIds?.length
    ? input.evidenceIds
    : [
        `moves:${input.programId}:${transitionLabel}`,
        `program:${input.programId}`,
      ];
  const missingInputs = input.missingInputs?.length
    ? input.missingInputs
    : ["Reviewer did not declare additional missing inputs at approval time."];
  const assumptions = input.assumptions?.length
    ? input.assumptions
    : [
        "Gate evaluator, program evidence, and reviewer-visible context are current at approval time.",
      ];
  const alternativesConsidered = input.alternativesConsidered?.length
    ? input.alternativesConsidered
    : [
        "Hold the Move in the current phase until more evidence is collected.",
        "Reject the advance and keep open criteria visible for remediation.",
      ];

  const packet = buildAiDecisionEvidencePacket({
    recommendationId: `moves-phase-gate:${input.programId}:${transitionLabel}`,
    surface: "Moves phase gate",
    agentName: "Nexus",
    tenantName: input.tenantName,
    decisionOwner: input.decisionOwner,
    recommendationText: `Advance ${input.programId} from P${input.fromPhase} to P${input.toPhase}: ${input.gateCriterion}`,
    evidenceIds,
    missingInputs,
    assumptions,
    alternativesConsidered,
    humanRationale: requireAuditableHumanRationale(
      input.humanRationale,
      "Moves decision evidence packet",
    ),
    overrideDisposition: input.overrideDisposition ?? "accepted",
    riskDomains: ["financial_commitment", "general_business"],
  });

  const validation = validateAiDecisionEvidencePacket(packet);
  if (!validation.passed) {
    throw new Error(
      `Moves decision evidence packet failed validation: ${validation.failures.join(", ")}`,
    );
  }

  return packet;
}

export function buildMovesGateApprovalEvidencePacket(
  input: MovesGateApprovalDecisionInput,
): AiDecisionEvidencePacket {
  const evidenceIds = input.evidenceIds?.length
    ? input.evidenceIds
    : [`reasoning-gate:${input.instanceId}:${input.criterionId}`];
  const missingInputs = input.missingInputs?.length
    ? input.missingInputs
    : ["Criterion-level approval did not record additional missing inputs."];
  const assumptions = input.assumptions?.length
    ? input.assumptions
    : ["Reviewer-visible gate evidence was current at approval time."];
  const alternativesConsidered = input.alternativesConsidered?.length
    ? input.alternativesConsidered
    : [
        "Reject the gate criterion until more evidence is supplied.",
        "Request more evidence before accepting the criterion.",
      ];

  const packet = buildAiDecisionEvidencePacket({
    recommendationId: `moves-gate-approval:${input.instanceId}:${input.criterionId}:${input.action}`,
    surface: "Moves gate approval",
    agentName: "Nexus",
    tenantName: input.tenantName,
    decisionOwner: input.decisionOwner,
    recommendationText: `${input.action === "approve" ? "Approve" : "Reject"} gate criterion ${input.criterionId} for ${input.instanceId}`,
    evidenceIds,
    missingInputs,
    assumptions,
    alternativesConsidered,
    humanRationale: requireAuditableHumanRationale(
      input.humanRationale,
      "Moves gate approval evidence packet",
    ),
    overrideDisposition: input.action === "approve" ? "accepted" : "rejected",
    riskDomains: ["financial_commitment", "general_business"],
  });

  const validation = validateAiDecisionEvidencePacket(packet);
  if (!validation.passed) {
    throw new Error(
      `Moves gate approval evidence packet failed validation: ${validation.failures.join(", ")}`,
    );
  }

  return packet;
}

export function buildMovesPhaseDecisionAuditRefs(
  packet: AiDecisionEvidencePacket,
): string[] {
  return Array.from(new Set([packet.recommendationId, ...packet.evidenceIds]));
}

export function appendMovesDecisionSupportToSnapshot(
  snapshot: Record<string, unknown>,
  packet: AiDecisionEvidencePacket,
): Record<string, unknown> {
  return {
    ...snapshot,
    humanRationale: packet.humanRationale,
    humanDecisionControlsVersion: packet.version,
    decisionOwner: packet.decisionOwner,
    aiDecisionEvidencePacket: packet,
    aiDecisionSupportWatermark: AI_DECISION_SUPPORT_WATERMARK,
    humanDecisionAttestation: HUMAN_DECISION_ATTESTATION_TEXT,
  };
}
