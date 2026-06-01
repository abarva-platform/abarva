// Human decision controls for AI-assisted recommendations.
//
// This module is intentionally pure and deterministic. It is the shared
// contract used by agent prompts, output sanitizers, export QA, policy pages,
// and tests to keep AbarVa in a decision-support posture: the product can
// recommend and explain, but the client-side human owns the final decision.

export const HUMAN_DECISION_CONTROLS_VERSION = '2026-06-01.ai-liability-v1';

export const AI_DECISION_SUPPORT_WATERMARK =
  'AI-assisted decision support - human review and client approval required.';

export const HUMAN_DECISION_ATTESTATION_TEXT =
  'I reviewed the AI-assisted recommendation, cited evidence, assumptions, missing data, and alternatives. I understand that the final business decision is made by the client decision owner, not by AbarVa or the AI tool.';

export const AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK = [
  'HUMAN DECISION ACCOUNTABILITY:',
  `- Treat every recommendation as decision support, not an autonomous decision. Version: ${HUMAN_DECISION_CONTROLS_VERSION}.`,
  '- Never say AbarVa, Nexus, Sentinel, Atlas, Steward, the model, or the tool approved, decided, selected, authorized, signed off, or must choose a consequential action.',
  '- Use advisor wording: candidate recommendation, option for review, evidence-backed next move, human approval required, client decision owner.',
  '- For consequential recommendations, name the missing data, assumptions, evidence basis, confidence limits, and what would change the recommendation.',
  '- For high-risk uses involving employment, healthcare treatment, credit, insurance, legal determinations, regulated consumer decisions, safety, or individual rights, require human/legal/admin escalation before action.',
  '- If an output could be exported, approved, or converted into action, include the client decision owner or say that the owner is missing.',
].join('\n');

export type AiDecisionRiskDomain =
  | 'employment'
  | 'healthcare_treatment'
  | 'credit'
  | 'insurance'
  | 'legal'
  | 'regulated_consumer'
  | 'safety'
  | 'individual_rights'
  | 'procurement'
  | 'financial_commitment'
  | 'general_business';

export interface AiDecisionOwner {
  readonly name: string;
  readonly title: string;
  readonly tenantName: string;
  readonly userId?: string | null;
}

export interface AiDecisionPolicy {
  readonly policyId: string;
  readonly clientKey: string;
  readonly approvalsByDomain: Readonly<Record<AiDecisionRiskDomain, readonly string[]>>;
  readonly requireDecisionOwner: boolean;
  readonly requireAttestation: boolean;
  readonly requireMissingDataBanner: boolean;
  readonly requireExportWatermark: boolean;
  readonly requireOverrideCapture: boolean;
  readonly requireLegalEscalationForHighRisk: boolean;
}

export interface AiDecisionEvidencePacketInput {
  readonly recommendationId: string;
  readonly surface: string;
  readonly agentName: 'Nexus' | 'Sentinel' | 'Atlas' | 'Steward' | 'AbarVa';
  readonly tenantName: string;
  readonly decisionOwner?: AiDecisionOwner | null;
  readonly recommendationText: string;
  readonly evidenceIds: readonly string[];
  readonly missingInputs: readonly string[];
  readonly assumptions: readonly string[];
  readonly alternativesConsidered: readonly string[];
  readonly humanRationale?: string | null;
  readonly overrideDisposition?: 'accepted' | 'modified' | 'rejected' | 'more_evidence_requested' | null;
  readonly riskDomains?: readonly AiDecisionRiskDomain[];
}

export interface AiDecisionEvidencePacket {
  readonly recommendationId: string;
  readonly version: string;
  readonly surface: string;
  readonly agentName: AiDecisionEvidencePacketInput['agentName'];
  readonly tenantName: string;
  readonly decisionOwner: AiDecisionOwner | null;
  readonly recommendationText: string;
  readonly sanitizedRecommendationText: string;
  readonly evidenceIds: readonly string[];
  readonly missingInputs: readonly string[];
  readonly assumptions: readonly string[];
  readonly alternativesConsidered: readonly string[];
  readonly humanRationale: string | null;
  readonly overrideDisposition: AiDecisionEvidencePacketInput['overrideDisposition'];
  readonly riskDomains: readonly AiDecisionRiskDomain[];
  readonly highRisk: boolean;
  readonly escalationRequired: boolean;
  readonly attestationText: string;
  readonly exportWatermark: string;
  readonly missingDataBanner: string;
}

export interface AiDecisionPacketValidation {
  readonly passed: boolean;
  readonly failures: readonly string[];
}

export const HIGH_RISK_AI_DECISION_DOMAINS: readonly AiDecisionRiskDomain[] = [
  'employment',
  'healthcare_treatment',
  'credit',
  'insurance',
  'legal',
  'regulated_consumer',
  'safety',
  'individual_rights',
];

