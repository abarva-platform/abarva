// Governed Source reasoning — the P0 fix.
//
// BEFORE: Source answer paths assembled evidence and called the model directly,
// hardcoding confidence to 'high' and never checking agent-readiness or tenant
// scope. For a multi-million-dollar sourcing decision that is the most dangerous
// defect possible: presenting weak or cross-tenant data as certain.
//
// AFTER: every Source answer flows through this seam. Candidate evidence is run
// through the governance contract (buildValidatedAgentContextBundle →
// evaluateGovernedObject). Only candidates that are agent_ready AND map to one
// of the archetype's evidence families may inform the answer. Confidence is
// DERIVED from how much of the archetype's required evidence is actually
// agent-ready — never hardcoded. Missing evidence is always named. If nothing is
// agent-ready, the agent REFUSES with insufficient_evidence.

import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
  type ValidatedAgentContextBundle,
} from '@/lib/governance/agent-context-bundle';
import type { GroundedSourceAnswerEnvelope, SourceEventArchetype } from './types';
import { requiredEvidenceFamilies } from './resolver';

/** A piece of evidence offered to the Source agent, tagged with its archetype family. */
export interface SourceEvidenceCandidate extends GovernedCandidate {
  /** Which archetype evidence family this candidate satisfies. */
  familyKey: string;
}

export interface GroundedSourceAnswerInput {
  archetype: SourceEventArchetype;
  tenantKey: string;
  eventId?: string | null;
  /** Candidate evidence (pre-resolved from the data plane, already tenant-scoped). */
  candidates: SourceEvidenceCandidate[];
  /** Claims the draft makes; any that cannot be backed by a citation are unsupported. */
  draftClaims?: Array<{ text: string; backedByCitation?: string }>;
  /** Allow sensitive (pii/phi) candidates — requires caller clearance. */
  allowSensitive?: boolean;
}

export interface GroundedSourceAnswer {
  envelope: GroundedSourceAnswerEnvelope;
  bundle: ValidatedAgentContextBundle;
  /** True when the agent may answer; false means it must refuse. */
  mayAnswer: boolean;
  refusalReason?: string;
}

/**
 * Confidence is a function of required-evidence coverage, not an assertion.
 *  - no agent-ready required evidence  → insufficient_evidence (refuse)
 *  - all required families agent-ready → high
 *  - ≥ half                            → medium
 *  - some but < half                   → low
 */
function deriveConfidence(requiredCovered: number, requiredTotal: number): GroundedSourceAnswerEnvelope['confidence'] {
  if (requiredTotal === 0) return requiredCovered > 0 ? 'medium' : 'insufficient_evidence';
  if (requiredCovered === 0) return 'insufficient_evidence';
  const ratio = requiredCovered / requiredTotal;
  if (ratio >= 1) return 'high';
  if (ratio >= 0.5) return 'medium';
  return 'low';
}

export function buildGroundedSourceAnswer(input: GroundedSourceAnswerInput): GroundedSourceAnswer {
  const { archetype, tenantKey, candidates } = input;

  // Hard tenant fence: a candidate from another tenant never participates.
  const tenantScoped = candidates.filter((c) => c.client_key === tenantKey);
  const crossTenant = candidates.filter((c) => c.client_key !== tenantKey);

  // Run the governance seam. Blocked (not agent_ready / not indexed / sensitive)
  // candidates are removed and never reach the model.
  const bundle = buildValidatedAgentContextBundle(tenantScoped, {
    allowSensitive: input.allowSensitive,
  });

  // Only candidates that (a) survived the governance bundle (not blocked) AND
  // (b) reached the promoted agent_ready rung may inform the answer. A
  // committed-but-not-promoted candidate is 'warn'-usable in the bundle but is
  // still NOT allowed to ground an answer — promotion is earned, not assumed.
  const usableById = new Set(bundle.usable.map((c) => c.id));
  const usableEvidence = tenantScoped.filter(
    (c) => usableById.has(c.id) && c.agent_readiness_status === 'agent_ready',
  );

  const required = requiredEvidenceFamilies(archetype);
  const requiredSet = new Set(required);
  const coveredRequired = new Set(
    usableEvidence.filter((c) => requiredSet.has(c.familyKey)).map((c) => c.familyKey),
  );
  const missingEvidence = required.filter((f) => !coveredRequired.has(f));

  const evidenceUsed = [...new Set(usableEvidence.map((c) => c.familyKey))];
  // Citations come only from the agent_ready evidence that grounds the answer —
  // not from warn-usable candidates that did not clear promotion.
  const citations = [...new Set(usableEvidence.flatMap((c) => c.citations ?? []))];

  // Unsupported claims: any draft claim without a citation present in the bundle.
  const citationSet = new Set(citations);
  const unsupportedClaims = (input.draftClaims ?? [])
    .filter((c) => !c.backedByCitation || !citationSet.has(c.backedByCitation))
    .map((c) => c.text);

  const confidence = deriveConfidence(coveredRequired.size, required.length);
  const mayAnswer = confidence !== 'insufficient_evidence';

  const envelope: GroundedSourceAnswerEnvelope = {
    tenantResolved: tenantKey,
    archetypeResolved: archetype.id,
    eventResolved: input.eventId ?? null,
    evidenceUsed,
    missingEvidence,
    citations,
    unsupportedClaims,
    confidence,
    specific: evidenceUsed.length > 0,
  };

  let refusalReason: string | undefined;
  if (!mayAnswer) {
    refusalReason =
      `No agent-ready evidence for ${archetype.id} (tenant ${tenantKey}). ` +
      `Missing required families: ${missingEvidence.join(', ') || 'none mapped'}. ` +
      (crossTenant.length ? `${crossTenant.length} cross-tenant candidate(s) were fenced. ` : '') +
      `Refusing rather than answering from ungoverned context.`;
  }

  return { envelope, bundle, mayAnswer, refusalReason };
}

/** A clean answer must be answerable, specific, and carry zero unsupported claims. */
export function isCleanGroundedAnswer(answer: GroundedSourceAnswer): boolean {
  return (
    answer.mayAnswer &&
    answer.envelope.specific &&
    answer.envelope.unsupportedClaims.length === 0
  );
}