export const DEFAULT_CLIENT_AI_DECISION_POLICY: AiDecisionPolicy = {
  policyId: 'client-ai-decision-policy-v1',
  clientKey: '*',
  approvalsByDomain: {
    employment: ['Legal', 'People', 'Executive sponsor'],
    healthcare_treatment: ['Clinical leader', 'Legal', 'Compliance'],
    credit: ['Legal', 'Compliance', 'Executive sponsor'],
    insurance: ['Legal', 'Compliance', 'Executive sponsor'],
    legal: ['Legal'],
    regulated_consumer: ['Legal', 'Compliance'],
    safety: ['Operations leader', 'Legal', 'Executive sponsor'],
    individual_rights: ['Legal', 'Compliance', 'Executive sponsor'],
    procurement: ['Procurement', 'Finance', 'Legal'],
    financial_commitment: ['Finance', 'Executive sponsor'],
    general_business: ['Decision owner'],
  },
  requireDecisionOwner: true,
  requireAttestation: true,
  requireMissingDataBanner: true,
  requireExportWatermark: true,
  requireOverrideCapture: true,
  requireLegalEscalationForHighRisk: true,
};

const AUTONOMOUS_DECISION_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bAbarVa\s+(?:decided|approved|selected|authorized|signed off)\b/gi, 'The client decision owner reviewed'],
  [/\b(?:Nexus|Sentinel|Atlas|Steward)\s+(?:decided|approved|selected|authorized|signed off)\b/gi, 'The AI advisor recommended for human review'],
  [/\bthe\s+(?:tool|model|AI|system)\s+(?:decided|approved|selected|authorized|signed off)\b/gi, 'the AI-assisted workflow recommended for human review'],
  [/\bmust\s+(?:select|choose|approve|award|fund|terminate|renew)\b/gi, 'should review whether to'],
  [/\bautomatic(?:ally)?\s+(?:approval|approved|decision|selected|selects|authorizes|authorized)\b/gi, 'human-approved decision support'],
  [/\bfinal\s+approval\s+is\s+complete\b/gi, 'final approval requires client decision-owner confirmation'],
];

export function sanitizeAutonomousDecisionLanguage(text: string): string {
  return AUTONOMOUS_DECISION_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text,
  );
}

export function classifyAiDecisionRisk(input: {
  readonly text: string;
  readonly domains?: readonly AiDecisionRiskDomain[];
}): { readonly domains: readonly AiDecisionRiskDomain[]; readonly highRisk: boolean; readonly escalationRequired: boolean } {
  const lower = input.text.toLowerCase();
  const inferred = new Set<AiDecisionRiskDomain>(input.domains ?? []);
  if (/\b(hire|hiring|promotion|terminate|termination|layoff|performance review|candidate|employee)\b/.test(lower)) inferred.add('employment');
  if (/\b(clinical|diagnosis|treatment|patient|triage|prior auth|medical necessity)\b/.test(lower)) inferred.add('healthcare_treatment');
  if (/\b(credit|loan|underwriting|eligibility|credit limit)\b/.test(lower)) inferred.add('credit');
  if (/\b(insurance|claim denial|premium|coverage)\b/.test(lower)) inferred.add('insurance');
  if (/\b(legal|lawsuit|contract breach|liability|privilege)\b/.test(lower)) inferred.add('legal');
  if (/\b(regulated consumer|consumer eligibility|adverse action)\b/.test(lower)) inferred.add('regulated_consumer');
  if (/\b(safety|life safety|physical harm)\b/.test(lower)) inferred.add('safety');
  if (/\b(individual rights|protected class|privacy rights|civil rights)\b/.test(lower)) inferred.add('individual_rights');
  if (/\b(vendor|supplier|award|renewal|rfp|bafo|procurement)\b/.test(lower)) inferred.add('procurement');
  if (/\b(fund|capital|budget|spend|savings|roi|investment)\b/.test(lower)) inferred.add('financial_commitment');
  if (inferred.size === 0) inferred.add('general_business');

  const domains = Array.from(inferred).sort();
  const highRisk = domains.some((domain) => HIGH_RISK_AI_DECISION_DOMAINS.includes(domain));
  return { domains, highRisk, escalationRequired: highRisk };
}

export function buildMissingDataBanner(input: {
  readonly missingInputs: readonly string[];
  readonly assumptions: readonly string[];
  readonly whatWouldChange?: readonly string[];
}): string {
  const missing = input.missingInputs.length > 0
    ? input.missingInputs.join('; ')
    : 'No missing inputs were recorded.';
  const assumptions = input.assumptions.length > 0
    ? input.assumptions.join('; ')
    : 'No assumptions were recorded.';
  const change = input.whatWouldChange && input.whatWouldChange.length > 0
    ? ` What would change this recommendation: ${input.whatWouldChange.join('; ')}.`
    : '';
  return `Decision-support limits: missing inputs: ${missing}. Assumptions: ${assumptions}.${change}`;
}

export function buildAiDecisionEvidencePacket(
  input: AiDecisionEvidencePacketInput,
): AiDecisionEvidencePacket {
  const risk = classifyAiDecisionRisk({
    text: input.recommendationText,
    domains: input.riskDomains,
  });
  return {
    recommendationId: input.recommendationId,
    version: HUMAN_DECISION_CONTROLS_VERSION,
    surface: input.surface,
    agentName: input.agentName,
    tenantName: input.tenantName,
    decisionOwner: input.decisionOwner ?? null,
    recommendationText: input.recommendationText,
    sanitizedRecommendationText: sanitizeAutonomousDecisionLanguage(input.recommendationText),
    evidenceIds: input.evidenceIds,
    missingInputs: input.missingInputs,
    assumptions: input.assumptions,
    alternativesConsidered: input.alternativesConsidered,
    humanRationale: input.humanRationale ?? null,
    overrideDisposition: input.overrideDisposition ?? null,
    riskDomains: risk.domains,
    highRisk: risk.highRisk,
    escalationRequired: risk.escalationRequired,
    attestationText: HUMAN_DECISION_ATTESTATION_TEXT,
    exportWatermark: AI_DECISION_SUPPORT_WATERMARK,
    missingDataBanner: buildMissingDataBanner({
      missingInputs: input.missingInputs,
      assumptions: input.assumptions,
      whatWouldChange: input.alternativesConsidered,
    }),
  };
}

export function validateAiDecisionEvidencePacket(
  packet: AiDecisionEvidencePacket,
  policy: AiDecisionPolicy = DEFAULT_CLIENT_AI_DECISION_POLICY,
): AiDecisionPacketValidation {
  const failures: string[] = [];
  if (policy.requireDecisionOwner && !packet.decisionOwner) failures.push('missing_decision_owner');
  if (policy.requireAttestation && !packet.attestationText) failures.push('missing_human_attestation');
  if (policy.requireMissingDataBanner && !packet.missingDataBanner) failures.push('missing_data_banner');
  if (policy.requireExportWatermark && !packet.exportWatermark) failures.push('missing_export_watermark');
  if (packet.evidenceIds.length === 0) failures.push('missing_evidence_ids');
  if (packet.assumptions.length === 0) failures.push('missing_assumptions');
  if (packet.missingInputs.length === 0) failures.push('missing_missing_inputs_record');
  if (policy.requireOverrideCapture && !packet.overrideDisposition) failures.push('missing_human_override_or_acceptance');
  if (policy.requireLegalEscalationForHighRisk && packet.highRisk && !packet.escalationRequired) failures.push('missing_high_risk_escalation');
  if (packet.sanitizedRecommendationText !== sanitizeAutonomousDecisionLanguage(packet.sanitizedRecommendationText)) {
    failures.push('autonomous_decision_language_present');
  }
  return { passed: failures.length === 0, failures };
}

export type NistAiRmfFunction = 'govern' | 'map' | 'measure' | 'manage';

export interface ModelRiskRegisterEntry {
  readonly id: string;
  readonly surface: string;
  readonly intendedUse: string;
  readonly riskDomains: readonly AiDecisionRiskDomain[];
  readonly humanOversight: string;
  readonly nistAiRmfFunctions: readonly NistAiRmfFunction[];
  readonly monitoring: readonly string[];
  readonly limitations: readonly string[];
  readonly ownerRole: string;
  readonly reviewCadence: string;
}

export const MODEL_RISK_REGISTER: readonly ModelRiskRegisterEntry[] = [
  {
    id: 'mrr-agent-recommendations',
    surface: 'Nexus/Sentinel/Atlas/Steward chat',
    intendedUse: 'Generate evidence-backed decision-support recommendations for enterprise operators.',
    riskDomains: ['general_business', 'procurement', 'financial_commitment'],
    humanOversight: 'Named client decision owner reviews evidence, missing inputs, assumptions, and alternatives before action.',
    nistAiRmfFunctions: ['govern', 'map', 'measure', 'manage'],
    monitoring: ['language sanitizer regression', 'evidence packet QA', 'tenant isolation scan'],
    limitations: ['No autonomous approval', 'No action without client owner', 'No high-risk use without escalation'],
    ownerRole: 'AbarVa platform owner',
    reviewCadence: 'monthly during pilot',
  },
  {
    id: 'mrr-high-risk-classifier',
    surface: 'AI decision policy gate',
    intendedUse: 'Detect high-risk AI decision domains and route them to legal/admin review.',
    riskDomains: HIGH_RISK_AI_DECISION_DOMAINS,
    humanOversight: 'Legal, compliance, clinical, people, or executive approver required by domain.',
    nistAiRmfFunctions: ['govern', 'map', 'manage'],
    monitoring: ['classifier keyword coverage', 'blocked-domain audit sampling'],
    limitations: ['Keyword classifier is conservative and may over-escalate ambiguous language'],
    ownerRole: 'AbarVa governance owner',
    reviewCadence: 'before each pilot gate',
  },
];

export const COUNSEL_REVIEW_CHECKLIST: readonly string[] = [
  'MSA states AbarVa provides AI-assisted decision support, not autonomous decisions.',
  'SOW requires client validation of evidence, assumptions, missing data, and final business judgment.',
  'Client decision owner and approval role are captured for consequential recommendations.',
  'High-risk uses require legal/admin escalation or are prohibited by default.',
  'Warranty, reliance, indemnity, limitation of liability, and prohibited-use language match the product controls.',
  'Exports and board packs carry the AI-assisted decision-support watermark and human attestation language.',
];
